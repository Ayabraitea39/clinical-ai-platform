"""
One-time script to seed the icd10_codes table with a curated set of common,
demo-relevant ICD-10 codes. Run once from backend/ with the venv activated:

    python seed_icd10.py

Safe to re-run: existing codes are skipped, not duplicated.
"""

from app.database import SessionLocal
from app.models import Icd10Code

CODES = [
    ("E11.9", "Type 2 diabetes mellitus without complications"),
    ("E10.9", "Type 1 diabetes mellitus without complications"),
    ("E03.9", "Hypothyroidism, unspecified"),
    ("E05.9", "Hyperthyroidism, unspecified"),
    ("E78.5", "Hyperlipidemia, unspecified"),
    ("E66.9", "Obesity, unspecified"),
    ("I10", "Essential (primary) hypertension"),
    ("I20.9", "Angina pectoris, unspecified"),
    ("I21.9", "Acute myocardial infarction, unspecified"),
    ("I25.1", "Atherosclerotic heart disease"),
    ("I48.91", "Unspecified atrial fibrillation"),
    ("I50.9", "Heart failure, unspecified"),
    ("I63.9", "Cerebral infarction, unspecified"),
    ("J45.9", "Asthma, unspecified"),
    ("J44.9", "Chronic obstructive pulmonary disease, unspecified"),
    ("J18.9", "Pneumonia, unspecified organism"),
    ("J06.9", "Acute upper respiratory infection, unspecified"),
    ("J20.9", "Acute bronchitis, unspecified"),
    ("J01.90", "Acute sinusitis, unspecified"),
    ("K21.9", "Gastro-esophageal reflux disease without esophagitis"),
    ("K29.70", "Gastritis, unspecified, without bleeding"),
    ("K59.00", "Constipation, unspecified"),
    ("K58.9", "Irritable bowel syndrome without diarrhea"),
    ("K80.20", "Cholelithiasis without obstruction"),
    ("N18.3", "Chronic kidney disease, stage 3"),
    ("N39.0", "Urinary tract infection, site not specified"),
    ("N40.0", "Benign prostatic hyperplasia without lower urinary tract symptoms"),
    ("F41.1", "Generalized anxiety disorder"),
    ("F32.9", "Major depressive disorder, single episode, unspecified"),
    ("F41.9", "Anxiety disorder, unspecified"),
    ("G43.909", "Migraine, unspecified, not intractable, without status migrainosus"),
    ("G47.00", "Insomnia, unspecified"),
    ("M54.5", "Low back pain"),
    ("M54.2", "Cervicalgia"),
    ("M25.50", "Pain in unspecified joint"),
    ("M79.1", "Myalgia"),
    ("M19.90", "Osteoarthritis, unspecified site"),
    ("M06.9", "Rheumatoid arthritis, unspecified"),
    ("M81.0", "Age-related osteoporosis without current pathological fracture"),
    ("L20.9", "Atopic dermatitis, unspecified"),
    ("L30.9", "Dermatitis, unspecified"),
    ("L03.90", "Cellulitis, unspecified"),
    ("H10.9", "Conjunctivitis, unspecified"),
    ("H52.4", "Presbyopia"),
    ("H66.90", "Otitis media, unspecified, unspecified ear"),
    ("H61.20", "Impacted cerumen, unspecified ear"),
    ("R51.9", "Headache, unspecified"),
    ("R50.9", "Fever, unspecified"),
    ("R05.9", "Cough, unspecified"),
    ("R10.9", "Unspecified abdominal pain"),
    ("R11.0", "Nausea"),
    ("R42", "Dizziness and giddiness"),
    ("R53.83", "Other fatigue"),
    ("R06.02", "Shortness of breath"),
    ("Z00.00", "Encounter for general adult medical examination without abnormal findings"),
    ("Z23", "Encounter for immunization"),
    ("Z34.90", "Encounter for supervision of normal pregnancy, unspecified trimester"),
    ("O99.019", "Anemia complicating pregnancy, unspecified trimester"),
    ("D64.9", "Anemia, unspecified"),
    ("D50.9", "Iron deficiency anemia, unspecified"),
]


def seed():
    db = SessionLocal()
    try:
        existing_codes = {c.code for c in db.query(Icd10Code.code).all()}
        added = 0
        for code, explanation in CODES:
            if code in existing_codes:
                continue
            db.add(Icd10Code(code=code, english_explanation=explanation))
            added += 1
        db.commit()
        print(f"Seeded {added} new ICD-10 codes ({len(CODES) - added} already existed).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()