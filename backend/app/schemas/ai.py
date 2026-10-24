from typing import List, Optional, Literal
from pydantic import BaseModel, Field


VALID_CATEGORIES = [
    "vegetables",
    "fruits",
    "dairy",
    "meat and seafood",
    "eggs",
    "beverages",
    "grains and bread",
    "frozen food",
    "condiments",
    "snacks",
    "other",
]


class AIDetectedItem(BaseModel):
    name: str = Field(..., description="Normalized ingredient or food item name, e.g. 'tomato'")
    category: str = Field(default="other", description="Food category")
    quantity_estimate: Optional[float] = Field(default=None, description="Numeric estimate or null if unknown")
    unit: Optional[str] = Field(default=None, description="Unit e.g. pieces, liters, carton, or null")
    confidence_level: Literal["high", "medium", "low"] = Field(
        default="medium",
        description="Confidence estimation level"
    )
    visible_attributes: List[str] = Field(
        default_factory=list,
        description="Visible physical attributes observed, e.g. ['red', 'in plastic bag']"
    )
    needs_review: bool = Field(
        default=False,
        description="Whether this item requires user verification due to uncertainty or partial visibility"
    )


class AIScanResult(BaseModel):
    scan_type: str = Field(default="fridge", description="Type of scan analyzed")
    items: List[AIDetectedItem] = Field(default_factory=list)
    uncertain_observations: List[str] = Field(
        default_factory=list,
        description="Observations that could not be reliably classified as distinct groceries"
    )
