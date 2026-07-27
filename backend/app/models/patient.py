from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Numeric, Date, Boolean, Text
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