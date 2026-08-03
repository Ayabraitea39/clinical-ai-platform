from app.database import SessionLocal
from app.models import MedicalAct, ActClassification


# Each entry: (name, classification)

MEDICAL_ACTS = [
    # ---------------- MEDICINE ----------------
    ("Amoxicillin 500mg", ActClassification.medicine),
    ("Paracetamol 500mg", ActClassification.medicine),
    ("Ibuprofen 400mg", ActClassification.medicine),
    ("Metformin 500mg", ActClassification.medicine),
    ("Amlodipine 5mg", ActClassification.medicine),
    ("Omeprazole 20mg", ActClassification.medicine),
    ("Atorvastatin 20mg", ActClassification.medicine),
    ("Azithromycin 250mg", ActClassification.medicine),
    ("Cetirizine 10mg", ActClassification.medicine),
    ("Salbutamol Inhaler 100mcg", ActClassification.medicine),

    # ---------------- TEST ----------------
    ("Complete Blood Count (CBC)", ActClassification.test),
    ("Fasting Blood Glucose", ActClassification.test),
    ("Lipid Panel", ActClassification.test),
    ("Liver Function Test (LFT)", ActClassification.test),
    ("Kidney Function Test (KFT)", ActClassification.test),
    ("Thyroid Stimulating Hormone (TSH)", ActClassification.test),
    ("HbA1c", ActClassification.test),
    ("Urinalysis", ActClassification.test),
    ("C-Reactive Protein (CRP)", ActClassification.test),
    ("Blood Culture", ActClassification.test),

    # ---------------- IMAGING ----------------
    ("Chest X-Ray", ActClassification.imaging),
    ("Abdominal Ultrasound", ActClassification.imaging),
    ("CT Scan - Head", ActClassification.imaging),
    ("MRI - Lumbar Spine", ActClassification.imaging),
    ("Echocardiogram", ActClassification.imaging),
    ("Mammogram", ActClassification.imaging),
    ("Bone Density Scan (DEXA)", ActClassification.imaging),
    ("Doppler Ultrasound - Lower Limb", ActClassification.imaging),
    ("X-Ray - Knee", ActClassification.imaging),
    ("CT Scan - Chest", ActClassification.imaging),

    # ---------------- OTHER ----------------
    ("General Consultation", ActClassification.other),
    ("Follow-up Consultation", ActClassification.other),
    ("Wound Dressing", ActClassification.other),
    ("Suture Removal", ActClassification.other),
    ("ECG (Electrocardiogram)", ActClassification.other),
    ("Vaccination Administration", ActClassification.other),
    ("Physiotherapy Session", ActClassification.other),
    ("Nebulization", ActClassification.other),
    ("IV Fluid Administration", ActClassification.other),
    ("Minor Procedure - Skin Lesion Removal", ActClassification.other),
]


def seed():
    db = SessionLocal()

    try:
        existing_acts = {
            act.name: act
            for act in db.query(MedicalAct).all()
        }

        added = 0
        updated = 0

        for name, classification in MEDICAL_ACTS:
            existing = existing_acts.get(name)

            if existing:
                existing.classification = classification
                updated += 1
            else:
                db.add(MedicalAct(name=name, classification=classification))
                added += 1

        db.commit()

        print("Seed completed successfully.")
        print(f"New medical acts: {added}")
        print(f"Updated medical acts: {updated}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()