from sqlalchemy.orm import Session
from app.chatbot.tool_schemas import TOOL_SCHEMAS
from app.chatbot import tools as tool_funcs
from app.chatbot.llm_router import call_llm
from app.models.identity import Patient
import json
import re

SYSTEM_PROMPT = (
    "You are a clinical assistant working with the medical record of the "
    "patient currently open in the chart.\n"

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

    "5. You are restricted to the patient currently open in the chart. "
    "Never access or answer using another patient's record."

    "6. 'Prescribed' means medications prescribed during a visit. "
    "Use get_visit_detail or get_visit_medical_acts for these questions. "
    "If no visit is specified, use the most recent visit. "
    "Use get_current_medications only for medications the patient is currently taking."

    "7. You are scoped to exactly ONE patient: {{CURRENT_PATIENT_NAME}}. All "
    "tools you call only ever return data for this patient, regardless of any "
    "other patient name, number, or ID mentioned in the question. If the "
    "doctor's question names a different person than {{CURRENT_PATIENT_NAME}} "
    " you MUST explicitly point out the mismatch and say you can only answer about "
    "the currently open patient — do not silently answer as if the question "
    "was about the current patient."
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



_PATIENT_ID_PATTERN = re.compile(r"patient\s*#?\s*0*(\d+)", re.IGNORECASE)
_POSSESSIVE_NAME_PATTERN = re.compile(r"\b([A-Z][a-zA-Z]+)'s\b")


def _mentions_someone_else(question: str, current_patient_id: int,
                            current_patient_name: str) -> bool:
    """
    Single deterministic guard, run before the LLM is ever called, that
    catches any reference to a patient other than the one currently open
    in the chart. Relying on the model to self-enforce this (system prompt
    rule 7) proved unreliable, so it's checked in code instead. Covers two
    cases in one pass:

    1. A numeric patient ID that isn't this patient's ("patient 004")
    2. A possessive reference to ANY name that isn't the current patient's
       — no database lookup needed, since it doesn't matter whether that
       name belongs to a real patient elsewhere in the system or to nobody
       at all: if it isn't this patient's name, it's out of scope
       ("what is harry's address", "what is ali's address" when the chart
       open is for someone else — both blocked the same way)
    """
    # 1. Numeric ID mismatch
    for match in _PATIENT_ID_PATTERN.finditer(question):
        if int(match.group(1)) != current_patient_id:
            return True

    # 2. Possessive reference to any name that isn't the current patient
    current_parts = {part.lower() for part in current_patient_name.split()}
    for match in _POSSESSIVE_NAME_PATTERN.finditer(question):
        if match.group(1).lower() not in current_parts:
            return True

    return False


def _is_safe_non_data_reply(text: str) -> bool:
    text = text.strip().lower()

    safe_phrases = (
        "hello",
        "hi",
        "hey",
        "how can i help",
        "could you clarify",
        "could you rephrase",
    )

    return any(text.startswith(phrase) for phrase in safe_phrases)


def chat_with_patient_context(db: Session, patient_id: int, question: str,
                                max_tool_rounds: int = 3) -> str:
    current_patient = db.get(Patient, patient_id)
    current_name = current_patient.full_name if current_patient else "the current patient"

    if _mentions_someone_else(question, patient_id, current_name):
        return (
            f"I can only answer questions about {current_name}, the patient "
            "currently open in this chart. Did you mean to ask about this "
            "patient instead?"
        )

    system_prompt = SYSTEM_PROMPT.replace("{{CURRENT_PATIENT_NAME}}", current_name)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question},
    ]

    tool_call_fired = False  

    for attempt in range(max_tool_rounds):
        print(f"[ROUND {attempt + 1}] sending {len(messages)} messages to LLM")

        try:
            msg = call_llm(messages, tools=TOOL_SCHEMAS, temperature=0)
        except Exception as e:
            print(f"[ERROR] call_llm failed: {e!r}")
            return "The clinical assistant is temporarily unavailable. Please try again shortly."

        if not msg.get("tool_calls"):
            content = msg.get("content", "")

            if tool_call_fired:
                return content

            if _is_safe_non_data_reply(content):
                return content

            messages.append(msg)
            messages.append({
                "role": "user",
                "content": "Please use the appropriate tool to retrieve the patient's data."
            })
            continue

        messages.append(msg)

        for call in msg["tool_calls"]:
            function_name = call["function"]["name"]
            print(f"[TOOL CALL] LLM chose: {function_name}")

            function = AVAILABLE_FUNCTIONS.get(function_name)

            if not function:
                print(f"[TOOL CALL] unknown tool requested: {function_name}")
                messages.append({
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "content": str({"error": f"unknown tool '{function_name}'"}),
                })
                continue

            raw_arguments = call["function"].get("arguments") or {}
            if isinstance(raw_arguments, str):
                try:
                    arguments = json.loads(raw_arguments)
                except json.JSONDecodeError:
                    arguments = {}
            else:
                arguments = dict(raw_arguments)

            print(f"[TOOL CALL] {function_name} args: {arguments}")
            arguments.pop("patient_id", None)

            try:
                result = function(db, patient_id=patient_id, **arguments)
            except Exception as e:
                result = {"error": f"tool execution failed: {e}"}
                print(f"[TOOL CALL] {function_name} raised: {e!r}")

            tool_call_fired = True
            messages.append({
                "role": "tool",
                "tool_call_id": call["id"],
                "content": str(result),
            })
    return ("I wasn't able to retrieve verified information for that question "
            "after multiple attempts. Please try rephrasing, or check the "
            "patient's chart directly.")