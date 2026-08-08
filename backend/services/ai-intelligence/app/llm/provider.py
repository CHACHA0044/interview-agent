"""
Purpose:
Defines the `ChatProvider` protocol for LLM interactions.

Responsibilities:
- Establishes the contract for any LLM provider used by the AI module.
- Ensures consistency across OpenAI, Azure, Groq, Ollama, etc.

Connected Files:
- app/llm/openai_provider.py
- app/llm/factory.py

Important implementation notes:
- Supports `json_mode` for structured outputs (needed for evaluation and questions).
- The `embed` method is a placeholder for future RAG implementation.
- Implementations must ensure they don't expose keys in exception logs.
"""

from typing import Any, Dict, List, Protocol


class ChatProvider(Protocol):
    """
    Protocol defining the core interface for an LLM provider.
    """

    def complete(
        self,
        messages: List[Dict[str, Any]],
        *,
        json_mode: bool = False,
        temperature: float = 0.3
    ) -> str:
        """
        Send a conversation to the LLM and return the generated completion.

        Args:
            messages: A list of message dictionaries, e.g., [{"role": "user", "content": "Hello"}].
            json_mode: Whether to enforce JSON formatted output.
            temperature: Sampling temperature.

        Returns:
            The completion string (or JSON string).
        """
        ...

    def embed(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts (for future RAG support).
        
        Args:
            texts: List of strings to embed.
            
        Returns:
            List of embedding vectors.
        """
        ...

    def available(self) -> bool:
        """
        Check if the provider is correctly configured and reachable.
        
        Returns:
            True if the provider is available, False otherwise.
        """
        ...
