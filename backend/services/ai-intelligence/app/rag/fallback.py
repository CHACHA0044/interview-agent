"""
Purpose:
Provides an in-memory curriculum fallback for retrieval when Qdrant is unavailable.

Responsibilities:
- Loads curriculum.json once (thread-safe) using the shared curriculum schema.
- Matches chunks by explicit filters (day/module) or by keyword overlap.
- Returns contract-shaped RetrievedChunk objects (backend.md §16.2 fallback).

Connected Files:
- app/rag/retriever.py
- app/schemas/curriculum.py
- app/schemas/contract.py
"""

import logging
import threading
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.schemas.contract import RetrievedChunk
from app.schemas.curriculum import CurriculumData

logger = logging.getLogger(__name__)

_load_lock = threading.Lock()
_curriculum_cache: Optional[CurriculumData] = None


def _curriculum_data() -> Optional[CurriculumData]:
    """Loads (and caches) the curriculum.json file for fallback lookups."""
    global _curriculum_cache
    if _curriculum_cache is not None:
        return _curriculum_cache

    if not settings.curriculum_path:
        logger.warning("CURRICULUM_PATH not configured; in-memory retrieval fallback unavailable.")
        return None

    with _load_lock:
        if _curriculum_cache is not None:
            return _curriculum_cache
        try:
            import json
            from pathlib import Path

            path = Path(settings.curriculum_path)
            if not path.exists():
                logger.error("Curriculum fallback file not found: %s", path)
                return None
            with open(path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            _curriculum_cache = CurriculumData(**data)
            logger.info("Loaded %d curriculum days for fallback retrieval.", len(_curriculum_cache.days))
        except Exception as e:  # pragma: no cover - defensive
            logger.error("Failed to load curriculum fallback data: %s", e)
            _curriculum_cache = None
    return _curriculum_cache


def _day_to_chunk(day: Any) -> RetrievedChunk:
    """Converts a CurriculumDay into a contract-shaped RetrievedChunk."""
    return RetrievedChunk(
        day=day.day,
        title=day.title,
        objectives=list(day.objectives),
        tools=list(day.tools),
        score=None,
    )


def fallback_retrieve(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    top_k: Optional[int] = None,
    curriculum: Optional[CurriculumData] = None,
) -> List[RetrievedChunk]:
    """
    Performs a deterministic in-memory retrieval against curriculum.json.

    Priority:
    1. Explicit day filter -> that day.
    2. Explicit module filter -> days belonging to that module.
    3. Keyword overlap between the query and day titles/objectives.
    """
    data = curriculum or _curriculum_data()
    if data is None:
        logger.warning("Fallback retrieval called but no curriculum data is available.")
        return []

    top_k = top_k or settings.rag_top_k

    # 1. Explicit day filter
    day_filter = filters.get("day") if filters else None
    if day_filter is not None:
        for day in data.days:
            if day.day == int(day_filter):
                return [_day_to_chunk(day)]

    # 2. Explicit module filter
    module_filter = filters.get("module") if filters else None
    if module_filter is not None:
        module_days = set()
        for mod in data.modules:
            if mod.n == int(module_filter):
                # Module `days` are [start, end] ranges; expand them to all member days.
                module_days = (
                    set(range(mod.days[0], mod.days[1] + 1))
                    if len(mod.days) == 2
                    else set(mod.days)
                )
                break
        if module_days:
            return [_day_to_chunk(day) for day in data.days if day.day in module_days][:top_k]

    # 3. Keyword overlap scoring
    tokens = [t.lower() for t in query.replace("-", " ").replace("/", " ").split() if len(t) > 2]

    scored: List[tuple] = []
    for day in data.days:
        corpus = (day.title + " " + " ".join(day.objectives)).lower()
        if not tokens:
            score = 1
        else:
            score = sum(corpus.count(tok) for tok in tokens)
        scored.append((score, day))

    scored.sort(key=lambda pair: (pair[0], pair[1].day), reverse=True)
    chunks = [_day_to_chunk(day) for score, day in scored if score > 0]
    if not chunks:
        # Degraded fallback: return the first day as the least-bad grounding.
        chunks = [_day_to_chunk(scored[0][1])] if scored else []
    return chunks[:top_k]
