from sqlalchemy.orm import Mapped, mapped_column,relationship
from sqlalchemy import String, Date, ForeignKey, Text, Enum, Integer
from typing import Optional
import datetime
import enum

from .identity import Base


from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .medicalAct import Prescription, Order, BillingLine

class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    visit_date: Mapped[datetime.date] = mapped_column(Date)
    visit_type: Mapped[str] = mapped_column(String(100))
    conclusion: Mapped[Optional[str]] = mapped_column(Text)

    prescriptions: Mapped[list["Prescription"]] = relationship(back_populates="visit")
    orders: Mapped[list["Order"]] = relationship(back_populates="visit")
    billing_lines: Mapped[list["BillingLine"]] = relationship(back_populates="visit")
class SignCategory(Base):
    __tablename__ = "sign_categories"
 
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

class SignDataType(str, enum.Enum):
    text = "text"
    numeric = "numeric"
    boolean = "boolean"
    date = "date"
    list = "list"           # single-select from predefined_values
    multi_select = "multi_select"  # multiple choices from predefined_values
 
 
class SignDefinition(Base):
    __tablename__ = "sign_definitions"
 
    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("sign_categories.id"), nullable=False)
    doctor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("doctors.id"))
    name: Mapped[str] = mapped_column(String(150))
    data_type: Mapped[SignDataType] = mapped_column(Enum(SignDataType))
    score_weight: Mapped[Optional[int]] = mapped_column(Integer)
    description: Mapped[Optional[str]] = mapped_column(Text)
    predefined_values: Mapped[Optional[str]] = mapped_column(Text)  # comma-separated options
 
 
class VisitSign(Base):
    __tablename__ = "visit_signs"
 
    id: Mapped[int] = mapped_column(primary_key=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.id"), nullable=False)
    sign_definition_id: Mapped[int] = mapped_column(ForeignKey("sign_definitions.id"), nullable=False)
    value: Mapped[Optional[str]] = mapped_column(Text) 