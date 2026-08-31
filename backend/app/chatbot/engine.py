from sqlalchemy.orm import Session
from app.chatbot.llm_router import call_llm
from app.chatbot.domain_config import DomainConfig
from typing import Optional
import json
import re

_POSSESSIVE_NAME_PATTERN = re.compile(r"\b([A-Z][a-zA-Z]+)'s\b")

#This checks whether the user mentions a different entity ID from the one currently open.
def _mentions_different_id(question: str, entity_label: str, current_id: int) -> bool:
    """Generic version of the old _mentions_someone_else's ID check —
    'patient 004' becomes '{entity_label} 004' for any domain."""
    pattern = re.compile(rf"{re.escape(entity_label)}\s*#?\s*0*(\d+)", re.IGNORECASE)
    for match in pattern.finditer(question):
        if int(match.group(1)) != current_id:
            return True
    return False

#This checks whether the user mentions a different person's name.
def _mentions_unrelated_name(question: str, current_name: str) -> bool:
    """Generic version of the possessive-name check. Only meaningful for
    domains where has_personal_name is True (see DomainConfig)."""
    current_parts = {part.lower() for part in current_name.split()}
    for match in _POSSESSIVE_NAME_PATTERN.finditer(question):
        if match.group(1).lower() not in current_parts:
            return True
    return False


def _is_safe_non_data_reply(text: str) -> bool:
    text = text.strip().lower()
    safe_phrases = ("hello", "hi", "hey", "how can i help", "could you clarify", "could you rephrase")
    return any(text.startswith(phrase) for phrase in safe_phrases)

#This builds the instructions given to the LLM.
def _build_system_prompt(config: DomainConfig, entity_name: Optional[str]) -> str:
    """Assembles the full system prompt: the domain's own rules (config.system_prompt_rules)
    plus, ONLY for scoped domains, one final rule the engine adds automatically —
    the 'stay scoped to this one entity' rule, worded using entity_label."""
    if not config.has_scoped_entity:
        return (
            f"You are an assistant for this system.\n\n"
            f"{config.system_prompt_rules}"
        )

    scoping_rule = (
        f"You are scoped to exactly ONE {config.entity_label}: {entity_name}. All tools "
        f"you call only ever return data for this {config.entity_label}, regardless of any "
        f"other {config.entity_label} name, number, or ID mentioned in the question. If the "
        f"question names a different {config.entity_label} than {entity_name}, you MUST "
        f"explicitly point out the mismatch and say you can only answer about the currently "
        f"scoped {config.entity_label} — do not silently answer as if the question was about it."
    )
    return (
        f"You are an assistant working with the record of the {config.entity_label} "
        f"currently open.\n\n"
        f"{config.system_prompt_rules}\n\n"
        f"{scoping_rule}"
    )


def chat_with_entity_context(
    db: Session,
    question: str,
    config: DomainConfig,
    entity_id: Optional[int] = None,
    max_tool_rounds: int = 3,
) -> str:
    entity_name = None

    if config.has_scoped_entity:
        entity_name = config.get_entity_name(db, entity_id) or f"the current {config.entity_label}"

        # 1. Numeric ID mismatch
        if _mentions_different_id(question, config.entity_label, entity_id):
            return (
                f"I can only answer questions about {entity_name}, the {config.entity_label} "
                f"currently open. I'm not able to look up a different {config.entity_label}'s "
                f"ID from this chat — did you mean this {config.entity_label} instead?"
            )

        # 2. Possessive-name mismatch — only for domains whose entities
        # actually have personal names.
        if config.has_personal_name and _mentions_unrelated_name(question, entity_name):
            return (
                f"I can only answer questions about {entity_name}, the {config.entity_label} "
                f"currently open. Did you mean to ask about this {config.entity_label} instead?"
            )

    system_prompt = _build_system_prompt(config, entity_name)
    messages = [{"role": "system", "content": system_prompt}]

    messages.append({"role": "user", "content": question})

    tool_call_fired = False

    for attempt in range(max_tool_rounds):
        print(f"[ROUND {attempt + 1}] sending {len(messages)} messages to LLM")

        try:
            msg = call_llm(messages, tools=config.tool_schemas, temperature=0)
        except Exception as e:
            print(f"[ERROR] call_llm failed: {e!r}")
            return "The assistant is temporarily unavailable. Please try again shortly."

        if not msg.get("tool_calls"):
            content = msg.get("content", "")

            if tool_call_fired:
                if config.safety_check:
                    extra = config.safety_check(db, entity_id, content)
                    if extra:
                        content = f"{content}\n\n{extra}"
                return content

            if _is_safe_non_data_reply(content):
                return content

            scope_word = config.entity_label if config.has_scoped_entity else "relevant"
            messages.append(msg)
            messages.append({
                "role": "user",
                "content": f"Please use the appropriate tool to retrieve the {scope_word} data.",
            })
            continue

        messages.append(msg)

        for call in msg["tool_calls"]:
            function_name = call["function"]["name"]
            print(f"[TOOL CALL] LLM chose: {function_name}")

            function = config.available_functions.get(function_name)

            if not function:
                print(f"[TOOL CALL] unknown tool requested: {function_name}")
                messages.append({
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "content": str({"error": f"unknown tool '{function_name}'"}),
                })
                continue

            raw_arguments = call["function"].get("arguments") or {}
            if isinstance(raw_arguments, str):
                try:
                    arguments = json.loads(raw_arguments)
                except json.JSONDecodeError:
                    arguments = {}
            else:
                arguments = dict(raw_arguments)

            print(f"[TOOL CALL] {function_name} args: {arguments}")

            try:
                if config.has_scoped_entity:
                    # Backend owns the ID — never trust one the LLM might
                    # have supplied, always inject the real one.
                    arguments.pop(config.entity_id_param, None)
                    result = function(db, **{config.entity_id_param: entity_id}, **arguments)
                else:
                    # No backend-owned ID to inject — call with exactly
                    # whatever the LLM extracted from the question
                    # (item name, SKU, etc.), same as any normal tool call.
                    result = function(db, **arguments)
            except Exception as e:
                result = {"error": f"tool execution failed: {e}"}
                print(f"[TOOL CALL] {function_name} raised: {e!r}")

            tool_call_fired = True
            messages.append({
                "role": "tool",
                "tool_call_id": call["id"],
                "content": str(result),
            })

    return (
        "I wasn't able to retrieve verified information for that question after "
        "multiple attempts. Please try rephrasing, or check the record directly."
    )