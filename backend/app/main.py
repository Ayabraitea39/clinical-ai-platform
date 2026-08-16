from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .routers.auth import router as auth_router
from .routers.patients import router as patients_router
from .routers.icd10 import router as icd10_router
from .routers.doctor import router as doctors_router
from .routers.visit import router as visits_router
from .routers.medicalAct import router as medical_acts_router
from app.routers.orders import router as orders_router
from app.routers.prescription import router as prescriptions_router
from app.routers import chat 
app = FastAPI(title="Clinical AI Assistant Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files at /uploads/<filename> — matches the file_url
# ("/uploads/{safe_name}") returned by the attached-files upload endpoint.
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router)
app.include_router(patients_router) 
app.include_router(icd10_router)
app.include_router(doctors_router)
app.include_router(visits_router)  
app.include_router(medical_acts_router)
app.include_router(orders_router)
app.include_router(prescriptions_router)
app.include_router(chat.router)


@app.get("/")
def health_check():
    return {"status": "ok"}