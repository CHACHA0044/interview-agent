"""
Purpose:
OpenAI-compatible implementation of the ChatProvider protocol.

Responsibilities:
- Wraps the OpenAI Python SDK.
- Configures base_url, api_key, and model to support OpenAI, Azure, Groq, Ollama.
- Maps API exceptions to standard application errors cleanly without leaking keys.

Connected Files:
- app/llm/provider.py
- app/core/config.py

Important implementation notes:
- Uses synchronous API for now; can be upgraded to async if needed.
- Error handling wraps generic OpenAI errors to avoid leaking raw configurations.
"""

from typing import Any, Dict, List
import openai
from openai import OpenAI

from app.llm.provider import ChatProvider


class OpenAICompatibleProvider(ChatProvider):
    """
    Implementation of ChatProvider using the OpenAI SDK.
    Supports any OpenAI-compatible endpoint by changing base_url.
    """

    def __init__(self, api_key: str, model: str, base_url: str | None = None):
        """
        Initialize the provider.

        Args:
            api_key: The API key for the provider.
            model: The model name (e.g., gpt-4o-mini).
            base_url: Optional custom base URL for the API.
        """
        if not api_key:
            raise ValueError("API key must be provided for OpenAICompatibleProvider.")

        self.model = model
        
        # Configure client
        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url
            
        self.client = OpenAI(**client_kwargs) # type: ignore

    def complete(
        self,
        messages: List[Dict[str, Any]],
        *,
        json_mode: bool = False,
        temperature: float = 0.3
    ) -> str:
        """
        Generate a completion using the OpenAI SDK.
        """
        kwargs: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        try:
            response = self.client.chat.completions.create(**kwargs)
            return response.choices[0].message.content or ""
        except openai.APIConnectionError as e:
            raise RuntimeError("Failed to connect to the LLM API.") from e
        except openai.AuthenticationError as e:
            raise RuntimeError("LLM API authentication failed. Please check your credentials.") from e
        except openai.OpenAIError as e:
            # Generic catch-all for other OpenAI-specific errors
            raise RuntimeError(f"An error occurred while communicating with the LLM API: {e.__class__.__name__}") from e

    def embed(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings. (Placeholder for RAG task later)
        """
        # We will use text-embedding-3-small as a default or make it configurable later.
        # This is a basic implementation to satisfy the protocol.
        try:
            response = self.client.embeddings.create(
                input=texts,
                model="text-embedding-3-small"
            )
            return [data.embedding for data in response.data]
        except openai.OpenAIError as e:
            raise RuntimeError(f"Failed to generate embeddings: {e.__class__.__name__}") from e

    def available(self) -> bool:
        """
        Check availability by making a minimal models request.
        """
        try:
            # simple check if the client can list models
            self.client.models.list()
            return True
        except Exception:
            return False
