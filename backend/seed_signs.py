from app.database import SessionLocal
from app.models import SignCategory, SignDefinition, SignDataType


CATEGORIES = {
    "Vital Signs": [
        ("Temperature (°C)", SignDataType.numeric, None, None),
        ("Blood pressure - systolic (mmHg)", SignDataType.numeric, None, None),
        ("Blood pressure - diastolic (mmHg)", SignDataType.numeric, None, None),
        ("Heart rate (bpm)", SignDataType.numeric, None, None),
        ("Respiratory rate (breaths/min)", SignDataType.numeric, None, None),
        ("Oxygen saturation (SpO2 %)", SignDataType.numeric, None, None),
        ("Weight (kg)", SignDataType.numeric, None, None),
        ("Height (cm)", SignDataType.numeric, None, None),
    ],

    "Chief Complaint": [
        (
            "Chief complaint",
            SignDataType.text,
            "Reason for visit",
            None,
        ),
        (
            "Duration of symptoms",
            SignDataType.text,
            "e.g. '3 days', '2 weeks'",
            None,
        ),
        (
            "Onset",
            SignDataType.list,
            None,
            "Sudden,Gradual",
        ),
    ],

    "Physical Exam": [
        (
            "General Appearance",
            SignDataType.multi_select,
            "Select all findings that apply",
            "Well-appearing,Acute distress,Pale,Diaphoretic,Cachectic,Lethargic",
        ),
        (
            "HEENT",
            SignDataType.multi_select,
            "Head, eyes, ears, nose, throat",
            "Normal,Pharyngeal erythema,Nasal congestion,Ear abnormality,Lymphadenopathy,Conjunctival pallor",
        ),
        (
            "Cardiovascular",
            SignDataType.multi_select,
            "Heart sounds and circulation",
            "Normal heart sounds,Murmur present,Irregular rhythm,Gallop,Peripheral edema,Delayed capillary refill",
        ),
        (
            "Respiratory",
            SignDataType.multi_select,
            "Breath sounds and effort",
            "Clear breath sounds,Wheezing,Crackles,Reduced air entry,Use of accessory muscles,Stridor",
        ),
        (
            "Abdominal",
            SignDataType.multi_select,
            "Abdominal exam findings",
            "Soft non-tender,Tenderness,Distension,Organomegaly,Rebound tenderness,Guarding",
        ),
        (
            "Neurological",
            SignDataType.multi_select,
            "Neurological exam findings",
            "Alert and oriented,Focal deficit,Abnormal reflexes,Sensory loss,Motor weakness,Gait abnormality",
        ),
        (
            "Skin",
            SignDataType.multi_select,
            "Skin exam findings",
            "Normal,Rash,Lesion,Bruising,Pallor,Jaundice",
        ),
    ],
}


def seed():
    db = SessionLocal()

    try:
        existing_categories = {
            category.name: category
            for category in db.query(SignCategory).all()
        }

        categories_added = 0
        categories_deleted = 0
        signs_added = 0
        signs_updated = 0
        signs_deleted = 0

        # =========================================================
        # 1. DELETE COMMON CATEGORIES REMOVED FROM CATEGORIES
        # =========================================================

        current_category_names = set(CATEGORIES.keys())

        for category_name, category in list(existing_categories.items()):
            common_signs = (
                db.query(SignDefinition)
                .filter(
                    SignDefinition.category_id == category.id,
                    SignDefinition.doctor_id == None,
                )
                .all()
            )
            if (
                category_name not in current_category_names
                and common_signs
            ):
                for sign in common_signs:
                    db.delete(sign)
                    signs_deleted += 1

                db.flush()

                # Check if the category still has signs
                remaining_signs = (
                    db.query(SignDefinition)
                    .filter(
                        SignDefinition.category_id == category.id
                    )
                    .count()
                )
                if remaining_signs == 0:
                    db.delete(category)
                    categories_deleted += 1

                print(
                    f"Deleted removed common category: "
                    f"'{category_name}'"
                )

        db.flush()

        for category_name, signs in CATEGORIES.items():


            category = existing_categories.get(category_name)

            if not category:
                category = SignCategory(name=category_name)

                db.add(category)
                db.flush()

                existing_categories[category_name] = category
                categories_added += 1

            existing_signs = {
                sign.name: sign
                for sign in (
                    db.query(SignDefinition)
                    .filter(
                        SignDefinition.category_id == category.id,
                        SignDefinition.doctor_id == None,
                    )
                    .all()
                )
            }

            # Names that should exist according to CATEGORIES
            current_sign_names = {
                name
                for name, _, _, _ in signs
            }

            for sign_name, existing_sign in existing_signs.items():

                if sign_name not in current_sign_names:
                    db.delete(existing_sign)
                    signs_deleted += 1

                    print(
                        f"Deleted removed common sign: "
                        f"'{sign_name}' "
                        f"from '{category_name}'"
                    )
            for name, data_type, description, predefined_values in signs:

                existing_sign = existing_signs.get(name)
                if existing_sign:
                    existing_sign.data_type = data_type
                    existing_sign.description = description
                    existing_sign.predefined_values = predefined_values

                    signs_updated += 1


                else:
                    new_sign = SignDefinition(
                        category_id=category.id,
                        doctor_id=None,
                        name=name,
                        data_type=data_type,
                        description=description,
                        predefined_values=predefined_values,
                    )

                    db.add(new_sign)
                    signs_added += 1



        db.commit()

        print("\nSeed completed successfully.")
        print(f"New categories: {categories_added}")
        print(f"Deleted categories: {categories_deleted}")
        print(f"New signs: {signs_added}")
        print(f"Updated signs: {signs_updated}")
        print(f"Deleted signs: {signs_deleted}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()