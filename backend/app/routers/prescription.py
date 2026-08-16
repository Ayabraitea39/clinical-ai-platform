from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..crud import prescription as prescription_crud
from ..database import get_db
from ..models import ActClassification, MedicalAct, Visit
from ..schemas.prescription import PrescriptionCreate, PrescriptionOut

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@router.post("/", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
def create_prescription(payload: PrescriptionCreate, db: Session = Depends(get_db)):
    visit = db.get(Visit, payload.visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    medical_act = db.get(MedicalAct, payload.medical_act_id)
    if not medical_act:
        raise HTTPException(status_code=404, detail="Medicine not found")

    if medical_act.classification != ActClassification.medicine:
        raise HTTPException(status_code=400, detail="Only medicines can be prescribed")

    return prescription_crud.create_prescription(db, payload)


@router.get("/visit/{visit_id}", response_model=List[PrescriptionOut])
def get_visit_prescriptions(visit_id: int, db: Session = Depends(get_db)):
    visit = db.get(Visit, visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    return prescription_crud.get_visit_prescriptions(db, visit_id)


@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prescription(prescription_id: int, db: Session = Depends(get_db)):
    prescription = prescription_crud.get_prescription(db, prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    prescription_crud.delete_prescription(db, prescription)
