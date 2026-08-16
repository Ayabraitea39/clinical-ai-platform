import datetime
from typing import Optional

from pydantic import BaseModel

from .medicalAct import MedicalActOut


class OrderBase(BaseModel):
    medical_act_id: int
    reason: Optional[str] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    visit_id: int


class OrderResultAttachmentOut(BaseModel):
    id: int
    file_name: str
    file_url: str
    content_type: Optional[str] = None
    file_size: Optional[int] = None

    class Config:
        from_attributes = True


class OrderResultOut(BaseModel):
    id: int
    order_id: int
    result_text: str
    result_date: datetime.date
    notes: Optional[str] = None
    attachments: list[OrderResultAttachmentOut] = []

    class Config:
        from_attributes = True


class OrderOut(OrderBase):
    id: int
    visit_id: int
    medical_act: MedicalActOut
    result: Optional[OrderResultOut] = None

    class Config:
        from_attributes = True