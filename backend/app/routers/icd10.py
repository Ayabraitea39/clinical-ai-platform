from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Icd10Code
from ..schemas.icd10 import Icd10CodeOut

router = APIRouter(prefix="/icd10-codes", tags=["icd10-codes"])


@router.get("/", response_model=List[Icd10CodeOut])
def list_icd10_codes(
    search: Optional[str] = Query(None, description="Search by code or condition name"),
    db: Session = Depends(get_db),
):
    query = db.query(Icd10Code)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Icd10Code.code.ilike(pattern),
                Icd10Code.english_explanation.ilike(pattern),
            )
        )
    return query.order_by(Icd10Code.code).all()