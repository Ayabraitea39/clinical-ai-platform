from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import MedicalAct, ActClassification
from ..schemas.medicalAct import MedicalActOut

router = APIRouter(prefix="/medical-acts", tags=["medical-acts"])


@router.get("/", response_model=List[MedicalActOut])
def list_medical_acts(
    classification: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(MedicalAct)

    if classification:
        try:
            classification_enum = ActClassification(classification)
        except ValueError:
            raise HTTPException(
                status_code=400, detail=f"Invalid classification: {classification}"
            )
        query = query.filter(MedicalAct.classification == classification_enum)

    if search:
        query = query.filter(MedicalAct.name.ilike(f"%{search}%"))

    return query.order_by(MedicalAct.name).all()