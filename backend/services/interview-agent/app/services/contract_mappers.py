"""
Purpose:
Maps interview-agent domain models into the ai-intelligence API payloads.

Responsibilities:
- Converts the internal snake_case domain models into the camelCase shapes
  defined in backend/shared/schemas/ai_api.json.
- Builds the ai candidateContext, curriculumContext, questionStrategy, and
  followUpStrategy payloads used by the AIIntelligenceClient.

Connected Files:
- app/schemas/domain.py
- app/services/curriculum_loader.py
"""

from typing import Any, Dict, List

from app.schemas.domain import CandidateContext, FollowUpStrategy, QuestionStrategy
from app.services.curriculum_loader import CurriculumLoader


def candidate_context_to_ai(cc: CandidateContext) -> Dict[str, Any]:
    """Serializes a domain CandidateContext into the ai candidateContext payload."""
    return {
        "candidateId": cc.member_id,
        "name": cc.name,
        "role": cc.job_role,
        "tier": cc.tier.value,
        "strongDays": list(cc.strong_days),
        "weakDays": list(cc.weak_days),
        "failedDays": list(cc.failed_days),
        "skippedDays": list(cc.skipped_days),
    }


def build_curriculum_context(loader: CurriculumLoader, planned_days: List[int]) -> Dict[str, Any]:
    """Builds the ai curriculumContext payload from the loaded curriculum schema."""
    modules = [
        {"n": m.n, "title": m.title, "days": list(m.days)}
        for m in loader.data.modules
    ]
    days_map: Dict[str, Dict[str, Any]] = {}
    for d in loader.data.days:
        days_map[str(d.day)] = {
            "day": d.day,
            "title": d.title,
            "type": d.type,
            "tools": list(d.tools),
            "objectives": list(d.objectives),
        }
    return {
        "modules": modules,
        "days": days_map,
        "plannedDays": list(planned_days),
    }


def question_strategy_to_ai(strategy: QuestionStrategy) -> Dict[str, Any]:
    """Serializes a domain QuestionStrategy into the ai questionStrategy payload."""
    return {
        "day": strategy.day,
        "module": strategy.module,
        "topic": strategy.topic,
        "difficulty": strategy.difficulty.value,
        "concepts": list(strategy.concepts),
        "isFollowUp": strategy.is_follow_up,
        "followUpOf": strategy.follow_up_of,
    }


def followup_strategy_to_ai(
    strategy: FollowUpStrategy,
    topic: str,
    concepts: List[str],
) -> Dict[str, Any]:
    """Serializes a domain FollowUpStrategy into the ai followUpStrategy payload."""
    return {
        "day": strategy.day,
        "difficulty": strategy.difficulty.value,
        "previousAnswer": strategy.previous_answer,
        "weakConcepts": list(strategy.concepts_to_probe),
        "questionStrategy": {
            "day": strategy.day,
            "module": strategy.module,
            "topic": topic,
            "difficulty": strategy.difficulty.value,
            "concepts": list(concepts),
            "isFollowUp": True,
            "followUpOf": strategy.follow_up_of,
        },
    }


def conversation_to_ai(conversation) -> List[Dict[str, str]]:
    """Converts orchestration ConversationItem objects into raw role/content dicts."""
    return [{"role": item.role, "content": item.content} for item in conversation]
