from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Doctor
from ..schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserOut
from ..security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    doctor_id = None
    if payload.role == "doctor":
        if not payload.doctor:
            raise HTTPException(status_code=400, detail="Doctor profile is required for role 'doctor'")
        doctor = Doctor(name=payload.doctor.name, specialty=payload.doctor.specialty)
        db.add(doctor)
        db.flush()
        doctor_id = doctor.id

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
        doctor_id=doctor_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))