import os

_DOMAIN = os.getenv("CHATBOT_DOMAIN", "clinic").strip().lower()

if _DOMAIN == "clinic":
    from app.domains.clinic.config import CLINIC_CONFIG as ACTIVE_CONFIG

elif _DOMAIN == "warehouse":
    from app.domains.warehouse.config import WAREHOUSE_CONFIG as ACTIVE_CONFIG

else:
    raise ValueError(
        f"Unsupported CHATBOT_DOMAIN: {_DOMAIN!r}. "
        "Expected 'clinic' or 'warehouse'."
    )