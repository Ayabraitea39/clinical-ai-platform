from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, Text
from typing import Optional
 
from .identity import Base
 
 
class Icd10Code(Base):
    __tablename__ = "icd10_codes"
 
    code: Mapped[str] = mapped_column(String(10), primary_key=True)
    english_explanation: Mapped[str] = mapped_column(Text)
    explanation: Mapped[Optional[str]] = mapped_column(Text)
 
 