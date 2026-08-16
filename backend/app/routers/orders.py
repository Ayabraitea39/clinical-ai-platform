from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from ..crud import order as order_crud
from ..database import get_db
from ..models import ActClassification, MedicalAct, Visit
from ..schemas.order import OrderCreate, OrderOut, OrderResultOut

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
):
    visit = db.get(Visit, payload.visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    medical_act = db.get(MedicalAct, payload.medical_act_id)
    if not medical_act:
        raise HTTPException(status_code=404, detail="Medical act not found")

    if medical_act.classification == ActClassification.medicine:
        raise HTTPException(
            status_code=400,
            detail="Medicines must be saved as prescriptions, not orders",
        )

    return order_crud.create_order(db, payload)


@router.get("/visit/{visit_id}", response_model=List[OrderOut])
def get_visit_orders(
    visit_id: int,
    db: Session = Depends(get_db),
):
    visit = db.get(Visit, visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    return order_crud.get_visit_orders(db, visit_id)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
):
    order = order_crud.get_order(db, order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order_crud.delete_order(db, order)


@router.post("/{order_id}/upload-result", response_model=OrderResultOut, status_code=status.HTTP_201_CREATED)
def upload_order_result(
    order_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    order = order_crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order_crud.create_order_result_with_file(
        db=db,
        order_id=order_id,
        file_name=file.filename,
        file_bytes=file.file,
        content_type=file.content_type,
    )