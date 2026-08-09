"""
Purpose:
Provides a deterministic FakeLLMProvider used when LLM_PROVIDER=fake.

Responsibilities:
- Implements the ChatProvider protocol without any network calls.
- Returns a deterministic placeholder completion (real generators bypass the
  provider entirely in fake mode and produce contract-valid outputs directly).
- Produces stable, hash-based embeddings so RAG code paths stay consistent.

Connected Files:
- app/llm/factory.py
- app/services/question_generator.py
- app/services/evaluator.py
- app/services/feedback_generator.py
- app/rag/retriever.py
"""

import hashlib
import json
from typing import Any, Dict, List


class FakeLLMProvider:
    """A no-network ChatProvider for offline/demo/test use."""

    EMBEDDING_SIZE = 16

    def __init__(self, model: str = "fake-model") -> None:
        self.model = model

    def complete(
        self,
        messages: List[Dict[str, Any]],
        *,
        json_mode: bool = False,
        temperature: float = 0.3
    ) -> str:
        """
        Returns a fixed deterministic completion. Service-layer generators
        detect FakeLLMProvider and produce structured outputs directly, so this
        path is only hit by direct provider consumers.

        When json_mode is requested the output is still valid, parseable JSON
        (even though it does not match any specific Pydantic schema) so that
        upstream JSON parsing never crashes on a non-JSON string.
        """
        last_user = ""
        for message in reversed(messages):
            if message.get("role") == "user":
                last_user = message.get("content", "")
                break
        preview = last_user.strip().splitlines()
        snippet = preview[0][:80] if preview else "no prompt"

        if json_mode:
            return json.dumps({"fake": True, "note": f"fake-completion based on: {snippet}"})

        return f"[fake-completion] based on: {snippet}"

    def embed(self, texts: List[str]) -> List[List[float]]:
        """Generates stable, deterministic embeddings via a text hash."""
        vectors: List[List[float]] = []
        for text in texts:
            digest = hashlib.sha256(text.encode("utf-8")).digest()
            vector = [
                (digest[i] - 128) / 128.0 for i in range(min(self.EMBEDDING_SIZE, len(digest)))
            ]
            vectors.append(vector)
        return vectors

    def available(self) -> bool:
        """A fake provider is always available."""
        return True

    def degraded(self) -> bool:
        """A fake provider never degrades."""
        return False
