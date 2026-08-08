"""Shared fakes for interview-agent contract tests."""

from typing import Any, Dict, List


class FakeAIClient:
    """Deterministic stand-in for AIIntelligenceClient (no network)."""

    def __init__(self, scores: List[float] | None = None) -> None:
        self.scores = scores or [5.0] * 50
        self.evaluate_count = 0
        self.question_count = 0
        self.followup_count = 0
        self.feedback_count = 0

    def _question_response(self) -> Dict[str, Any]:
        self.question_count += 1
        return {
            "question": f"[FAKE-Q{self.question_count}] Explain the topic in your own words.",
            "type": "technical",
            "difficulty": "easy",
            "topic": "Topic",
            "day": 1,
            "expectedConcepts": ["concept-a", "concept-b"],
        }

    async def generate_question(self, **kwargs: Any) -> Dict[str, Any]:
        return self._question_response()

    async def generate_followup(self, **kwargs: Any) -> Dict[str, Any]:
        self.followup_count += 1
        return {
            "question": f"[FAKE-F{self.followup_count}] Drill down on the weak concept.",
            "type": "follow-up",
            "difficulty": "easy",
            "topic": "Topic",
            "day": 1,
            "expectedConcepts": ["concept-a"],
        }

    async def evaluate_answer(
        self,
        question: Dict[str, Any] | None = None,
        candidate_context: Dict[str, Any] | None = None,
        candidate_answer: str | None = None,
        retrieved_context: List[Dict[str, Any]] | None = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        score = self.scores[self.evaluate_count % len(self.scores)]
        self.evaluate_count += 1
        return {
            "score": score,
            "conceptCoverage": min(score / 10.0, 1.0),
            "technicalAccuracy": min(score / 10.0, 1.0),
            "depth": min(score / 10.0, 1.0),
            "strengths": [] if score >= 6.0 else [],
            "gaps": ["gap-x"] if score < 6.0 else [],
            "followUpRequired": score < 6.0,
        }

    async def generate_feedback(self, **kwargs: Any) -> Dict[str, Any]:
        self.feedback_count += 1
        return {
            "summary": "You performed well overall.",
            "strengths": ["Good communication"],
            "gaps": ["Deeper technical depth"],
            "next": ["Review Day 1"],
        }
