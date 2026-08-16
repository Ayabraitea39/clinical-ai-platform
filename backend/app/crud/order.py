import os
import shutil
import uuid
import datetime

from sqlalchemy.orm import Session, joinedload

from ..models import Order, OrderResult, OrderResultAttachment
from ..schemas.order import OrderCreate

UPLOAD_DIR = "uploads/order_results"


def create_order(db: Session, payload: OrderCreate) -> Order:
    order = Order(
        visit_id=payload.visit_id,
        medical_act_id=payload.medical_act_id,
        reason=payload.reason,
        notes=payload.notes,
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return (
        db.query(Order)
        .options(joinedload(Order.medical_act))
        .filter(Order.id == order.id)
        .first()
    )


def get_order(db: Session, order_id: int) -> Order | None:
    return (
        db.query(Order)
        .options(
            joinedload(Order.medical_act),
            joinedload(Order.result).joinedload(OrderResult.attachments),
        )
        .filter(Order.id == order_id)
        .first()
    )


def get_visit_orders(db: Session, visit_id: int) -> list[Order]:
    return (
        db.query(Order)
        .options(
            joinedload(Order.medical_act),
            joinedload(Order.result).joinedload(OrderResult.attachments),
        )
        .filter(Order.visit_id == visit_id)
        .order_by(Order.id.desc())
        .all()
    )


def delete_order(db: Session, order: Order) -> None:
    db.delete(order)
    db.commit()


def create_order_result_with_file(
    db: Session,
    order_id: int,
    file_name: str,
    file_bytes,
    content_type: str,
) -> OrderResult:
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    file_ext = os.path.splitext(file_name)[1]
    unique_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file_bytes, buffer)

    file_size = os.path.getsize(file_path)

    result = OrderResult(
        order_id=order_id,
        result_text="(pending — not yet extracted)",
        result_date=datetime.date.today(),
    )
    db.add(result)
    db.flush()

    attachment = OrderResultAttachment(
        order_result_id=result.id,
        file_name=file_name,
        file_url=file_path,
        content_type=content_type,
        file_size=file_size,
    )
    db.add(attachment)

    db.commit()

    return get_order(db, order_id).result