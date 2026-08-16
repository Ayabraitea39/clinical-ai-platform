from sqlalchemy.orm import Session
from app.models.identity import Patient
from app.models.patient import (
    AttachedFile,
    ChronicDisease,
    FamilyHistory,
    SurgicalHistory,
    Immunization,
    Allergy,
    CurrentMedication,
)
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    ChronicDiseaseCreate,
    FamilyHistoryCreate,
    SurgicalHistoryCreate,
    ImmunizationCreate,
    AllergyCreate,
    CurrentMedicationCreate,
    InsuranceCoverageCreate,
)
from app.models.medicalAct import InsuranceCoverage

def get_patients(db: Session):
    return db.query(Patient).all()

def get_patient(db: Session, patient_id: int):
    return db.query(Patient).filter(Patient.id == patient_id).first()

def create_patient(db: Session, patient: PatientCreate):
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

def update_patient(db: Session, patient_id: int, patient: PatientUpdate):
    db_patient = get_patient(db, patient_id)
    if not db_patient:
        return None
    for key, value in patient.model_dump(exclude_unset=True).items():
        setattr(db_patient, key, value)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def get_patient_files(db: Session, patient_id: int):
    return (
        db.query(AttachedFile)
        .filter(AttachedFile.patient_id == patient_id, AttachedFile.visit_id.is_(None))
        .all()
    )


def create_attached_file(db: Session, patient_id: int, file_url: str, description: str | None):
    record = AttachedFile(
        patient_id=patient_id,
        visit_id=None,
        file_url=file_url,
        description=description,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def delete_attached_file(db: Session, file_id: int):
    record = db.query(AttachedFile).filter(AttachedFile.id == file_id).first()
    if not record:
        return None
    db.delete(record)
    db.commit()
    return record


# ---------------------------------------------------------------------------
# Generic pattern repeated for each of the 6 medical-history categories:
# get_all / create / delete, scoped by patient_id.
# ---------------------------------------------------------------------------

def get_chronic_diseases(db: Session, patient_id: int):
    return db.query(ChronicDisease).filter(ChronicDisease.patient_id == patient_id).all()

def create_chronic_disease(db: Session, patient_id: int, payload: ChronicDiseaseCreate):
    record = ChronicDisease(**payload.model_dump(), patient_id=patient_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def delete_chronic_disease(db: Session, entry_id: int):
    record = db.query(ChronicDisease).filter(ChronicDisease.id == entry_id).first()
    if not record:
        return None
    db.delete(record)
    db.commit()
    return record


def get_family_history(db: Session, patient_id: int):
    return db.query(FamilyHistory).filter(FamilyHistory.patient_id == patient_id).all()

def create_family_history(db: Session, patient_id: int, payload: FamilyHistoryCreate):
    record = FamilyHistory(**payload.model_dump(), patient_id=patient_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def delete_family_history(db: Session, entry_id: int):
    record = db.query(FamilyHistory).filter(FamilyHistory.id == entry_id).first()
    if not record:
        return None
    db.delete(record)
    db.commit()
    return record


def get_surgical_history(db: Session, patient_id: int):
    return db.query(SurgicalHistory).filter(SurgicalHistory.patient_id == patient_id).all()

def create_surgical_history(db: Session, patient_id: int, payload: SurgicalHistoryCreate):
    record = SurgicalHistory(**payload.model_dump(), patient_id=patient_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def delete_surgical_history(db: Session, entry_id: int):
    record = db.query(SurgicalHistory).filter(SurgicalHistory.id == entry_id).first()
    if not record:
        return None
    db.delete(record)
    db.commit()
    return record


def get_immunizations(db: Session, patient_id: int):
    return db.query(Immunization).filter(Immunization.patient_id == patient_id).all()

def create_immunization(db: Session, patient_id: int, payload: ImmunizationCreate):
    record = Immunization(**payload.model_dump(), patient_id=patient_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def delete_immunization(db: Session, entry_id: int):
    record = db.query(Immunization).filter(Immunization.id == entry_id).first()
    if not record:
        return None
    db.delete(record)
    db.commit()
    return record


def get_allergies(db: Session, patient_id: int):
    return db.query(Allergy).filter(Allergy.patient_id == patient_id).all()

def create_allergy(db: Session, patient_id: int, payload: AllergyCreate):
    record = Allergy(**payload.model_dump(), patient_id=patient_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def delete_allergy(db: Session, entry_id: int):
    record = db.query(Allergy).filter(Allergy.id == entry_id).first()
    if not record:
        return None
    db.delete(record)
    db.commit()
    return record


def get_current_medications(db: Session, patient_id: int):
    return db.query(CurrentMedication).filter(CurrentMedication.patient_id == patient_id).all()

def create_current_medication(db: Session, patient_id: int, payload: CurrentMedicationCreate):
    record = CurrentMedication(**payload.model_dump(), patient_id=patient_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def delete_current_medication(db: Session, entry_id: int):
    record = db.query(CurrentMedication).filter(CurrentMedication.id == entry_id).first()
    if not record:
        return None
    db.delete(record)
    db.commit()
    return record

def get_insurance_coverage(db: Session, patient_id: int):
    return db.query(InsuranceCoverage).filter(InsuranceCoverage.patient_id == patient_id).all()

def create_insurance_coverage(db: Session, patient_id: int, payload: InsuranceCoverageCreate):
    record = InsuranceCoverage(**payload.model_dump(), patient_id=patient_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def delete_insurance_coverage(db: Session, entry_id: int):
    record = db.query(InsuranceCoverage).filter(InsuranceCoverage.id == entry_id).first()
    if not record:
        return None
    db.delete(record)
    db.commit()
    return record

def update_insurance_coverage(db: Session, entry_id: int, payload: InsuranceCoverageCreate):
    record = db.query(InsuranceCoverage).filter(InsuranceCoverage.id == entry_id).first()
    if not record:
        return None
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record
