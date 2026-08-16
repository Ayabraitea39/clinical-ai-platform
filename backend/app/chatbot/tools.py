from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.models.identity import Patient
from app.models.visit import Visit, VisitSign, SignDefinition, SignCategory
from app.models.patient import (
    Allergy, CurrentMedication, ChronicDisease, AttachedFile,
    FamilyHistory, SurgicalHistory, Immunization,
)
from app.models.medicalAct import Prescription, Order, OrderResult, MedicalAct


def _clean(value) -> str:
    """Normalize missing/empty clinical text so the LLM never sees ambiguous blanks."""
    if value is None:
        return "not recorded"
    if isinstance(value, str) and value.strip() == "":
        return "not recorded"
    return value


def _patient_demographics(patient: Patient) -> dict:
    """Every field on the Patient model, used by both get_patient_summary and
    get_full_patient_record so neither one silently omits a field the other has."""
    return {
        "full_name": patient.full_name,
        "date_of_birth": str(patient.date_of_birth),
        "gender": patient.gender.value if patient.gender else "not recorded",
        "blood_type": patient.blood_type.value if patient.blood_type else "not recorded",
        "nationality": _clean(patient.nationality),
        "social_status": patient.social_status.value if patient.social_status else "not recorded",
        "phone": _clean(patient.phone),
        "email": _clean(patient.email),
        "address": _clean(patient.address),
        "condition": _clean(patient.condition),
    }


def get_patient_summary(db: Session, patient_id: int) -> dict:
    patient = db.get(Patient, patient_id)
    if not patient:
        return {"error": "patient not found"}

    chronic = db.scalars(
        select(ChronicDisease).where(ChronicDisease.patient_id == patient_id)
    ).all()
    allergies = db.scalars(
        select(Allergy).where(Allergy.patient_id == patient_id)
    ).all()
    meds = db.scalars(
        select(CurrentMedication).where(CurrentMedication.patient_id == patient_id)
    ).all()
    last_visit = db.scalars(
        select(Visit)
        .where(Visit.patient_id == patient_id)
        .order_by(desc(Visit.visit_date))
        .limit(1)
    ).first()

    return {
        **_patient_demographics(patient),
        "chronic_diseases": [c.icd10_code for c in chronic] if chronic else [],
        "allergies": [a.allergen for a in allergies] if allergies else [],
        "current_medications": [m.medicine_name for m in meds] if meds else [],
        "last_visit_date": str(last_visit.visit_date) if last_visit else "not recorded",
    }


def get_allergies(db: Session, patient_id: int) -> list[dict]:
    allergies = db.scalars(
        select(Allergy).where(Allergy.patient_id == patient_id)
    ).all()
    return [
        {
            "allergen": a.allergen,
            "reaction": _clean(a.reaction),
            "severity": _clean(a.severity),
        }
        for a in allergies
    ]


def get_current_medications(db: Session, patient_id: int) -> list[dict]:
    meds = db.scalars(
        select(CurrentMedication).where(CurrentMedication.patient_id == patient_id)
    ).all()
    return [
        {
            "name": m.medicine_name,
            "dose": _clean(m.dose),
            "frequency": _clean(m.frequency),
        }
        for m in meds
    ]


def get_chronic_diseases(db: Session, patient_id: int) -> list[dict]:
    diseases = db.scalars(
        select(ChronicDisease).where(ChronicDisease.patient_id == patient_id)
    ).all()
    return [
        {
            "icd10_code": d.icd10_code,
            "discovery_date": str(d.discovery_date) if d.discovery_date else "not recorded",
            "notes": _clean(d.notes),
        }
        for d in diseases
    ]


def get_surgical_history(db: Session, patient_id: int) -> list[dict]:
    surgeries = db.scalars(
        select(SurgicalHistory).where(SurgicalHistory.patient_id == patient_id)
    ).all()
    return [
        {
            "procedure": s.procedure,
            "surgery_date": str(s.surgery_date) if s.surgery_date else "not recorded",
            "notes": _clean(s.notes),
        }
        for s in surgeries
    ]


def get_family_history(db: Session, patient_id: int) -> list[dict]:
    entries = db.scalars(
        select(FamilyHistory).where(FamilyHistory.patient_id == patient_id)
    ).all()
    return [
        {
            "icd10_code": f.icd10_code if f.icd10_code else "not recorded",
            "kinship": _clean(f.kinship),
            "living_conditions": _clean(f.living_conditions),
            "notes": _clean(f.notes),
        }
        for f in entries
    ]


def get_immunizations(db: Session, patient_id: int) -> list[dict]:
    entries = db.scalars(
        select(Immunization).where(Immunization.patient_id == patient_id)
    ).all()
    return [
        {
            "vaccine_type": i.vaccine_type,
            "age_at_vaccination": (
                f"{i.age_at_vaccination} {i.age_unit}"
                if i.age_at_vaccination is not None and i.age_unit
                else "not recorded"
            ),
            "taken_status": bool(i.taken_status),
        }
        for i in entries
    ]


def get_contact_info(db: Session, patient_id: int) -> dict:
    patient = db.get(Patient, patient_id)
    if not patient:
        return {"error": "patient not found"}
    return {
        "phone": _clean(patient.phone),
        "email": _clean(patient.email),
        "address": _clean(patient.address),
    }


def _get_signs_with_names(db: Session, visit_id: int) -> list[dict]:
    """Joins VisitSign to SignDefinition so the LLM sees real sign names
    (e.g. 'Blood pressure systolic') instead of opaque sign_ids it would
    otherwise have to guess the meaning of."""
    rows = db.execute(
        select(VisitSign, SignDefinition.name)
        .join(SignDefinition, VisitSign.sign_definition_id == SignDefinition.id)
        .where(VisitSign.visit_id == visit_id)
    ).all()

    seen, unique_signs = set(), []
    for sign, name in rows:
        key = (name, sign.value)
        if key not in seen:
            seen.add(key)
            unique_signs.append({"sign_name": name, "value": sign.value})
    return unique_signs


def get_visit_detail(db: Session, patient_id: int, visit_date: str | None = None) -> dict:
    """If visit_date is given (YYYY-MM-DD), returns that visit.
    If omitted, returns the most recent visit."""
    query = select(Visit).where(Visit.patient_id == patient_id)
    if visit_date:
        query = query.where(Visit.visit_date == visit_date)
    visit = db.scalars(query.order_by(desc(Visit.visit_date)).limit(1)).first()

    if not visit:
        return {"error": f"no visit found for {visit_date or 'this patient'}"}

    return {
        "visit_date": str(visit.visit_date),
        "visit_type": visit.visit_type,
        "conclusion": _clean(visit.conclusion),
        "signs": _get_signs_with_names(db, visit.id),
        "prescriptions": [
            {
                "medicine": p.medical_act.name,
                "dose": _clean(p.dose),
                "frequency": _clean(p.frequency),
            }
            for p in visit.prescriptions
        ],
        "orders": [
            {"name": o.medical_act.name, "reason": _clean(o.reason)}
            for o in visit.orders
        ],
    }


def get_last_visit(db: Session, patient_id: int) -> dict:
    """Thin wrapper kept for backward compatibility — same as get_visit_detail with no date."""
    return get_visit_detail(db, patient_id)


def get_all_visits(db: Session, patient_id: int) -> list[dict]:
    visits = db.scalars(
        select(Visit)
        .where(Visit.patient_id == patient_id)
        .order_by(desc(Visit.visit_date))
    ).all()
    return [
        {
            "visit_date": str(v.visit_date),
            "visit_type": v.visit_type,
            "conclusion": _clean(v.conclusion),
        }
        for v in visits
    ]


def get_order_reason(db: Session, patient_id: int, order_act_name: str) -> dict:
    order = db.scalars(
        select(Order)
        .join(Visit)
        .join(MedicalAct)
        .where(Visit.patient_id == patient_id, MedicalAct.name.ilike(f"%{order_act_name}%"))
        .order_by(desc(Visit.visit_date))
        .limit(1)
    ).first()
    if not order:
        return {"error": "no matching order found"}
    return {
        "act": order.medical_act.name,
        "reason": _clean(order.reason),
        "notes": _clean(order.notes),
    }


def compare_last_two_visits(db: Session, patient_id: int) -> dict:
    visits = db.scalars(
        select(Visit)
        .where(Visit.patient_id == patient_id)
        .order_by(desc(Visit.visit_date))
        .limit(2)
    ).all()
    if len(visits) < 2:
        return {"error": "fewer than two visits recorded"}

    def summarize(v):
        return {
            "date": str(v.visit_date),
            "conclusion": _clean(v.conclusion),
            "medications": [p.medical_act.name for p in v.prescriptions],
            "orders": [o.medical_act.name for o in v.orders],
        }

    return {"latest": summarize(visits[0]), "previous": summarize(visits[1])}


def get_sign_trend(db: Session, patient_id: int, sign_name: str, num_visits: int = 3) -> list[dict]:
    """Returns a specific sign's value (e.g. 'Temperature', 'Blood Pressure')
    across the patient's most recent visits, oldest to newest."""
    recent_visits = db.scalars(
        select(Visit)
        .where(Visit.patient_id == patient_id)
        .order_by(desc(Visit.visit_date))
        .limit(num_visits)
    ).all()

    results = []
    for v in recent_visits:
        sign = db.scalars(
            select(VisitSign)
            .join(SignDefinition)
            .where(VisitSign.visit_id == v.id, SignDefinition.name.ilike(f"%{sign_name}%"))
        ).first()
        results.append({
            "visit_date": str(v.visit_date),
            "value": sign.value if sign else "not recorded",
        })

    return list(reversed(results))


def get_visit_medical_acts(db: Session, patient_id: int, visit_date: str | None = None,
                             classification: str | None = None) -> dict:
    """classification: 'medicine', 'test', 'imaging', or 'other'. Omit for all."""
    query = select(Visit).where(Visit.patient_id == patient_id)
    if visit_date:
        query = query.where(Visit.visit_date == visit_date)
    visit = db.scalars(query.order_by(desc(Visit.visit_date)).limit(1)).first()
    if not visit:
        return {"error": f"no visit found for {visit_date or 'this patient'}"}

    results = []
    for p in visit.prescriptions:
        if classification and p.medical_act.classification.value != classification:
            continue
        results.append({
            "type": "prescription",
            "name": p.medical_act.name,
            "classification": p.medical_act.classification.value,
            "dose": _clean(p.dose),
            "frequency": _clean(p.frequency),
            "route": _clean(p.route),
            "duration": _clean(p.duration),
        })
    for o in visit.orders:
        if classification and o.medical_act.classification.value != classification:
            continue
        entry = {
            "type": "order",
            "name": o.medical_act.name,
            "classification": o.medical_act.classification.value,
            "reason": _clean(o.reason),
            "notes": _clean(o.notes),
        }
        if o.result:
            entry["result"] = {
                "result_text": o.result.result_text,
                "result_date": str(o.result.result_date),
            }
        results.append(entry)

    return {"visit_date": str(visit.visit_date), "acts": results}


def get_visit_signs_by_category(db: Session, patient_id: int, category_name: str,
                                  visit_date: str | None = None) -> dict:
    """Returns signs for one visit within one category (e.g. 'Vitals', 'Vital
    Signs', 'Physical Exam'). Category matching is normalized (case, spacing,
    trailing 's') so a loosely-phrased category name from the model still
    matches the actual stored category — e.g. 'Vitals' matches 'Vital Signs'.
    """
    query = select(Visit).where(Visit.patient_id == patient_id)
    if visit_date:
        query = query.where(Visit.visit_date == visit_date)
    visit = db.scalars(query.order_by(desc(Visit.visit_date)).limit(1)).first()
    if not visit:
        return {"error": f"no visit found for {visit_date or 'this patient'}"}

    # Pull all signs for this visit once, then match category in Python —
    # avoids relying on a single-direction SQL ILIKE substring, which missed
    # cases like category_name="Vitals" vs stored "Vital Signs".
    rows = db.execute(
        select(VisitSign, SignDefinition.name, SignCategory.name)
        .join(SignDefinition, VisitSign.sign_definition_id == SignDefinition.id)
        .join(SignCategory, SignDefinition.category_id == SignCategory.id)
        .where(VisitSign.visit_id == visit.id)
    ).all()

    def normalize(s: str) -> str:
        return s.strip().lower().rstrip("s")

    normalized_input = normalize(category_name)

    seen, unique = set(), []
    for sign, sign_name, cat_name in rows:
        normalized_stored = normalize(cat_name)
        if normalized_input not in normalized_stored and normalized_stored not in normalized_input:
            continue
        key = (sign_name, sign.value)
        if key not in seen:
            seen.add(key)
            unique.append({"sign_name": sign_name, "value": sign.value})

    return {"visit_date": str(visit.visit_date), "category": category_name, "signs": unique}


def get_attached_files(db: Session, patient_id: int, visit_date: str | None = None) -> list[dict]:
    if visit_date:
        visit = db.scalars(
            select(Visit).where(Visit.patient_id == patient_id, Visit.visit_date == visit_date)
        ).first()
        if not visit:
            return [{"error": f"no visit found for {visit_date}"}]
        files = db.scalars(select(AttachedFile).where(AttachedFile.visit_id == visit.id)).all()
    else:
        files = db.scalars(select(AttachedFile).where(AttachedFile.patient_id == patient_id)).all()

    return [{"file_url": f.file_url, "description": _clean(f.description)} for f in files]


def get_full_patient_record(db: Session, patient_id: int) -> dict:
    """Everything known about a patient — used when the doctor asks a broad,
    open-ended question rather than something specific (e.g. 'give me his
    full history' vs. 'what is he allergic to')."""
    patient = db.get(Patient, patient_id)
    if not patient:
        return {"error": "patient not found"}

    all_visits = db.scalars(
        select(Visit)
        .where(Visit.patient_id == patient_id)
        .order_by(desc(Visit.visit_date))
    ).all()

    return {
        "demographics": _patient_demographics(patient),
        "chronic_diseases": get_chronic_diseases(db, patient_id),
        "allergies": get_allergies(db, patient_id),
        "current_medications": get_current_medications(db, patient_id),
        "surgical_history": get_surgical_history(db, patient_id),
        "family_history": get_family_history(db, patient_id),
        "immunizations": get_immunizations(db, patient_id),
        "visit_count": len(all_visits),
        "visit_dates": [str(v.visit_date) for v in all_visits],
        "most_recent_visit": get_visit_detail(db, patient_id),
    }
