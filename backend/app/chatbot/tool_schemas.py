TOOL_SCHEMAS = [
    {"type": "function", "function": {
        "name": "get_patient_summary",
        "description": "Returns a quick overview of the patient: demographics, chronic disease codes, allergy names, current medication names, and last visit date.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_allergies",
        "description": "Returns the patient's recorded allergies, including allergen, reaction, and severity.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_current_medications",
        "description": "Returns medications the patient is currently taking, including dose and frequency.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_chronic_diseases",
        "description": "Returns the patient's chronic diseases with ICD-10 code, discovery date, and notes.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_visit_detail",
        "description": "Returns full detail for one visit: conclusion, vital signs, prescriptions, and orders. If visit_date is omitted, returns the most recent visit.",
        "parameters": {"type": "object", "properties": {
            "visit_date": {"type": "string", "description": "Date in YYYY-MM-DD format. Omit for the most recent visit."}
        }, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_all_visits",
        "description": "Returns a list of all the patient's visits with date, type, and conclusion — useful for finding or listing visits.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_order_reason",
        "description": "Returns the reason and notes for a specific ordered test/imaging/procedure, matched by name.",
        "parameters": {"type": "object", "properties": {
            "order_act_name": {"type": "string", "description": "Name (or partial name) of the ordered act, e.g. 'Chest X-Ray'"}
        }, "required": ["order_act_name"]},
    }},
    {"type": "function", "function": {
        "name": "compare_last_two_visits",
        "description": "Compares the patient's two most recent visits side by side: conclusion, medications, and orders for each.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_sign_trend",
        "description": "Returns how a specific vital sign or measurement has changed across recent visits, oldest to newest — use for trend questions.",
        "parameters": {"type": "object", "properties": {
            "sign_name": {"type": "string", "description": "Name of the sign, e.g. 'Temperature', 'Blood Pressure'"},
            "num_visits": {"type": "integer", "description": "How many recent visits to include (default 3)"}
        }, "required": ["sign_name"]},
    }},
    {"type": "function", "function": {
        "name": "get_visit_medical_acts",
        "description": "Returns medical acts (prescriptions/orders) for a visit, optionally filtered by classification.",
        "parameters": {"type": "object", "properties": {
            "visit_date": {"type": "string", "description": "YYYY-MM-DD. Omit for most recent visit."},
            "classification": {"type": "string", "description": "One of: medicine, test, imaging, other. Omit for all."}
        }, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_visit_signs_by_category",
        "description": "Returns signs recorded for a visit within one category, e.g. vitals or chief complaint.",
        "parameters": {"type": "object", "properties": {
            "category_name": {"type": "string", "description": "Category name, e.g. 'Vitals'"},
            "visit_date": {"type": "string", "description": "YYYY-MM-DD. Omit for most recent visit."}
        }, "required": ["category_name"]},
    }},
    {"type": "function", "function": {
        "name": "get_attached_files",
        "description": "Returns files attached to the patient or a specific visit.",
        "parameters": {"type": "object", "properties": {
            "visit_date": {"type": "string", "description": "YYYY-MM-DD. Omit for all files across all visits."}
        }, "required": []},
    }},
    {"type": "function", "function": {
        "name": "get_full_patient_record",
        "description": "Returns the complete patient record: demographics, chronic diseases, allergies, medications, visit count/dates, and most recent visit detail. Use for broad, open-ended questions like 'give me his full history'.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},

    {"type": "function", "function": {
    "name": "get_contact_info",
    "description": "Returns the patient's contact information: phone number, email, and address.",
    "parameters": {"type": "object", "properties": {}, "required": []},
}},

# --- Append these entries to the TOOL_SCHEMAS list in tool_schemas.py ---

{"type": "function", "function": {
    "name": "get_surgical_history",
    "description": "Returns the patient's past surgical procedures, including procedure description, surgery date, and notes.",
    "parameters": {"type": "object", "properties": {}, "required": []},
}},
{"type": "function", "function": {
    "name": "get_family_history",
    "description": "Returns the patient's family medical history: condition (ICD-10), kinship relation, living conditions, and notes.",
    "parameters": {"type": "object", "properties": {}, "required": []},
}},
{"type": "function", "function": {
    "name": "get_immunizations",
    "description": "Returns the patient's immunization/vaccination records, including vaccine type, age at vaccination, and whether it was taken.",
    "parameters": {"type": "object", "properties": {}, "required": []},
}},
]