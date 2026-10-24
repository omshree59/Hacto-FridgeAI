from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.recipe import RecipeCompareRequest, RecipeCompareResponse
from backend.app.services.recipe_service import RecipeService

router = APIRouter(prefix="/recipes", tags=["Recipes"])


@router.post("/compare", response_model=RecipeCompareResponse)
def compare_recipe_ingredients(
    request: RecipeCompareRequest,
    db: Session = Depends(get_db)
):
    """
    Compares planned meal ingredients against currently confirmed inventory.
    Reports which items are in stock, low stock, or completely missing.
    """
    return RecipeService.compare_recipe_with_inventory(db, request)
