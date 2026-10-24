from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from backend.app.schemas.ai import AIDetectedItem


class ScanDetectionResponse(BaseModel):
    id: int
    candidate_name: str
    category: str
    quantity_estimate: Optional[float] = None
    unit: Optional[str] = None
    confidence_level: str
    visible_attributes: List[str] = Field(default_factory=list)
    needs_review: bool
    user_confirmed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ScanDetectionUpdate(BaseModel):
    id: int
    candidate_name: Optional[str] = None
    category: Optional[str] = None
    quantity_estimate: Optional[float] = None
    unit: Optional[str] = None
    user_confirmed: bool = True
    deleted: bool = False


class ScanRecordResponse(BaseModel):
    id: int
    scan_type: str
    model_name: str
    status: str
    image_reference: Optional[str] = None
    notes: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    detections: List[ScanDetectionResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ScanConfirmRequest(BaseModel):
    scan_id: int
    items: List[ScanDetectionUpdate]
