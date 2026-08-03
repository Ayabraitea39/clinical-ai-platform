from pydantic import BaseModel


class Icd10CodeOut(BaseModel):
    code: str
    english_explanation: str

    class Config:
        from_attributes = True