import os
from app.chatbot import llm as mistral_llm
from app.chatbot import llm_ollama

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mistral").strip().lower()


def call_llm(*args, **kwargs):
    if LLM_PROVIDER == "ollama":
        return llm_ollama.call_llm(*args, **kwargs)
    return mistral_llm.call_llm(*args, **kwargs)