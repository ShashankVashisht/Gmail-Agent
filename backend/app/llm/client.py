from abc import ABC, abstractmethod

from openai import OpenAI

from app.core.config import get_settings


class LLMClient(ABC):
    """Anything that can turn a list of chat messages into a reply."""

    @abstractmethod
    def generate(self, messages: list[dict], system: str = "") -> str:
        """messages look like: [{"role": "user", "content": "Hi"}, ...]"""


class MockLLMClient(LLMClient):
    """Used when no API key is set. Lets you build and test everything for free."""

    def generate(self, messages: list[dict], system: str = "") -> str:
        last_user_message = next(
            (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
        )
        return f"[mock reply] You said: {last_user_message}"


class OpenAILLMClient(LLMClient):
    def __init__(self, api_key: str, model: str) -> None:
        self._client = OpenAI(api_key=api_key)
        self._model = model

    def generate(self, messages: list[dict], system: str = "") -> str:
        # OpenAI takes the system prompt as the first message in the list.
        full_messages = ([{"role": "system", "content": system}] if system else []) + messages
        response = self._client.chat.completions.create(
            model=self._model,
            messages=full_messages,
        )
        return response.choices[0].message.content or ""


def get_llm_client() -> LLMClient:
    """FastAPI dependency: real client if a key is set, otherwise the mock."""
    settings = get_settings()
    if settings.llm_api_key:
        return OpenAILLMClient(settings.llm_api_key, settings.llm_model)
    return MockLLMClient()