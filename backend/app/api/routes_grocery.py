from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.grocery import (
    GroceryItemCreate,
    GroceryItemUpdate,
    GroceryItemResponse,
    GroceryListResponse,
    GroceryGenerateRequest,
)
from backend.app.services.grocery_service import GroceryService

router = APIRouter(prefix="/grocery-list", tags=["Grocery List"])


@router.get("", response_model=GroceryListResponse)
def get_grocery_list(
    category: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    items, completed_count, pending_count = GroceryService.get_items(
        db=db, category=category, completed=completed
    )
    return GroceryListResponse(
        total=len(items),
        completed_count=completed_count,
        pending_count=pending_count,
        items=items,
    )


@router.post("/items", response_model=GroceryItemResponse, status_code=status.HTTP_201_CREATED)
def add_grocery_item(
    item_in: GroceryItemCreate,
    db: Session = Depends(get_db)
):
    return GroceryService.add_item(db=db, item_in=item_in)


@router.patch("/items/{item_id}", response_model=GroceryItemResponse)
def update_grocery_item(
    item_id: int,
    update_in: GroceryItemUpdate,
    db: Session = Depends(get_db)
):
    updated = GroceryService.update_item(db=db, item_id=item_id, update_in=update_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Grocery item not found")
    return updated


@router.delete("/items/{item_id}")
def delete_grocery_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    success = GroceryService.delete_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Grocery item not found")
    return {"message": f"Grocery item #{item_id} deleted successfully."}


@router.delete("/completed")
def clear_completed_grocery_items(db: Session = Depends(get_db)):
    cleared = GroceryService.clear_completed(db)
    return {"message": f"Cleared {cleared} completed items."}


@router.post("/generate", response_model=List[GroceryItemResponse])
def generate_grocery_list(
    request: GroceryGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generates smart shopping items based on low-stock inventory
    and optional recipe requirements.
    """
    return GroceryService.generate_smart_list(db, request)


@router.get("/export")
def export_grocery_list(
    format: str = Query("csv", pattern="^(csv|text)$"),
    db: Session = Depends(get_db)
):
    if format == "csv":
        content = GroceryService.export_as_csv(db)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=fridgeflow-grocery-list.csv"}
        )
    else:
        content = GroceryService.export_as_text(db)
        return Response(
            content=content,
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=fridgeflow-grocery-list.txt"}
        )
