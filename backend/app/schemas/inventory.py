from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class InventoryItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    category: str = Field(default="other", max_length=60)
    quantity: Optional[float] = None
    unit: Optional[str] = Field(default=None, max_length=30)
    quantity_known: bool = True
    low_stock_threshold: float = Field(default=1.0, ge=0.0)
    preferred_restock_quantity: Optional[float] = Field(default=None, ge=0.0)
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None


class InventoryItemCreate(InventoryItemBase):
    source_scan_id: Optional[int] = None


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    category: Optional[str] = Field(default=None, max_length=60)
    quantity: Optional[float] = None
    unit: Optional[str] = Field(default=None, max_length=30)
    quantity_known: Optional[bool] = None
    low_stock_threshold: Optional[float] = Field(default=None, ge=0.0)
    preferred_restock_quantity: Optional[float] = Field(default=None, ge=0.0)
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None


class InventoryItemResponse(InventoryItemBase):
    id: int
    normalized_name: str
    source_scan_id: Optional[int] = None
    is_low_stock: bool
    is_out_of_stock: bool
    stock_status: str  # "in_stock", "low_stock", "out_of_stock", "unknown"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InventoryListResponse(BaseModel):
    total: int
    items: List[InventoryItemResponse]


class InventoryReconcileItem(BaseModel):
    scan_detection_id: Optional[int] = None
    candidate_name: str
    category: str = "other"
    detected_quantity: Optional[float] = None
    detected_unit: Optional[str] = None
    existing_item_id: Optional[int] = None
    existing_quantity: Optional[float] = None
    action: str  # "create_new", "update_quantity", "ignore", "merge"
    confirmed_quantity: Optional[float] = None
    confirmed_unit: Optional[str] = None


class ReconcileProposal(BaseModel):
    items: List[InventoryReconcileItem]


class ReconcileExecuteRequest(BaseModel):
    proposals: List[InventoryReconcileItem]
