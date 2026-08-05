from typing import Optional
import datetime
from pydantic import BaseModel


class VisitCreate(BaseModel):
    patient_id: int
    doctor_id: int
    visit_date: datetime.date
    visit_type: str


class VisitOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    visit_date: datetime.date
    visit_type: str
    conclusion: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class VisitListItem(BaseModel):
    id: int
    visit_date: datetime.date
    visit_type: str
    doctor_name: str
    conclusion: Optional[str] = None
    status: str


class VisitStatusUpdate(BaseModel):
    status: str


class VisitSignCreate(BaseModel):
    sign_definition_id: int
    value: Optional[str] = None


class VisitSignsCreate(BaseModel):
    signs: list[VisitSignCreate]


class ConclusionUpdate(BaseModel):
    conclusion: str


class SignCategoryCreate(BaseModel):
    name: str


class SignCategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class SignDefinitionCreate(BaseModel):
    category_id: int
    name: str
    data_type: str
    doctor_id: Optional[int] = None
    description: Optional[str] = None
    predefined_values: Optional[str] = None


class SignDefinitionOut(BaseModel):
    id: int
    category_id: int
    name: str
    data_type: str
    doctor_id: Optional[int] = None
    description: Optional[str] = None
    predefined_values: Optional[str] = None

    class Config:
        from_attributes = True