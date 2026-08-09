"""
Purpose:
Provides a deterministic FakeLLMProvider used when LLM_PROVIDER=fake.

Responsibilities:
- Implements the ChatProvider protocol without any network calls.
- Returns a deterministic placeholder completion (real generators bypass the
  provider entirely in fake mode and produce contract-valid outputs directly).
- When ``json_mode=True``, returns schema-complete JSON that always validates
  against the Pydantic output contract implied by the prompt's system message
  (GeneratedQuestion for question/follow-up, EvaluationOutput, FeedbackOutput).
  It derives the real curriculum day, difficulty, topic, and candidate context
  from the prompt payload instead of a ``{"fake": True}`` stub, so the
  failover chain's last-resort output is never schema-invalid.
- Produces stable, hash-based embeddings so RAG code paths stay consistent.

Connected Files:
- app/llm/factory.py
- app/llm/groq_provider.py (fake fallback of the failover chain)
- app/services/question_generator.py
- app/services/evaluator.py
- app/services/feedback_generator.py
- app/rag/retriever.py
"""

import hashlib
import json
from typing import Any, Dict, List, Optional

from app.schemas.ai_output import EvaluationOutput, FeedbackOutput
from app.schemas.question import GeneratedQuestion


def _last_user_content(messages: List[Dict[str, Any]]) -> str:
    for message in reversed(messages):
        if message.get("role") == "user":
            return message.get("content", "")
    return ""


def _section_body(user_content: str, label: str) -> Optional[str]:
    """Return the raw text of a ``LABEL:\n...`` section in a builder prompt.

    Builder prompts join sections with a blank line, so a section is the text
    between its ``LABEL:\\n`` marker and the next ``\\n\\n`` boundary.
    """
    start_marker = f"{label}:\n"
    start = user_content.find(start_marker)
    if start < 0:
        return None
    body = user_content[start + len(start_marker):]
    end = body.find("\n\n")
    if end < 0:
        end = len(body)
    return body[:end].strip() or None


def _section_value(user_content: str, label: str, default: Any = None) -> Any:
    """Parse a ``LABEL:\n...`` section as JSON (dict or list), else default."""
    body = _section_body(user_content, label)
    if not body:
        return default
    try:
        return json.loads(body)
    except (ValueError, TypeError):
        return default


def _infer_kind(messages: List[Dict[str, Any]]) -> str:
    """Infer which output contract the prompt asks for: question/eval/feedback."""
    user_content = _last_user_content(messages)
    system_content = ""
    for message in messages:
        if message.get("role") == "system":
            system_content = message.get("content", "")
            break

    if "EVALUATIONS HISTORY:" in user_content:
        return "feedback"
    if "CANDIDATE ANSWER:" in user_content:
        return "evaluation"
    if (
        "QUESTION STRATEGY TO EXECUTE:" in user_content
        or "FOLLOW-UP STRATEGY TO EXECUTE:" in user_content
    ):
        return "question"

    low = system_content.lower()
    if "feedback" in low:
        return "feedback"
    if "technical evaluator" in low or "grading rubric" in low:
        return "evaluation"
    return "question"


def _fake_question_payload(user_content: str) -> GeneratedQuestion:
    """Schema-complete question/follow-up using the strategy in the prompt."""
    strategy = _section_value(user_content, "QUESTION STRATEGY TO EXECUTE", {}) or {}
    followup = _section_value(user_content, "FOLLOW-UP STRATEGY TO EXECUTE", {}) or {}
    candidate = _section_value(user_content, "CANDIDATE CONTEXT", {}) or {}

    if "FOLLOW-UP STRATEGY TO EXECUTE:" in user_content or followup:
        day = followup.get("day", 0) or 0
        difficulty = followup.get("difficulty") or "medium"
        weak = list(followup.get("weakConcepts") or ["the reasoning behind your answer"])
        topic = ((followup.get("questionStrategy") or {}).get("topic")) or (
            "the topic you were just discussing"
        )
        previous = str(followup.get("previousAnswer") or "").strip()
        if not previous:
            previous = "[candidate did not provide an answer]"
        elif len(previous) > 200:
            previous = previous[:200] + "..."
        question = (
            f"Let's go deeper on {', '.join(weak)}. You said: \"{previous}\". "
            "Can you walk through the specific trade-offs and show how you would "
            "apply this in a real system?"
        )
        return GeneratedQuestion(
            question=question,
            type="follow-up",
            difficulty=difficulty,
            topic=topic,
            day=day,
            expectedConcepts=weak,
        )

    topic = strategy.get("topic") or "technical concepts"
    difficulty = strategy.get("difficulty") or "medium"
    day = strategy.get("day") or 0
    concepts = list(strategy.get("concepts") or [])
    role = candidate.get("role") or "the candidate"
    concept_list = ", ".join(concepts) if concepts else "the core ideas behind this topic"
    question = (
        f"As a {role}, explain {topic}. Cover {concept_list}, and describe how "
        "these ideas connect to building real systems."
    )
    return GeneratedQuestion(
        question=question,
        type="technical",
        difficulty=difficulty,
        topic=topic,
        day=day,
        expectedConcepts=concepts,
    )


def _fake_evaluation_payload(user_content: str) -> EvaluationOutput:
    """Schema-complete evaluation derived from the answer + expected concepts."""
    answer = _section_body(user_content, "CANDIDATE ANSWER") or ""
    question = _section_value(user_content, "QUESTION ASKED", {}) or {}
    expected = list(question.get("expectedConcepts") or [])
    answer_lower = answer.lower()
    words = answer.split()

    if not expected:
        coverage = min(1.0, len(words) / 60)
    else:
        matched = [c for c in expected if c.lower() in answer_lower]
        coverage = len(matched) / len(expected)

    depth = min(1.0, len(words) / 90)
    technical_accuracy = min(1.0, coverage + 0.2)
    score = round(10 * (0.5 * coverage + 0.3 * depth + 0.2 * min(1.0, len(words) / 40)), 1)
    score = min(10.0, max(0.0, score))

    matched_concepts = [c for c in expected if c.lower() in answer_lower]
    gaps = [c for c in expected if c.lower() not in answer_lower]
    strengths = [f"Covered concept: {c}" for c in matched_concepts[:3]] or (
        ["The answer is on topic and shows effort."] if words else []
    )
    gaps = gaps or ["Could go deeper on the technical details."]

    return EvaluationOutput(
        score=score,
        conceptCoverage=round(coverage, 2),
        technicalAccuracy=round(technical_accuracy, 2),
        depth=round(depth, 2),
        strengths=strengths,
        gaps=gaps,
        followUpRequired=score < 6.0,
        notes="Deterministic evaluation (all real LLM providers were exhausted).",
    )


def _fake_feedback_payload(user_content: str) -> FeedbackOutput:
    """Schema-complete feedback synthesized from the evaluations in the prompt."""
    candidate = _section_value(user_content, "CANDIDATE PROFILE", {}) or {}
    evaluations = _section_value(user_content, "EVALUATIONS HISTORY", []) or []
    if not isinstance(evaluations, list):
        evaluations = []

    member = candidate.get("member") or {}
    name = member.get("name") or candidate.get("name") or "the candidate"
    scores = [
        float(e.get("score", 0.0))
        for e in evaluations
        if isinstance(e, dict) and e.get("score") is not None
    ]
    avg = sum(scores) / len(scores) if scores else 0.0
    total = len(evaluations)

    strengths: List[str] = []
    gaps: List[str] = []
    for e in evaluations:
        if not isinstance(e, dict):
            continue
        strengths.extend(e.get("strengths") or [])
        gaps.extend(e.get("gaps") or [])

    def dedupe(items: List[str]) -> List[str]:
        seen = set()
        out = []
        for item in items:
            key = str(item).strip().lower()
            if key and key not in seen:
                seen.add(key)
                out.append(str(item).strip())
        return out

    if avg >= 7.5:
        summary = (
            f"{name} performed well, averaging {avg:.1f}/10 across {total} questions. "
            "Coverage is strong; the next focus is deepening the flagged edge cases."
        )
    elif avg >= 5.0:
        summary = (
            f"{name} demonstrated a developing understanding, averaging {avg:.1f}/10 "
            f"across {total} questions. Core concepts are present but need more depth."
        )
    else:
        summary = (
            f"{name} is still building fundamentals, averaging {avg:.1f}/10 across "
            f"{total} questions. Several core concepts need review before moving on."
        )

    return FeedbackOutput(
        summary=summary,
        strengths=dedupe(strengths)[:3],
        gaps=dedupe(gaps)[:3],
        next=[
            "Review the flagged gaps and work through targeted practice questions.",
            "Re-attempt the curriculum days that showed lower coverage.",
            "Focus on explaining concepts aloud to build technical articulation.",
        ],
    )


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
        path is only hit by direct provider consumers and by the failover
        chain's last-resort fallback.

        When ``json_mode`` is requested the output is always schema-complete
        JSON for the contract implied by the prompt (GeneratedQuestion,
        EvaluationOutput, or FeedbackOutput), so upstream Pydantic validation
        cannot fail - even when every real provider is exhausted.
        """
        last_user = _last_user_content(messages)
        preview = last_user.strip().splitlines()
        snippet = preview[0][:80] if preview else "no prompt"

        if json_mode:
            return self._fake_structured(messages)

        return f"[fake-completion] based on: {snippet}"

    def _fake_structured(self, messages: List[Dict[str, Any]]) -> str:
        """Deterministic, schema-complete JSON payload for the inferred contract.

        The absolute last resort is the contract's own deterministic
        ``fallback()``, which is guaranteed to validate, so this method cannot
        itself fail.
        """
        kind = _infer_kind(messages)
        user_content = _last_user_content(messages)
        try:
            if kind == "evaluation":
                return _fake_evaluation_payload(user_content).model_dump_json()
            if kind == "feedback":
                return _fake_feedback_payload(user_content).model_dump_json()
            return _fake_question_payload(user_content).model_dump_json()
        except Exception:
            if kind == "evaluation":
                return EvaluationOutput.fallback().model_dump_json()
            if kind == "feedback":
                return FeedbackOutput.fallback().model_dump_json()
            return GeneratedQuestion.fallback().model_dump_json()

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
