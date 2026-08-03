from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Numeric, Text, Enum
from typing import Optional,TYPE_CHECKING
import enum

from .identity import Base
if TYPE_CHECKING:
    from .visit import Visit
    from .identity import Patient, Doctor

class ActClassification(str, enum.Enum):
    medicine = "medicine"
    test = "test"
    imaging = "imaging"
    other = "other"


class MedicalAct(Base):
    __tablename__ = "medical_acts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    classification: Mapped[ActClassification] = mapped_column(Enum(ActClassification))

    prices: Mapped[list["MedicalActPrice"]] = relationship(back_populates="medical_act")


class MedicalActPrice(Base):
    __tablename__ = "medical_act_prices"

    id: Mapped[int] = mapped_column(primary_key=True)
    medical_act_id: Mapped[int] = mapped_column(ForeignKey("medical_acts.id"), nullable=False)
    doctor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("doctors.id"))
    price: Mapped[float] = mapped_column(Numeric(10, 2))

    medical_act: Mapped["MedicalAct"] = relationship(back_populates="prices")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.id"), nullable=False)
    medical_act_id: Mapped[int] = mapped_column(ForeignKey("medical_acts.id"), nullable=False)
    dose: Mapped[Optional[str]] = mapped_column(String(100))
    frequency: Mapped[Optional[str]] = mapped_column(String(100))
    route: Mapped[Optional[str]] = mapped_column(String(100))
    duration: Mapped[Optional[str]] = mapped_column(String(100))

    visit: Mapped["Visit"] = relationship(back_populates="prescriptions")
    medical_act: Mapped["MedicalAct"] = relationship()


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.id"), nullable=False)
    medical_act_id: Mapped[int] = mapped_column(ForeignKey("medical_acts.id"), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    visit: Mapped["Visit"] = relationship(back_populates="orders")
    medical_act: Mapped["MedicalAct"] = relationship()


class BillingLine(Base):
    __tablename__ = "billing_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.id"), nullable=False)
    medical_act_id: Mapped[int] = mapped_column(ForeignKey("medical_acts.id"), nullable=False)
    diagnosis_text: Mapped[Optional[str]] = mapped_column(Text)
    amount: Mapped[float] = mapped_column(Numeric(10, 2))

    visit: Mapped["Visit"] = relationship(back_populates="billing_lines")
    medical_act: Mapped["MedicalAct"] = relationship()


class InsuranceCoverage(Base):
    __tablename__ = "insurance_coverage"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    provider: Mapped[Optional[str]] = mapped_column(String(255))
    policy_number: Mapped[Optional[str]] = mapped_column(String(100))

    patient: Mapped["Patient"] = relationship(back_populates="insurance_coverage")