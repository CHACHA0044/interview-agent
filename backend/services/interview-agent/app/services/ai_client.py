"""
Purpose:
Async HTTP client for calling the ai-intelligence service.

Responsibilities:
- Wraps the ai-intelligence internal API (backend/shared/schemas/ai_api.json).
- Provides typed async methods: generate_question, generate_followup,
  evaluate_answer, generate_feedback.
- Retries transient failures (connect errors and 5xx) a bounded number of times.

Connected Files:
- app/core/config.py
- app/services/orchestrator.py
"""

import logging
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


class AIIntelligenceError(RuntimeError):
    pass


class AIIntelligenceClient:
    def __init__(
        self,
        base_url: str,
        timeout_seconds: float = 30.0,
        retries: int = 2,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout_seconds
        self.retries = retries

    async def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        last_error: Optional[Exception] = None
        attempts = self.retries + 1
        for attempt in range(attempts):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code >= 500:
                        raise AIIntelligenceError(
                            f"ai-intelligence returned {resp.status_code} for {path}"
                        )
                    resp.raise_for_status()
                    return resp.json()
            except (httpx.HTTPError, AIIntelligenceError) as exc:
                last_error = exc
                logger.warning(
                    "ai-intelligence call %s failed (attempt %d/%d): %s",
                    path,
                    attempt + 1,
                    attempts,
                    exc,
                )
                if attempt + 1 < attempts:
                    import asyncio

                    await asyncio.sleep(0.2 * (attempt + 1))
        raise AIIntelligenceError(f"ai-intelligence call {path} failed after {attempts} attempts") from last_error

    async def generate_question(
        self,
        candidate_context: Dict[str, Any],
        curriculum_context: Dict[str, Any],
        conversation: List[Dict[str, str]],
        question_strategy: Dict[str, Any],
    ) -> Dict[str, Any]:
        payload = {
            "candidateContext": candidate_context,
            "curriculumContext": curriculum_context,
            "conversation": conversation,
            "questionStrategy": question_strategy,
        }
        return await self._post("/internal/ai/generate-question", payload)

    async def generate_followup(
        self,
        candidate_context: Dict[str, Any],
        curriculum_context: Dict[str, Any],
        conversation: List[Dict[str, str]],
        follow_up_strategy: Dict[str, Any],
    ) -> Dict[str, Any]:
        payload = {
            "candidateContext": candidate_context,
            "curriculumContext": curriculum_context,
            "conversation": conversation,
            "followUpStrategy": follow_up_strategy,
        }
        return await self._post("/internal/ai/generate-followup", payload)

    async def evaluate_answer(
        self,
        question: Dict[str, Any],
        candidate_context: Dict[str, Any],
        candidate_answer: str,
        retrieved_context: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "question": question,
            "candidateContext": candidate_context,
            "candidateAnswer": candidate_answer,
        }
        if retrieved_context:
            payload["retrievedContext"] = retrieved_context
        return await self._post("/internal/ai/evaluate-answer", payload)

    async def generate_feedback(
        self,
        candidate: Dict[str, Any],
        candidate_context: Dict[str, Any],
        evaluations: List[Dict[str, Any]],
        coverage: Dict[int, float],
        missed_concepts: Dict[int, List[str]],
        topic_scores: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        payload = {
            "candidate": candidate,
            "candidateContext": candidate_context,
            "evaluations": evaluations,
            "coverage": {str(k): v for k, v in coverage.items()},
            "missedConcepts": {str(k): v for k, v in missed_concepts.items()},
            "topicScores": topic_scores,
        }
        return await self._post("/internal/ai/generate-feedback", payload)
