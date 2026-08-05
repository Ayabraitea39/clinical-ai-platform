from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Numeric, Date, Boolean, Text, String
from typing import Optional
import datetime

from .identity import Base


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)

    smoking_packs_per_day: Mapped[Optional[float]] = mapped_column(Numeric(4, 2))
    smoking_quit_date: Mapped[Optional[datetime.date]] = mapped_column(Date)
    hookah: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    cigarettes: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    alcohol: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    drug_use: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)


class ChronicDisease(Base):
    __tablename__ = "chronic_diseases"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    icd10_code: Mapped[Optional[str]] = mapped_column(ForeignKey("icd10_codes.code"))
    discovery_date: Mapped[Optional[datetime.date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)


class FamilyHistory(Base):
    __tablename__ = "family_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    icd10_code: Mapped[Optional[str]] = mapped_column(ForeignKey("icd10_codes.code"))
    kinship: Mapped[Optional[str]] = mapped_column(String(100))
    living_conditions: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)


class SurgicalHistory(Base):
    __tablename__ = "surgical_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    surgery_date: Mapped[Optional[datetime.date]] = mapped_column(Date)
    procedure: Mapped[str] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)


class Immunization(Base):
    __tablename__ = "immunizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    vaccine_type: Mapped[str] = mapped_column(String(100))
    age_at_vaccination: Mapped[Optional[int]] = mapped_column()
    age_unit: Mapped[Optional[str]] = mapped_column(String(20))  # days / months / years
    taken_status: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)


class Allergy(Base):
    __tablename__ = "allergies"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    allergen: Mapped[str] = mapped_column(String(255))
    reaction: Mapped[Optional[str]] = mapped_column(String(255))
    severity: Mapped[Optional[str]] = mapped_column(String(50))


class CurrentMedication(Base):
    __tablename__ = "current_medications"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    medical_act_id: Mapped[Optional[int]] = mapped_column(ForeignKey("medical_acts.id"))
    medicine_name: Mapped[str] = mapped_column(String(255))
    dose: Mapped[Optional[str]] = mapped_column(String(100))
    frequency: Mapped[Optional[str]] = mapped_column(String(100))
    start_date: Mapped[Optional[datetime.date]] = mapped_column(Date)
    duration: Mapped[Optional[str]] = mapped_column(String(50))


class AttachedFile(Base):
    __tablename__ = "attached_files"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    visit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("visits.id"))
    file_url: Mapped[str] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(String(255))