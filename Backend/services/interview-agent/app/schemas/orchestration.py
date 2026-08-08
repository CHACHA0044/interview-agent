"""
Purpose:
Defines the strict Request and Response payloads for the stateless Interview Agent.

Responsibilities:
- Formalizes the input boundary from the HTTP Gateway.
- Formalizes the output boundary to the HTTP Gateway.
- Uses Pydantic for rigorous runtime validation.

Connected Files:
- app/schemas/state.py
- app/schemas/domain.py
"""

from typing import Optional, Union
from pydantic import BaseModel, ConfigDict

from app.schemas.state import AgentState
from app.schemas.domain import (
    CandidateContext, 
    EvaluationResult, 
    QuestionStrategy, 
    FollowUpStrategy
)


class StartInterviewRequest(BaseModel):
    """The payload sent by the Gateway to initialize a new interview session."""
    model_config = ConfigDict(extra="forbid")
    
    session_id: str
    candidate_profile: dict  # The raw JSON profile from the frontend


class NextTurnRequest(BaseModel):
    """The payload sent by the Gateway when a candidate submits an answer."""
    model_config = ConfigDict(extra="forbid")
    
    agent_state: AgentState
    evaluation_result: EvaluationResult
    candidate_profile: dict


class OrchestratorResponse(BaseModel):
    """
    The deterministic output of the Interview Agent.
    
    action_type:
      - QUESTION: Generate a new question from the payload.
      - FOLLOW_UP: Generate a follow-up from the payload.
      - FINISH: Interview is complete.
      
    payload: The corresponding Strategy to send to AI Intelligence, or None if FINISH.
    """
    model_config = ConfigDict(extra="forbid")
    
    updated_state: AgentState
    action_type: str # "QUESTION", "FOLLOW_UP", "FINISH"
    payload: Optional[Union[QuestionStrategy, FollowUpStrategy]] = None


class CompleteRequest(BaseModel):
    """The payload sent by the Gateway to attempt interview completion."""
    model_config = ConfigDict(extra="forbid")
    
    agent_state: AgentState


class FollowUpRequest(BaseModel):
    """The payload sent by the Gateway to force/process a manual follow-up."""
    model_config = ConfigDict(extra="forbid")
    
    agent_state: AgentState
    evaluation_result: EvaluationResult
