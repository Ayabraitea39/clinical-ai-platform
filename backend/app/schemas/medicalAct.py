from pydantic import BaseModel


class MedicalActOut(BaseModel):
    id: int
    name: str
    classification: str

    class Config:
        from_attributes = True