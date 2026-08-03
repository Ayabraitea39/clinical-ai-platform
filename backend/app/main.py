from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.auth import router as auth_router
from .routers.patients import router as patients_router
from .routers.icd10 import router as icd10_router
from .routers.doctor import router as doctors_router
from .routers.visit import router as visits_router
from .routers.medicalAct import router as medical_acts_router

app = FastAPI(title="Clinical AI Assistant Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(patients_router) 
app.include_router(icd10_router)
app.include_router(doctors_router)
app.include_router(visits_router)  
app.include_router(medical_acts_router)


@app.get("/")
def health_check():
    return {"status": "ok"}