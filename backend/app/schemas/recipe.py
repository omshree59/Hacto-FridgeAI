from typing import List, Optional
from pydantic import BaseModel, Field


class RecipeIngredientInput(BaseModel):
    name: str = Field(..., min_length=1)
    quantity: Optional[float] = None
    unit: Optional[str] = None


class RecipeCompareRequest(BaseModel):
    recipe_name: str = Field(..., min_length=1)
    ingredients: List[RecipeIngredientInput]


class IngredientComparisonResult(BaseModel):
    name: str
    normalized_name: str
    required_quantity: Optional[float] = None
    required_unit: Optional[str] = None
    inventory_quantity: Optional[float] = None
    inventory_unit: Optional[str] = None
    status: str  # "in_stock", "low_stock", "missing", "unit_mismatch"
    matched_inventory_name: Optional[str] = None
    shortage_quantity: Optional[float] = None


class RecipeCompareResponse(BaseModel):
    recipe_name: str
    total_ingredients: int
    missing_count: int
    matched_count: int
    results: List[IngredientComparisonResult]
