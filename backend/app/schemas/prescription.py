from datetime import date
from typing import Optional

from pydantic import BaseModel

from .medicalAct import MedicalActOut


class PrescriptionBase(BaseModel):
    medical_act_id: int
    dose: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    start_date: Optional[date] = None
    duration: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    visit_id: int


class PrescriptionOut(PrescriptionBase):
    id: int
    visit_id: int
    medical_act: MedicalActOut

    class Config:
        from_attributes = True
