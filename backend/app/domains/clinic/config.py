from typing import Optional
from sqlalchemy.orm import Session
from app.chatbot.engine import BaseDomainAssistant
from app.domains.clinic.tool_schemas import TOOL_SCHEMAS
from app.domains.clinic import tools as tool_funcs
from app.models.identity import Patient

CLINIC_RULES = (
    "1. For any question about patient data, always use the most specific "
    "appropriate tool to retrieve the real data. Never answer from memory.\n"

    "2. Prefer a specific tool over a broad summary tool. For example, "
    "use get_patient_demographics for questions about the patient's name, "
    "date of birth, gender, blood type, nationality, or social status. "
    "Use get_contact_info for phone, email, or address. "
    "Use get_patient_summary only for general patient overview questions. "
    "Use get_full_patient_record only for broad requests for the complete "
    "patient history.\n"

    "3. If the tool returns no data or 'not recorded', say that the "
    "information is not recorded. Never invent or assume information.\n"

    "4. If a tool fails, tell the doctor that the information could not "
    "be retrieved. Never guess.\n"

    "5. 'Prescribed' means medications prescribed during a visit. "
    "Use get_visit_detail or get_visit_medical_acts for these questions. "
    "If no visit is specified, use the most recent visit. "
    "Use get_current_medications only for medications the patient is currently taking.\n"

    "6. When the doctor asks about all visits, visit history, or asks to "
    "compare visits (e.g., 'show me all visits', 'how has this patient "
    "progressed', 'compare the last two visits'), you must actively "
    "extract and compare the actual vital sign values recorded in each "
    "visit yourself — do not rely only on a tool's summary fields "
    "(such as 'conclusion', 'medications', or 'orders'). If a tool used "
    "for the comparison does not surface vital signs directly, also call "
    "get_visit_detail or get_sign_trend for the visits in question so you "
    "have the actual recorded values before answering.\n"

    "   a) For every vital sign that has a recorded value in at least two "
    "of the visits being compared (e.g., temperature, blood pressure, "
    "weight, heart rate, blood glucose), state directly whether it is "
    "increasing, decreasing, or stable — never conclude 'no vital signs "
    "were recorded' without first checking each visit's individual vitals "
    "fields, not just a summary tool's top-level output.\n"

    "   b) Only skip a vital sign if it is genuinely absent from at least "
    "one of the visits being compared. When a vital is recorded in only one "
    "of the two visits, note it separately using the format "
    "'- [Vital sign]: [value] (recorded only on [date])' — never use the "
    "'[old] → [new]' arrow format or a direction label for a vital that "
    "isn't present in both visits.\n"

    "   c) Use this exact format for each vital sign trend: "
    "'- [Vital sign]: [old value] → [new value] ([Increasing/Decreasing/Stable])'. "
    "List these under a 'Vital Sign Trends' heading, placed before any "
    "rule 6 safety warnings, in addition to — not instead of — a short "
    "summary of what changed clinically (conclusion, new medications, "
    "new orders) between the visits.\n"

    "   d) Do not add clinical interpretation or urgency language unless "
    "the change crosses a widely recognized clinical threshold. Otherwise, "
    "state the direction of change factually.\n"
)


AVAILABLE_FUNCTIONS = {
    "get_patient_demographics": tool_funcs.get_patient_demographics,
    "get_patient_summary": tool_funcs.get_patient_summary,
    "get_allergies": tool_funcs.get_allergies,
    "get_current_medications": tool_funcs.get_current_medications,
    "get_chronic_diseases": tool_funcs.get_chronic_diseases,
    "get_visit_detail": tool_funcs.get_visit_detail,
    "get_all_visits": tool_funcs.get_all_visits,
    "get_order_reason": tool_funcs.get_order_reason,
    "compare_last_two_visits": tool_funcs.compare_last_two_visits,
    "get_sign_trend": tool_funcs.get_sign_trend,
    "get_visit_medical_acts": tool_funcs.get_visit_medical_acts,
    "get_visit_signs_by_category": tool_funcs.get_visit_signs_by_category,
    "get_attached_files": tool_funcs.get_attached_files,
    "get_full_patient_record": tool_funcs.get_full_patient_record,
    "get_surgical_history": tool_funcs.get_surgical_history,
    "get_family_history": tool_funcs.get_family_history,
    "get_immunizations": tool_funcs.get_immunizations,
    "get_habits": tool_funcs.get_habits,
    "get_contact_info": tool_funcs.get_contact_info,
}


def _fetch_safety_data(db: Session, patient_id: int) -> dict:
    """
    One deterministic database fetch, used to build the guaranteed
    snapshot appended after every answer.

    EXPERIMENTAL ADDITIONS (testing whether more context helps rule 6):
    - habits: smoking/alcohol/drug use — affects real prescribing decisions
      (e.g. alcohol + Paracetamol raises liver toxicity risk).
    - recent_visit: kept as a local var for future use, not yet folded
      into the snapshot output below.
    """
    recent_visit = tool_funcs.get_visit_detail(db, patient_id=patient_id)
    return {
        "allergies": tool_funcs.get_allergies(db, patient_id=patient_id),
        "current_medications": tool_funcs.get_current_medications(db, patient_id=patient_id),
        "chronic_diseases": tool_funcs.get_chronic_diseases(db, patient_id=patient_id),
        "surgical_history": tool_funcs.get_surgical_history(db, patient_id=patient_id),
        "habits": tool_funcs.get_habits(db, patient_id=patient_id),
    }


def _format_safety_snapshot(data: dict, heading: str) -> str:
    def _join(items, formatter):
        values = [formatter(item) for item in items]
        values = [value for value in values if value]
        return "; ".join(values) if values else "None recorded"

    def _format_allergy(allergy: dict) -> str:
        allergen = str(allergy.get("allergen") or "").strip()
        reaction = str(allergy.get("reaction") or "").strip()

        placeholder_reactions = {
            "", "not recorded", "none", "unknown", "n/a", "na", "not specified",
        }

        if reaction.lower() in placeholder_reactions:
            return allergen or "Unknown allergy"

        return f"{allergen} ({reaction})" if allergen else f"Unknown allergy ({reaction})"

    def _format_habits(habits: dict) -> str:
        if not habits or habits.get("error"):
            return "None recorded"

        parts = []
        if habits.get("smoking_packs_per_day") not in (None, "not recorded", 0):
            parts.append(f"smoking ({habits['smoking_packs_per_day']} packs/day)")
        if habits.get("hookah"):
            parts.append("hookah use")
        if habits.get("e_cigarettes"):
            parts.append("e-cigarette use")
        if habits.get("alcohol_use"):
            parts.append("alcohol use")
        if habits.get("recreational_drug_use"):
            parts.append("recreational drug use")

        return "; ".join(parts) if parts else "None recorded"

    allergies_line = _join(data["allergies"], _format_allergy)
    medications_line = _join(
        data["current_medications"],
        lambda medication: str(medication.get("name") or "").strip(),
    )
    chronic_line = _join(
        data["chronic_diseases"],
        lambda condition: str(condition.get("icd10_code") or "").strip(),
    )
    surgical_line = _join(
        data["surgical_history"],
        lambda surgery: str(surgery.get("procedure") or "").strip(),
    )
    habits_line = _format_habits(data.get("habits"))

    return (
        f"{heading}\n"
        f"- Allergies: {allergies_line}\n"
        f"- Current Medications: {medications_line}\n"
        f"- Chronic Conditions: {chronic_line}\n"
        f"- Surgical History: {surgical_line}\n"
        f"- Habits: {habits_line}\n"
    )


class ClinicAssistant(BaseDomainAssistant):
    """The clinic's own implementation of BaseDomainAssistant. The base
    class supplies the tool-calling loop, the patient-scoping guards, and
    the system prompt assembly — everything below is clinic-specific."""

    entity_label = "patient"
    entity_id_param = "patient_id"

    @property
    def available_functions(self) -> dict:
        return AVAILABLE_FUNCTIONS

    @property
    def tool_schemas(self) -> list:
        return TOOL_SCHEMAS

    @property
    def system_prompt_rules(self) -> str:
        return CLINIC_RULES

    def get_entity_name(self, db: Session, entity_id: int) -> Optional[str]:
        patient = db.get(Patient, entity_id)
        return patient.full_name if patient else None

    def safety_check(self, db: Session, entity_id: int, answer_text: str) -> Optional[str]:
        """Guaranteed snapshot appended AFTER the LLM answers, independent
        of the LLM — always shown, regardless of what the model did or
        didn't mention in its own warning bullets."""
        data = _fetch_safety_data(db, entity_id)
        return _format_safety_snapshot(data, heading="## Patient Safety Snapshot")


CLINIC_ASSISTANT = ClinicAssistant()