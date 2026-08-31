from app.chatbot.domain_config import DomainConfig
from . import tools as tool_funcs


CAR_RENTAL_RULES = (
    "1. For any question about vehicle data, always use the most specific "
    "appropriate tool to retrieve the real data. Never answer from memory.\n"

    "2. You must always specify which vehicle you are talking about by using "
    "the vehicle_id argument when calling tools. For example, if the user asks "
    "'Is vehicle 1 available?', you must call get_vehicle_status with "
    "vehicle_id=1. Do not call a vehicle tool without a vehicle_id.\n"

    "3. Use get_vehicle_status for questions about whether a vehicle is "
    "available, rented, or under maintenance. Use get_vehicle_location for "
    "questions about where a vehicle is located. Use get_vehicle_details for "
    "questions about a vehicle's general details, such as its name, plate, "
    "status, location, or daily rental rate.\n"

    "4. If the tool returns no data or an error, say that the information "
    "is not available. Never invent or assume information.\n"

    "5. If a tool fails, tell the user that the information could not be "
    "retrieved. Never guess."
)


CAR_RENTAL_CONFIG = DomainConfig(
    has_scoped_entity=False,
    entity_label="vehicle",
    entity_id_param="vehicle_id",
    get_entity_name=None,
    has_personal_name=False,

    system_prompt_rules=CAR_RENTAL_RULES,

    available_functions={
        "get_vehicle_status": tool_funcs.get_vehicle_status,
        "get_vehicle_location": tool_funcs.get_vehicle_location,
        "get_vehicle_details": tool_funcs.get_vehicle_details,
    },

    tool_schemas=[
        {
            "type": "function",
            "function": {
                "name": "get_vehicle_status",
                "description": (
                    "Returns the current status of a specific vehicle. "
                    "The status can be available, rented, or maintenance. "
                    "You MUST provide vehicle_id."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "vehicle_id": {
                            "type": "integer",
                            "description": (
                                "The numeric ID of the vehicle. "
                                "Extract it from the user's question, "
                                "such as 'vehicle 1' or 'vehicle 2'."
                            ),
                        }
                    },
                    "required": ["vehicle_id"],
                },
            },
        },

        {
            "type": "function",
            "function": {
                "name": "get_vehicle_location",
                "description": (
                    "Returns the current branch/location of a specific vehicle. "
                    "You MUST provide vehicle_id."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "vehicle_id": {
                            "type": "integer",
                            "description": (
                                "The numeric ID of the vehicle to locate."
                            ),
                        }
                    },
                    "required": ["vehicle_id"],
                },
            },
        },

        {
            "type": "function",
            "function": {
                "name": "get_vehicle_details",
                "description": (
                    "Returns the general details of a specific vehicle, "
                    "including its name, plate, status, location, and daily rate. "
                    "You MUST provide vehicle_id."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "vehicle_id": {
                            "type": "integer",
                            "description": (
                                "The numeric ID of the vehicle."
                            ),
                        }
                    },
                    "required": ["vehicle_id"],
                },
            },
        },
    ],

    safety_check=None,
)