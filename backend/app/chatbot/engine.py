from abc import ABC, abstractmethod
from typing import Optional
from sqlalchemy.orm import Session
from app.chatbot.llm_router import call_llm
import json
import re

_POSSESSIVE_NAME_PATTERN = re.compile(r"\b([A-Z][a-zA-Z]+)'s\b")

# Common words that form an 's contraction (often because they start a
# sentence and get capitalized) but are never actual person names.
# Without this, "What's this customer's contact info?" gets misread as a
# reference to a person named "What".
_NON_NAME_CONTRACTIONS = {
    "what", "who", "where", "when", "why", "how", "which",
    "it", "that", "this", "there", "here", "he", "she",
    "let", "one",
}


class BaseDomainAssistant(ABC):
    """
    Shared engine for this project. this project is ALWAYS scoped to one entity (a patient/customer) 
    Every subclass MUST provide entity_label, entity_id_param, and
    get_entity_name — there's no way to skip them here.
    """

    # ---- MUST be provided by every subclass ----

    @property
    @abstractmethod
    def available_functions(self) -> dict:
        """{tool_name: python_function} — this business's own tools."""
        ...

    @property
    @abstractmethod
    def tool_schemas(self) -> list:
        """JSON tool schemas for the LLM, matching available_functions."""
        ...

    @property
    @abstractmethod
    def system_prompt_rules(self) -> str:
        """Numbered domain rules ONLY — the scoping rule is added
        automatically by this base class, so don't repeat it here."""
        ...

    @property
    @abstractmethod
    def entity_label(self) -> str:
        """e.g. 'patient' — used in guard messages and the system prompt."""
        ...

    @property
    @abstractmethod
    def entity_id_param(self) -> str:
        """The kwarg name every tool expects, e.g. 'patient_id'."""
        ...

    @abstractmethod
    def get_entity_name(self, db: Session, entity_id: int) -> Optional[str]:
        """Looks up the entity's real name, or None if not found."""
        ...

    # always applies here — no toggle needed for this project.
    has_personal_name: bool = True

    # ---- Optional hooks ----

    def safety_check(self, db: Session, entity_id: int, answer_text: str) -> Optional[str]:
        """A deterministic, non-LLM check appended after every answer."""
        return None

    # ---- Guard methods — always run, since this project is always scoped ----

    def mentions_different_id(self, question: str, current_id: int) -> bool:
        """Catches 'patient 004' when the currently open chart is a
        different patient — deterministic, never relies on the LLM."""
        pattern = re.compile(rf"{re.escape(self.entity_label)}\s*#?\s*0*(\d+)", re.IGNORECASE)
        for match in pattern.finditer(question):
            if int(match.group(1)) != current_id:
                return True
        return False

    def mentions_unrelated_name(self, question: str, current_name: str) -> bool:
        """Catches a possessive reference to any name that isn't the
        current entity's — 'Harry's address' when the chart open is
        someone else's, whether or not Harry exists anywhere else.

        Skips common contraction words (What's, It's, That's, ...) so
        ordinary sentence-initial capitalization isn't mistaken for a
        person's name.
        """
        current_parts = {p.lower() for p in current_name.split()}
        for match in _POSSESSIVE_NAME_PATTERN.finditer(question):
            candidate = match.group(1).lower()
            if candidate in _NON_NAME_CONTRACTIONS:
                continue
            if candidate not in current_parts:
                return True
        return False

    def _is_safe_non_data_reply(self, text: str) -> bool:
        text = text.strip().lower()
        safe_phrases = ("hello", "hi", "hey", "how can i help", "could you clarify", "could you rephrase")
        return any(text.startswith(p) for p in safe_phrases)

    def _build_system_prompt(self, entity_name: str) -> str:
        scoping_rule = (
            f"You are scoped to exactly ONE {self.entity_label}: {entity_name}. All tools "
            f"you call only ever return data for this {self.entity_label}, regardless of any "
            f"other {self.entity_label} name, number, or ID mentioned in the question. If the "
            f"question names a different {self.entity_label} than {entity_name}, you MUST "
            f"explicitly point out the mismatch and say you can only answer about the currently "
            f"scoped {self.entity_label} — do not silently answer as if the question was about it."
        )
        return (
            f"You are an assistant working with the record of the {self.entity_label} "
            f"currently open.\n\n{self.system_prompt_rules}\n\n{scoping_rule}"
        )

    # ---- Shared engine logic ----

    def chat(self, db: Session, entity_id: int, question: str, max_tool_rounds: int = 3) -> str:
        entity_name = self.get_entity_name(db, entity_id) or f"the current {self.entity_label}"

        if self.mentions_different_id(question, entity_id):
            return (
                f"I can only answer questions about {entity_name}, the {self.entity_label} "
                f"currently open. I'm not able to look up a different {self.entity_label}'s "
                f"ID from this chat — did you mean this {self.entity_label} instead?"
            )

        if self.has_personal_name and self.mentions_unrelated_name(question, entity_name):
            return (
                f"I can only answer questions about {entity_name}, the {self.entity_label} "
                f"currently open. Did you mean to ask about this {self.entity_label} instead?"
            )

        system_prompt = self._build_system_prompt(entity_name)
        messages = [{"role": "system", "content": system_prompt}]

        messages.append({"role": "user", "content": question})

        tool_call_fired = False

        for attempt in range(max_tool_rounds):
            print(f"[ROUND {attempt + 1}] sending {len(messages)} messages to LLM")

            try:
                msg = call_llm(messages, tools=self.tool_schemas, temperature=0)
            except Exception as e:
                print(f"[ERROR] call_llm failed: {e!r}")
                return "The clinical assistant is temporarily unavailable. Please try again shortly."

            if not msg.get("tool_calls"):
                content = msg.get("content", "")

                if tool_call_fired:
                    extra = self.safety_check(db, entity_id, content)
                    return f"{content}\n\n{extra}" if extra else content

                if self._is_safe_non_data_reply(content):
                    return content

                messages.append(msg)
                messages.append({
                    "role": "user",
                    "content": f"Please use the appropriate tool to retrieve the {self.entity_label}'s data.",
                })
                continue

            messages.append(msg)

            for call in msg["tool_calls"]:
                function_name = call["function"]["name"]
                print(f"[TOOL CALL] LLM chose: {function_name}")

                function = self.available_functions.get(function_name)
                if not function:
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
                arguments.pop(self.entity_id_param, None)

                try:
                    result = function(db, **{self.entity_id_param: entity_id}, **arguments)
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
            "I wasn't able to retrieve verified information for that question "
            f"after multiple attempts. Please try rephrasing, or check the "
            f"{self.entity_label}'s record directly."
        )