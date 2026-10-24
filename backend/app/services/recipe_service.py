from typing import List
from sqlalchemy.orm import Session
from backend.app.models.all_models import InventoryItem
from backend.app.schemas.recipe import (
    RecipeCompareRequest,
    RecipeCompareResponse,
    IngredientComparisonResult,
)
from backend.app.utils.normalization import normalize_ingredient_name, normalize_unit


class RecipeService:
    @staticmethod
    def compare_recipe_with_inventory(
        db: Session,
        request: RecipeCompareRequest
    ) -> RecipeCompareResponse:
        results: List[IngredientComparisonResult] = []
        missing_count = 0
        matched_count = 0

        # Load current inventory items
        inventory_items = db.query(InventoryItem).all()
        # Map normalized_name to item
        inventory_map = {item.normalized_name: item for item in inventory_items}

        for req_item in request.ingredients:
            norm_name = normalize_ingredient_name(req_item.name)
            req_unit = normalize_unit(req_item.unit)

            matched_inv = inventory_map.get(norm_name)

            if matched_inv:
                matched_count += 1
                inv_qty = matched_inv.quantity
                inv_unit = matched_inv.unit

                # Check quantity and units
                if req_item.quantity is not None and inv_qty is not None:
                    if req_unit == inv_unit or (req_unit is None and inv_unit is None):
                        if inv_qty >= req_item.quantity:
                            status_str = "in_stock"
                            shortage = 0.0
                        else:
                            status_str = "low_stock"
                            shortage = round(req_item.quantity - inv_qty, 2)
                    else:
                        status_str = "unit_mismatch"
                        shortage = None
                else:
                    # Quantity not specified or unknown
                    status_str = "in_stock"
                    shortage = None

                results.append(
                    IngredientComparisonResult(
                        name=req_item.name,
                        normalized_name=norm_name,
                        required_quantity=req_item.quantity,
                        required_unit=req_unit,
                        inventory_quantity=inv_qty,
                        inventory_unit=inv_unit,
                        status=status_str,
                        matched_inventory_name=matched_inv.name,
                        shortage_quantity=shortage,
                    )
                )
            else:
                missing_count += 1
                results.append(
                    IngredientComparisonResult(
                        name=req_item.name,
                        normalized_name=norm_name,
                        required_quantity=req_item.quantity,
                        required_unit=req_unit,
                        inventory_quantity=None,
                        inventory_unit=None,
                        status="missing",
                        matched_inventory_name=None,
                        shortage_quantity=req_item.quantity,
                    )
                )

        return RecipeCompareResponse(
            recipe_name=request.recipe_name,
            total_ingredients=len(request.ingredients),
            missing_count=missing_count,
            matched_count=matched_count,
            results=results,
        )
