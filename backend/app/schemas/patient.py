from pydantic import BaseModel, EmailStr
from datetime import date
from app.models.identity import Gender, BloodType, SocialStatus

class PatientBase(BaseModel):
    full_name: str
    date_of_birth: date
    gender: Gender
    blood_type: BloodType
    nationality: str
    social_status: SocialStatus
    phone: str
    email: EmailStr
    address: str

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    pass

class PatientOut(PatientBase):
    id: int

    class Config:
        from_attributes = True