from app.database import SessionLocal
from app.models import Doctor


# Each entry: (name, specialty) — plain name, no "Dr." prefix baked in.
# VisitModal.jsx adds "Dr. " itself when rendering the dropdown.

DOCTORS = [
    ("Karim Haddad", "General Medicine"),
    ("Husein Mokdad", "Pediatrics"),
    ("Sami Nassar", "Cardiology"),
    ("Ali Assef", "Dermatology"),
    ("Rami Aoun", "Orthopedics"),
    ("Aya Tfaily", "Obstetrics & Gynecology"),
    ("Fadi Chamoun", "Internal Medicine"),
    ("Maya Rahal", "Endocrinology"),
    ("Elie Bou Saab", "Neurology"),
    ("Mohammad Hareb", "Psychiatry"),
]


def normalize(name):
    # Strip whitespace and any accidental "Dr." prefix so matching is
    # consistent regardless of how the name was typed/stored before.
    n = name.strip()
    if n.lower().startswith("dr. "):
        n = n[4:].strip()
    elif n.lower().startswith("dr."):
        n = n[3:].strip()
    return n


def seed():
    db = SessionLocal()

    try:
        # --- Step 1: clean up existing rows (fix stray spaces / "Dr." prefixes,
        # and merge duplicates that resulted from the earlier mismatched keys) ---
        all_doctors = db.query(Doctor).all()
        seen = {}
        removed = 0

        for doc in all_doctors:
            clean_name = normalize(doc.name)
            if clean_name in seen:
                # duplicate — keep the first one we saw, delete this one
                db.delete(doc)
                removed += 1
            else:
                doc.name = clean_name
                seen[clean_name] = doc

        db.flush()

        # --- Step 2: upsert the seed list against the now-cleaned names ---
        existing_doctors = {
            doc.name: doc
            for doc in db.query(Doctor).all()
        }

        added = 0
        updated = 0

        for raw_name, specialty in DOCTORS:
            name = normalize(raw_name)
            existing = existing_doctors.get(name)

            if existing:
                existing.specialty = specialty
                updated += 1
            else:
                db.add(Doctor(name=name, specialty=specialty))
                added += 1

        db.commit()

        print("Seed completed successfully.")
        print(f"Removed duplicates: {removed}")
        print(f"New doctors: {added}")
        print(f"Updated doctors: {updated}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()