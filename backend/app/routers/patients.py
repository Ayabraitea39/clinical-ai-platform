import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientOut,
    AttachedFileOut,
    ChronicDiseaseCreate,
    ChronicDiseaseOut,
    FamilyHistoryCreate,
    FamilyHistoryOut,
    SurgicalHistoryCreate,
    SurgicalHistoryOut,
    ImmunizationCreate,
    ImmunizationOut,
    AllergyCreate,
    AllergyOut,
    CurrentMedicationCreate,
    CurrentMedicationOut,
)
from app.crud import patient as patient_crud
from .get_current_user import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])

UPLOAD_DIR = "uploads"


@router.get("/", response_model=list[PatientOut])
def list_patients(db: Session = Depends(get_db)):
    return patient_crud.get_patients(db)

@router.post("/", response_model=PatientOut)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    return patient_crud.create_patient(db, patient)

@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    db_patient = patient_crud.get_patient(db, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: int, patient: PatientUpdate, db: Session = Depends(get_db)):
    db_patient = patient_crud.update_patient(db, patient_id, patient)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient


@router.get("/{patient_id}/attached-files/", response_model=list[AttachedFileOut])
def list_attached_files(patient_id: int, db: Session = Depends(get_db)):
    return patient_crud.get_patient_files(db, patient_id)


@router.post("/{patient_id}/attached-files/", response_model=AttachedFileOut, status_code=201)
def upload_attached_file(
    patient_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    disk_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(disk_path, "wb") as f:
        f.write(file.file.read())

    file_url = f"/uploads/{safe_name}"
    return patient_crud.create_attached_file(db, patient_id, file_url, description or file.filename)


@router.delete("/{patient_id}/attached-files/{file_id}")
def delete_attached_file(
    patient_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = patient_crud.delete_attached_file(db, file_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")
    return {"ok": True}


# ---------------------------------------------------------------------------
# Medical history categories — same GET list / POST create / DELETE pattern
# repeated for each of the 6 categories.
# ---------------------------------------------------------------------------

@router.get("/{patient_id}/chronic-diseases/", response_model=list[ChronicDiseaseOut])
def list_chronic_diseases(patient_id: int, db: Session = Depends(get_db)):
    return patient_crud.get_chronic_diseases(db, patient_id)

@router.post("/{patient_id}/chronic-diseases/", response_model=ChronicDiseaseOut, status_code=201)
def add_chronic_disease(
    patient_id: int, payload: ChronicDiseaseCreate, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return patient_crud.create_chronic_disease(db, patient_id, payload)

@router.delete("/{patient_id}/chronic-diseases/{entry_id}")
def remove_chronic_disease(
    patient_id: int, entry_id: int, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = patient_crud.delete_chronic_disease(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True}


@router.get("/{patient_id}/family-history/", response_model=list[FamilyHistoryOut])
def list_family_history(patient_id: int, db: Session = Depends(get_db)):
    return patient_crud.get_family_history(db, patient_id)

@router.post("/{patient_id}/family-history/", response_model=FamilyHistoryOut, status_code=201)
def add_family_history(
    patient_id: int, payload: FamilyHistoryCreate, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return patient_crud.create_family_history(db, patient_id, payload)

@router.delete("/{patient_id}/family-history/{entry_id}")
def remove_family_history(
    patient_id: int, entry_id: int, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = patient_crud.delete_family_history(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True}


@router.get("/{patient_id}/surgical-history/", response_model=list[SurgicalHistoryOut])
def list_surgical_history(patient_id: int, db: Session = Depends(get_db)):
    return patient_crud.get_surgical_history(db, patient_id)

@router.post("/{patient_id}/surgical-history/", response_model=SurgicalHistoryOut, status_code=201)
def add_surgical_history(
    patient_id: int, payload: SurgicalHistoryCreate, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return patient_crud.create_surgical_history(db, patient_id, payload)

@router.delete("/{patient_id}/surgical-history/{entry_id}")
def remove_surgical_history(
    patient_id: int, entry_id: int, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = patient_crud.delete_surgical_history(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True}


@router.get("/{patient_id}/immunizations/", response_model=list[ImmunizationOut])
def list_immunizations(patient_id: int, db: Session = Depends(get_db)):
    return patient_crud.get_immunizations(db, patient_id)

@router.post("/{patient_id}/immunizations/", response_model=ImmunizationOut, status_code=201)
def add_immunization(
    patient_id: int, payload: ImmunizationCreate, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return patient_crud.create_immunization(db, patient_id, payload)

@router.delete("/{patient_id}/immunizations/{entry_id}")
def remove_immunization(
    patient_id: int, entry_id: int, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = patient_crud.delete_immunization(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True}


@router.get("/{patient_id}/allergies/", response_model=list[AllergyOut])
def list_allergies(patient_id: int, db: Session = Depends(get_db)):
    return patient_crud.get_allergies(db, patient_id)

@router.post("/{patient_id}/allergies/", response_model=AllergyOut, status_code=201)
def add_allergy(
    patient_id: int, payload: AllergyCreate, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return patient_crud.create_allergy(db, patient_id, payload)

@router.delete("/{patient_id}/allergies/{entry_id}")
def remove_allergy(
    patient_id: int, entry_id: int, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = patient_crud.delete_allergy(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True}


@router.get("/{patient_id}/current-medications/", response_model=list[CurrentMedicationOut])
def list_current_medications(patient_id: int, db: Session = Depends(get_db)):
    return patient_crud.get_current_medications(db, patient_id)

@router.post("/{patient_id}/current-medications/", response_model=CurrentMedicationOut, status_code=201)
def add_current_medication(
    patient_id: int, payload: CurrentMedicationCreate, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return patient_crud.create_current_medication(db, patient_id, payload)

@router.delete("/{patient_id}/current-medications/{entry_id}")
def remove_current_medication(
    patient_id: int, entry_id: int, db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    deleted = patient_crud.delete_current_medication(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"ok": True}
