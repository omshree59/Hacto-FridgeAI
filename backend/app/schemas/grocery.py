from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class GroceryItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    category: str = Field(default="other", max_length=60)
    quantity: Optional[float] = None
    unit: Optional[str] = Field(default=None, max_length=30)
    notes: Optional[str] = Field(default=None, max_length=255)
    priority: Literal["low", "medium", "high"] = "medium"
    is_completed: bool = False
    source: Literal["manual", "low_stock", "recipe", "scan"] = "manual"


class GroceryItemCreate(GroceryItemBase):
    pass


class GroceryItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    category: Optional[str] = Field(default=None, max_length=60)
    quantity: Optional[float] = None
    unit: Optional[str] = Field(default=None, max_length=30)
    notes: Optional[str] = Field(default=None, max_length=255)
    priority: Optional[Literal["low", "medium", "high"]] = None
    is_completed: Optional[bool] = None


class GroceryItemResponse(GroceryItemBase):
    id: int
    normalized_name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GroceryListResponse(BaseModel):
    total: int
    completed_count: int
    pending_count: int
    items: List[GroceryItemResponse]


class GroceryGenerateRequest(BaseModel):
    include_low_stock: bool = True
    include_out_of_stock: bool = True
    recipe_missing_items: Optional[List[GroceryItemCreate]] = None
