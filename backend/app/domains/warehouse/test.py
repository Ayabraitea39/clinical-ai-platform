from app.chatbot.engine import chat_with_entity_context
from .config import CAR_RENTAL_CONFIG

db = None


QUESTIONS = [
    (
        "Status question (vehicle 1)",
        "Is vehicle 1 available?"
    ),
    (
        "Location question (vehicle 2)",
        "Where is vehicle 2 located?"
    ),
    (
        "Details question (vehicle 3)",
        "Give me the details of vehicle 3."
    ),
    (
        "Unknown vehicle",
        "What is the status of vehicle 999?"
    ),
]


for label, question in QUESTIONS:
    print(f"\n--- {label} ---")
    print(f"Q: {question}")

    answer = chat_with_entity_context(
        db,
        question=question,
        config=CAR_RENTAL_CONFIG,
    )

    print(f"A: {answer}")