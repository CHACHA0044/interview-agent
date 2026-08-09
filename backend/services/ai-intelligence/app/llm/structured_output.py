"""
Purpose:
Provides robust execution of LLM calls expecting JSON structures.

Responsibilities:
- Parses raw LLM text output into Pydantic models.
- Implements retry-on-parse-failure logic for transient LLM format errors.
- Dispatches a safe deterministic fallback upon complete failure.

Connected Files:
- app/llm/provider.py
- app/schemas/ai_output.py

Important implementation notes:
- Requires `json_mode=True` from the ChatProvider.
- Expects the provided `model_class` to have a `fallback()` classmethod.
"""

import json
import logging
from typing import Type, TypeVar, Dict, List, Any

from pydantic import BaseModel, ValidationError
from app.llm.provider import ChatProvider

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def generate_structured_output(
    provider: ChatProvider,
    messages: List[Dict[str, Any]],
    model_class: Type[T],
    max_retries: int = 2,
    temperature: float = 0.3
) -> T:
    """
    Generate structured output from the LLM, with automatic retries on validation failure.
    
    Args:
        provider: An instance of a ChatProvider (e.g., OpenAICompatibleProvider).
        messages: The conversation history/prompts.
        model_class: A Pydantic BaseModel class with a `fallback()` method.
        max_retries: The number of times to retry after a parsing failure.
        temperature: The temperature for the LLM request.
        
    Returns:
        An instance of the `model_class`. If all retries fail, returns `model_class.fallback()`.
    """
    if not hasattr(model_class, "fallback") or not callable(getattr(model_class, "fallback")):
        raise TypeError(f"The model {model_class.__name__} must implement a fallback() method.")

    attempts = 0
    last_exception: Exception | None = None
    
    while attempts <= max_retries:
        try:
            raw_response = provider.complete(
                messages=messages,
                json_mode=True,
                temperature=temperature
            )
            
            # Extract JSON from potential markdown blocks (e.g., ```json\n...\n```)
            json_text = raw_response
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0].strip()
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0].strip()
                
            parsed_data = json.loads(json_text)
            
            # Validate against Pydantic model
            return model_class.model_validate(parsed_data)
            
        except json.JSONDecodeError as e:
            logger.warning(f"[AI] structured_output_retry attempt={attempts + 1} model={model_class.__name__} reason=malformed_json error={e}")
            last_exception = e
            
        except ValidationError as e:
            logger.warning(f"[AI] structured_output_retry attempt={attempts + 1} model={model_class.__name__} reason=validation_error error={e}")
            last_exception = e
            
        except Exception as e:
            logger.error(f"[AI] structured_output_retry attempt={attempts + 1} model={model_class.__name__} reason=provider_error error={e}")
            last_exception = e
            # Do not retry immediately on network failure unless we want to implement backoff, 
            # but for this utility we just catch it. If it's a critical auth error, it will be caught here.
            
        attempts += 1
        
    logger.error(f"[AI] structured_output_failed model={model_class.__name__} max_retries={max_retries}. Returning fallback.")
    fallback_method = getattr(model_class, "fallback")
    return fallback_method()
