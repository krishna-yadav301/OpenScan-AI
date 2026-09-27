from typing import Any, Dict, List, Optional
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


class ConditionScore(BaseModel):
    condition: str
    confidence: float = Field(ge=0, le=1)


class ExplainResponse(BaseModel):
    organ: str
    modality: str
    task: str
    detected_conditions: List[ConditionScore]
    confidence_scores: Dict[str, float]
    processing_time_ms: float
    decision_threshold: float
    heatmap_base64: str
    model_version: str
    disclaimer: str
    initial_summary: Optional[str] = None


class ChatMessageSchema(BaseModel):
    sender: str
    content: str
    created_at: Optional[str] = None


class ImageContextSchema(BaseModel):
    task: Optional[str] = "thoracic"
    organ: Optional[str] = "lung"
    modality: Optional[str] = "xray"
    detected_conditions: Optional[List[Dict[str, Any]]] = []
    confidence_scores: Optional[Dict[str, float]] = {}
    decision_threshold: Optional[float] = 0.5


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    query: str
    image_context: ImageContextSchema
    history: Optional[List[ChatMessageSchema]] = []


class ChatResponse(BaseModel):
    session_id: Optional[str] = None
    response: str
    disclaimer: str = "Research and education only. This output is not a medical diagnosis and must not guide patient care."
