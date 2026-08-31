from dataclasses import dataclass,field
from typing import Callable, Optional
from sqlalchemy.orm import Session


@dataclass
class DomainConfig:
    """
    Everything that makes the chatbot specific to ONE business — a clinic,
    a warehouse, a citizen registry, anything. The engine (engine.py)
    knows nothing about any of this; it only knows how to use whatever a
    DomainConfig gives it. Switching businesses means writing a new
    DomainConfig, never touching the engine.
    """

    # Is this chatbot opened from one specific record?true for our case in this clinic
    # Which products are low in stock? false there isn't one specific product currently open in warehouses for example
    has_scoped_entity: bool = True

    # patient/item/employee/vehicle
    entity_label: Optional[str] = None

    # entity's ID — e.g. "patient_id", "item_id", "employee_id". Only
    # meaningful when has_scoped_entity is True.
    entity_id_param: Optional[str] = None

    # (db, entity_id) -> str | None — looks up the entity's real name
    # Only meaningful when has_scoped_entity is True.
    get_entity_name: Optional[Callable[[Session, int], Optional[str]]] = None

    # Whether this entity has a human name at all. Patients, citizens, and
    # employees do; a warehouse item usually doesn't
    # Only meaningful when has_scoped_entity is True.
    has_personal_name: bool = True

    # Numbered domain rules ONLY
    # and only when has_scoped_entity is True.
    system_prompt_rules: str = ""

    # {tool_name: python_function} — exactly like today's AVAILABLE_FUNCTIONS
    available_functions: dict = field(default_factory=dict)

    # JSON tool schemas for the LLM — exactly like today's TOOL_SCHEMAS
    tool_schemas: list = field(default_factory=list)

    safety_check: Optional[Callable[[Session, Optional[int], str], Optional[str]]] = None