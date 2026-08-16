from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Numeric, Text, Enum, Date, Integer
from typing import Optional, TYPE_CHECKING
import enum
import datetime

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
    start_date: Mapped[Optional[datetime.date]] = mapped_column(Date)
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
    result: Mapped[Optional["OrderResult"]] = relationship(
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
    )


class OrderResult(Base):
    __tablename__ = "order_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
        nullable=False,
        unique=True,
    )
    result_text: Mapped[str] = mapped_column(Text, nullable=False)
    result_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    order: Mapped["Order"] = relationship(back_populates="result")
    attachments: Mapped[list["OrderResultAttachment"]] = relationship(
        back_populates="result",
        cascade="all, delete-orphan",
    )


class OrderResultAttachment(Base):
    __tablename__ = "order_result_attachments"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_result_id: Mapped[int] = mapped_column(
        ForeignKey("order_results.id"),
        nullable=False,
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[Optional[str]] = mapped_column(String(100))
    file_size: Mapped[Optional[int]] = mapped_column(Integer)

    result: Mapped["OrderResult"] = relationship(back_populates="attachments")


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