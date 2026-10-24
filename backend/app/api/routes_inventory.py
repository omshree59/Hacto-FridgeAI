from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    InventoryListResponse,
    ReconcileProposal,
    ReconcileExecuteRequest,
)
from backend.app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("", response_model=InventoryListResponse)
def list_inventory(
    search: Optional[str] = Query(None, description="Search by ingredient name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock_only: bool = Query(False, description="Filter low-stock/out-of-stock items only"),
    sort_by: str = Query("name", pattern="^(name|date|category)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    items, total = InventoryService.get_items(
        db=db,
        search=search,
        category=category,
        low_stock_only=low_stock_only,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit,
    )
    return InventoryListResponse(total=total, items=items)


@router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item_in: InventoryItemCreate,
    db: Session = Depends(get_db)
):
    return InventoryService.create_item(db=db, item_in=item_in)


@router.patch("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: int,
    update_in: InventoryItemUpdate,
    db: Session = Depends(get_db)
):
    item = InventoryService.get_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return InventoryService.update_item(db=db, item=item, update_in=update_in)


@router.delete("/{item_id}")
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    success = InventoryService.delete_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"message": f"Item #{item_id} deleted successfully."}


@router.post("/reconcile/proposal", response_model=ReconcileProposal)
def propose_inventory_reconciliation(
    detections: list[dict],
    db: Session = Depends(get_db)
):
    """
    Accepts candidate detections and returns a reconciliation proposal
    comparing with existing inventory, without modifying the database.
    """
    return InventoryService.propose_reconciliation(db, detections)


@router.post("/reconcile/execute")
def execute_inventory_reconciliation(
    request: ReconcileExecuteRequest,
    source_scan_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Commits confirmed user actions (create, update, merge) into inventory.
    """
    updated_items = InventoryService.execute_reconciliation(
        db, request.proposals, source_scan_id=source_scan_id
    )
    return {
        "message": f"Successfully reconciled {len(updated_items)} items.",
        "items": updated_items
    }
