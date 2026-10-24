from backend.app.services.inventory_service import InventoryService
from backend.app.services.grocery_service import GroceryService
from backend.app.services.recipe_service import RecipeService
from backend.app.schemas.inventory import InventoryItemCreate
from backend.app.schemas.grocery import GroceryItemCreate, GroceryGenerateRequest
from backend.app.schemas.recipe import RecipeCompareRequest, RecipeIngredientInput


def test_grocery_list_and_smart_generation(test_db):
    # Add a low stock item to inventory
    InventoryService.create_item(
        test_db,
        InventoryItemCreate(
            name="Milk",
            category="dairy",
            quantity=0.5,
            unit="L",
            low_stock_threshold=2.0,
            preferred_restock_quantity=2.0,
        )
    )

    # Generate grocery items from low stock
    req = GroceryGenerateRequest(include_low_stock=True, include_out_of_stock=True)
    generated = GroceryService.generate_smart_list(test_db, req)
    assert len(generated) == 1
    assert generated[0].name == "Milk"
    assert generated[0].quantity == 2.0
    assert generated[0].source == "low_stock"

    # Add manual grocery item
    manual_item = GroceryItemCreate(
        name="Olive Oil",
        category="pantry",
        quantity=1.0,
        unit="bottle",
        priority="high"
    )
    res_m = GroceryService.add_item(test_db, manual_item)
    assert res_m.id is not None

    # Get grocery list
    items, completed_cnt, pending_cnt = GroceryService.get_items(test_db)
    assert len(items) == 2
    assert pending_cnt == 2
    assert completed_cnt == 0

    # Mark item completed
    GroceryService.update_item(test_db, res_m.id, GroceryItemCreate(name="Olive Oil", is_completed=True))
    _, completed_cnt, pending_cnt = GroceryService.get_items(test_db)
    assert completed_cnt == 1
    assert pending_cnt == 1

    # Clear completed
    cleared = GroceryService.clear_completed(test_db)
    assert cleared == 1
    items_after, _, _ = GroceryService.get_items(test_db)
    assert len(items_after) == 1


def test_recipe_ingredient_comparison(test_db):
    # Add items to inventory: Tomato (4 pcs) and Onion (1 pcs)
    InventoryService.create_item(
        test_db,
        InventoryItemCreate(name="Tomatoes", category="vegetables", quantity=4.0, unit="pcs")
    )
    InventoryService.create_item(
        test_db,
        InventoryItemCreate(name="Onion", category="vegetables", quantity=1.0, unit="pcs")
    )

    # Recipe needs:
    # 2 pcs tomatoes (we have 4 -> in_stock)
    # 2 pcs onions (we have 1 -> low_stock, shortage 1)
    # 500 g chicken breast (we have 0 -> missing)
    recipe_req = RecipeCompareRequest(
        recipe_name="Chicken Curry",
        ingredients=[
            RecipeIngredientInput(name="Tomato", quantity=2.0, unit="pcs"),
            RecipeIngredientInput(name="Onion", quantity=2.0, unit="pcs"),
            RecipeIngredientInput(name="Chicken Breast", quantity=500.0, unit="g"),
        ]
    )

    res = RecipeService.compare_recipe_with_inventory(test_db, recipe_req)
    assert res.total_ingredients == 3
    assert res.matched_count == 2
    assert res.missing_count == 1

    tomato_res = next(r for r in res.results if r.name == "Tomato")
    assert tomato_res.status == "in_stock"

    onion_res = next(r for r in res.results if r.name == "Onion")
    assert onion_res.status == "low_stock"
    assert onion_res.shortage_quantity == 1.0

    chicken_res = next(r for r in res.results if r.name == "Chicken Breast")
    assert chicken_res.status == "missing"
