from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


class DoctorProfileIn(BaseModel):
    name: str
    specialty: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str  # "staff" or "doctor"
    doctor: Optional[DoctorProfileIn] = None

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v):
        if v not in ("staff", "doctor"):
            raise ValueError("role must be 'staff' or 'doctor'")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v):
        if not v.strip():
            raise ValueError("name is required")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    doctor_id: Optional[int] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut