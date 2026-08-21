import os
import time
import uuid
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")
OLLAMA_API_URL = "https://ollama.com/api/chat"
MODEL_NAME = os.getenv("OLLAMA_MODEL_NAME", "gpt-oss:120b")


class LLMUnavailableError(Exception):
    """Raised when the LLM provider is unreachable after retries."""
    pass


def call_llm(
    messages: list[dict],
    tools: list[dict] | None = None,
    temperature: float = 0,
    max_retries: int = 2,
    backoff: float = 1.5,
) -> dict:
    if not OLLAMA_API_KEY:
        raise RuntimeError("OLLAMA_API_KEY is not set in your .env file")

    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False,
        "options": {"temperature": temperature},
    }
    if tools:
        payload["tools"] = tools

    last_error = None
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(
                OLLAMA_API_URL,
                headers={
                    "Authorization": f"Bearer {OLLAMA_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=60,
            )
            response.raise_for_status()
            message = response.json()["message"]
            if message.get("tool_calls"):
                for call in message["tool_calls"]:
                    call.setdefault("id", str(uuid.uuid4()))

            return message

        except requests.exceptions.HTTPError as e:
            last_error = e
            status = e.response.status_code if e.response is not None else None
            if status in (503, 429) and attempt < max_retries:
                print(f"[LLM-Ollama] {status} error, retrying (attempt {attempt + 1}/{max_retries})...")
                time.sleep(backoff * (attempt + 1))
                continue
            break

        except requests.exceptions.RequestException as e:
            last_error = e
            if attempt < max_retries:
                print(f"[LLM-Ollama] connection error, retrying (attempt {attempt + 1}/{max_retries})...")
                time.sleep(backoff * (attempt + 1))
                continue
            break

    raise LLMUnavailableError(f"Ollama Cloud API unavailable after {max_retries + 1} attempts: {last_error}")