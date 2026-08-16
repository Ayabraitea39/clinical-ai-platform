import os
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
MODEL_NAME = "mistral-small-latest"  


def call_llm(messages: list[dict], tools: list[dict] | None = None) -> dict:
    """
    Sends a conversation (+ optional tool definitions) to Mistral's cloud API.
    Returns the response message in the same shape as before, so the rest
    of the orchestrator code doesn't need to change.
    """
    if not MISTRAL_API_KEY:
        raise RuntimeError("MISTRAL_API_KEY is not set in your .env file")

    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "temperature": 0,
    }
    if tools:
        payload["tools"] = tools

    response = requests.post(
        MISTRAL_API_URL,
        headers={
            "Authorization": f"Bearer {MISTRAL_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]
