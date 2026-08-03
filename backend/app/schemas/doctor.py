from pydantic import BaseModel


class DoctorOut(BaseModel):
    id: int
    name: str
    specialty: str

    class Config:
        from_attributes = True