from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional
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
    condition: str

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    pass

class PatientOut(PatientBase):
    id: int

    class Config:
        from_attributes = True

class HabitBase(BaseModel):
    smoking_packs_per_day: Optional[float] = 0
    smoking_quit_date: Optional[date] = None
    hookah: bool = False
    cigarettes: bool = False
    alcohol: bool = False
    drug_use: bool = False
    notes: Optional[str] = None

class HabitCreate(HabitBase):
    pass

class HabitUpdate(HabitBase):
    pass

class HabitOut(HabitBase):
    id: int
    patient_id: int

    class Config:
        from_attributes = True


class AttachedFileOut(BaseModel):
    id: int
    patient_id: int
    visit_id: Optional[int] = None
    file_url: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ChronicDiseaseBase(BaseModel):
    icd10_code: Optional[str] = None
    discovery_date: Optional[date] = None
    notes: Optional[str] = None

class ChronicDiseaseCreate(ChronicDiseaseBase):
    pass

class ChronicDiseaseOut(ChronicDiseaseBase):
    id: int
    patient_id: int

    class Config:
        from_attributes = True


class FamilyHistoryBase(BaseModel):
    icd10_code: Optional[str] = None
    kinship: Optional[str] = None
    living_conditions: Optional[str] = None
    notes: Optional[str] = None

class FamilyHistoryCreate(FamilyHistoryBase):
    pass

class FamilyHistoryOut(FamilyHistoryBase):
    id: int
    patient_id: int

    class Config:
        from_attributes = True


class SurgicalHistoryBase(BaseModel):
    procedure: str
    surgery_date: Optional[date] = None
    notes: Optional[str] = None

class SurgicalHistoryCreate(SurgicalHistoryBase):
    pass

class SurgicalHistoryOut(SurgicalHistoryBase):
    id: int
    patient_id: int

    class Config:
        from_attributes = True


class ImmunizationBase(BaseModel):
    vaccine_type: str
    age_at_vaccination: Optional[int] = None
    age_unit: Optional[str] = None
    taken_status: bool = False

class ImmunizationCreate(ImmunizationBase):
    pass

class ImmunizationOut(ImmunizationBase):
    id: int
    patient_id: int

    class Config:
        from_attributes = True


class AllergyBase(BaseModel):
    allergen: str
    reaction: Optional[str] = None
    severity: Optional[str] = None

class AllergyCreate(AllergyBase):
    pass

class AllergyOut(AllergyBase):
    id: int
    patient_id: int

    class Config:
        from_attributes = True


class CurrentMedicationBase(BaseModel):
    medicine_name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[date] = None
    duration: Optional[str] = None

class CurrentMedicationCreate(CurrentMedicationBase):
    pass

class CurrentMedicationOut(CurrentMedicationBase):
    id: int
    patient_id: int

    class Config:
        from_attributes = True

class InsuranceCoverageBase(BaseModel):
    provider: Optional[str] = None
    policy_number: Optional[str] = None

class InsuranceCoverageCreate(InsuranceCoverageBase):
    pass

class InsuranceCoverageOut(InsuranceCoverageBase):
    id: int
    patient_id: int

    class Config:
        from_attributes = True