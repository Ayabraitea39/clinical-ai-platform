from sqlalchemy.orm import Session, joinedload

from ..models import Prescription
from ..schemas.prescription import PrescriptionCreate


def create_prescription(db: Session, payload: PrescriptionCreate) -> Prescription:
    prescription = Prescription(
        visit_id=payload.visit_id,
        medical_act_id=payload.medical_act_id,
        dose=payload.dose,
        frequency=payload.frequency,
        route=payload.route,
        start_date=payload.start_date,
        duration=payload.duration,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return get_prescription(db, prescription.id)


def get_prescription(db: Session, prescription_id: int) -> Prescription | None:
    return (
        db.query(Prescription)
        .options(joinedload(Prescription.medical_act))
        .filter(Prescription.id == prescription_id)
        .first()
    )


def get_visit_prescriptions(db: Session, visit_id: int) -> list[Prescription]:
    return (
        db.query(Prescription)
        .options(joinedload(Prescription.medical_act))
        .filter(Prescription.visit_id == visit_id)
        .order_by(Prescription.id.desc())
        .all()
    )


def delete_prescription(db: Session, prescription: Prescription) -> None:
    db.delete(prescription)
    db.commit()