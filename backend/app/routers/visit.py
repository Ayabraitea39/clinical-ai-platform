from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import (
    Visit,
    Doctor,
    VisitSign,
    SignCategory,
    SignDefinition,
)
from ..schemas.visit import (
    VisitCreate,
    VisitOut,
    VisitListItem,
    VisitSignsCreate,
    ConclusionUpdate,
    VisitStatusUpdate,
    SignCategoryCreate,
    SignCategoryOut,
    SignDefinitionCreate,
    SignDefinitionOut,
)

router = APIRouter(prefix="/visits", tags=["visits"])


@router.post("/", response_model=VisitOut, status_code=201)
def create_visit(payload: VisitCreate, db: Session = Depends(get_db)):
    visit = Visit(
        patient_id=payload.patient_id,
        doctor_id=payload.doctor_id,
        visit_date=payload.visit_date,
        visit_type=payload.visit_type,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


@router.get("/{visit_id}", response_model=VisitOut)
def get_visit(visit_id: int, db: Session = Depends(get_db)):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    return visit


@router.get("/by-patient/{patient_id}", response_model=List[VisitListItem])
def list_visits_for_patient(patient_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Visit, Doctor.name)
        .join(Doctor, Visit.doctor_id == Doctor.id)
        .filter(Visit.patient_id == patient_id)
        .order_by(Visit.visit_date.desc())
        .all()
    )

    return [
        VisitListItem(
            id=visit.id,
            visit_date=visit.visit_date,
            visit_type=visit.visit_type,
            doctor_name=doctor_name,
            conclusion=visit.conclusion,
            status=visit.status.value,
        )
        for visit, doctor_name in rows
    ]


@router.get("/sign-categories/", response_model=List[SignCategoryOut])
def list_sign_categories(db: Session = Depends(get_db)):
    return db.query(SignCategory).all()


@router.post("/sign-categories/", response_model=SignCategoryOut, status_code=201)
def create_sign_category(payload: SignCategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(SignCategory).filter(SignCategory.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A category with this name already exists")

    category = SignCategory(name=payload.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.post("/sign-definitions/", response_model=SignDefinitionOut, status_code=201)
def create_sign_definition(payload: SignDefinitionCreate, db: Session = Depends(get_db)):
    category = db.query(SignCategory).filter(SignCategory.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Sign category not found")

    sign = SignDefinition(
        category_id=payload.category_id,
        doctor_id=payload.doctor_id,
        name=payload.name,
        data_type=payload.data_type,
        description=payload.description,
        predefined_values=payload.predefined_values,
    )
    db.add(sign)
    db.commit()
    db.refresh(sign)
    return sign


@router.get("/{visit_id}/sign-form")
def get_sign_form(visit_id: int, db: Session = Depends(get_db)):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    categories = db.query(SignCategory).all()

    result = []

    for category in categories:
        signs = (
            db.query(SignDefinition)
            .filter(
                SignDefinition.category_id == category.id,
                or_(
                    SignDefinition.doctor_id == None,
                    SignDefinition.doctor_id == visit.doctor_id,
                ),
            )
            .all()
        )

        result.append(
            {
                "id": category.id,
                "name": category.name,
                "signs": [
                    {
                        "id": sign.id,
                        "name": sign.name,
                        "doctor_id": sign.doctor_id,
                        "data_type": sign.data_type.value,
                        "description": sign.description,
                        "predefined_values": sign.predefined_values,
                    }
                    for sign in signs
                ],
            }
        )

    return result


@router.get("/{visit_id}/signs")
def get_visit_signs(visit_id: int, db: Session = Depends(get_db)):
    return (
        db.query(VisitSign)
        .filter(VisitSign.visit_id == visit_id)
        .all()
    )


@router.post("/{visit_id}/signs")
def submit_visit_signs(
    visit_id: int,
    payload: VisitSignsCreate,
    db: Session = Depends(get_db),
):
    for sign in payload.signs:
        db.add(
            VisitSign(
                visit_id=visit_id,
                sign_definition_id=sign.sign_definition_id,
                value=sign.value,
            )
        )

    db.commit()

    return {"success": True}


@router.put("/{visit_id}/conclusion", response_model=VisitOut)
def update_conclusion(
    visit_id: int,
    payload: ConclusionUpdate,
    db: Session = Depends(get_db),
):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    visit.conclusion = payload.conclusion

    db.commit()
    db.refresh(visit)

    return visit


@router.put("/{visit_id}/status", response_model=VisitOut)
def update_visit_status(
    visit_id: int,
    payload: VisitStatusUpdate,
    db: Session = Depends(get_db),
):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    valid_statuses = {"active", "cancelled"}
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(valid_statuses))}",
        )

    visit.status = payload.status

    db.commit()
    db.refresh(visit)

    return visit