from backend.app.services.inventory_service import (
    InventoryService,
    compute_stock_status,
)
from backend.app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryReconcileItem,
)
from backend.app.models.all_models import InventoryItem


def test_inventory_creation_and_stock_status(test_db):
    # In stock item
    item_in = InventoryItemCreate(
        name="Fresh Eggs",
        category="eggs",
        quantity=12.0,
        unit="pcs",
        low_stock_threshold=3.0,
    )
    res = InventoryService.create_item(test_db, item_in)
    assert res.id is not None
    assert res.normalized_name == "fresh egg"
    assert res.stock_status == "in_stock"
    assert res.is_low_stock is False
    assert res.is_out_of_stock is False


def test_low_stock_and_out_of_stock_rules(test_db):
    # Low stock item
    low_item = InventoryItemCreate(
        name="Whole Milk",
        category="dairy",
        quantity=1.0,
        unit="L",
        low_stock_threshold=2.0,
    )
    res_low = InventoryService.create_item(test_db, low_item)
    assert res_low.stock_status == "low_stock"
    assert res_low.is_low_stock is True
    assert res_low.is_out_of_stock is False

    # Out of stock item
    out_item = InventoryItemCreate(
        name="Butter",
        category="dairy",
        quantity=0.0,
        unit="pack",
        low_stock_threshold=1.0,
    )
    res_out = InventoryService.create_item(test_db, out_item)
    assert res_out.stock_status == "out_of_stock"
    assert res_out.is_out_of_stock is True

    # Unknown quantity item
    unk_item = InventoryItemCreate(
        name="Leftover Pasta",
        category="other",
        quantity=None,
        quantity_known=False,
    )
    res_unk = InventoryService.create_item(test_db, unk_item)
    assert res_unk.stock_status == "unknown"


def test_reconciliation_proposal_and_execution(test_db):
    # Existing item in inventory
    InventoryService.create_item(
        test_db,
        InventoryItemCreate(
            name="Apple",
            category="fruits",
            quantity=3.0,
            unit="pcs",
        )
    )

    # Scanned detections: 1 matching existing apple, 1 new banana
    detections = [
        {"id": 1, "candidate_name": "Apples", "category": "fruits", "quantity_estimate": 5.0, "unit": "pcs"},
        {"id": 2, "candidate_name": "Bananas", "category": "fruits", "quantity_estimate": 4.0, "unit": "pcs"},
    ]

    proposal = InventoryService.propose_reconciliation(test_db, detections)
    assert len(proposal.items) == 2

    # First proposal should match existing apple and suggest update
    assert proposal.items[0].action == "update_quantity"
    assert proposal.items[0].existing_item_id is not None
    assert proposal.items[0].existing_quantity == 3.0

    # Second proposal should suggest create_new
    assert proposal.items[1].action == "create_new"
    assert proposal.items[1].existing_item_id is None

    # Execute reconciliation
    reconciled = InventoryService.execute_reconciliation(test_db, proposal.items)
    assert len(reconciled) == 2

    # Check database: total 2 items now (Apple updated to 5, Banana created with 4)
    items, total = InventoryService.get_items(test_db)
    assert total == 2
    apple_item = next(i for i in items if i.normalized_name == "apple")
    assert apple_item.quantity == 5.0
