import csv
import io
import json
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.db.session import get_db, Base, engine
from backend.app.models.all_models import InventoryItem, GroceryListItem, ScanRecord, ScanDetection
from backend.app.services.image_service import ImageService
from backend.app.services.inventory_service import InventoryService

router = APIRouter(tags=["Settings & Export"])


class SettingsUpdateSchema(BaseModel):
    ollama_base_url: Optional[str] = None
    ollama_vision_model: Optional[str] = None
    ollama_text_model: Optional[str] = None
    ollama_timeout_seconds: Optional[float] = None
    auto_delete_images: Optional[bool] = None
    default_low_stock_threshold: Optional[float] = None


@router.get("/settings")
def get_system_settings():
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "ollama_vision_model": settings.OLLAMA_VISION_MODEL,
        "ollama_text_model": settings.OLLAMA_TEXT_MODEL,
        "ollama_timeout_seconds": settings.OLLAMA_TIMEOUT_SECONDS,
        "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB,
        "allowed_image_types": settings.ALLOWED_IMAGE_TYPES,
        "database_url": settings.DATABASE_URL,
        "data_directory": str(settings.DATA_DIR),
        "upload_directory": str(settings.UPLOAD_DIR),
        "auto_delete_images": settings.AUTO_DELETE_IMAGES_AFTER_ANALYSIS,
        "default_low_stock_threshold": settings.DEFAULT_LOW_STOCK_THRESHOLD,
    }


@router.patch("/settings")
def update_system_settings(update_data: SettingsUpdateSchema):
    if update_data.ollama_base_url is not None:
        settings.OLLAMA_BASE_URL = update_data.ollama_base_url.rstrip("/")
    if update_data.ollama_vision_model is not None:
        settings.OLLAMA_VISION_MODEL = update_data.ollama_vision_model.strip()
    if update_data.ollama_text_model is not None:
        settings.OLLAMA_TEXT_MODEL = update_data.ollama_text_model.strip()
    if update_data.ollama_timeout_seconds is not None:
        settings.OLLAMA_TIMEOUT_SECONDS = max(10.0, update_data.ollama_timeout_seconds)
    if update_data.auto_delete_images is not None:
        settings.AUTO_DELETE_IMAGES_AFTER_ANALYSIS = update_data.auto_delete_images
    if update_data.default_low_stock_threshold is not None:
        settings.DEFAULT_LOW_STOCK_THRESHOLD = update_data.default_low_stock_threshold

    return {
        "message": "Settings updated successfully.",
        "settings": get_system_settings()
    }


@router.post("/export/inventory")
def export_inventory(
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db)
):
    items, _ = InventoryService.get_items(db, limit=1000)
    
    if format == "json":
        data = [i.model_dump() for i in items]
        return Response(
            content=json.dumps(data, default=str, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=fridgeflow-inventory.json"}
        )
    else:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Name", "Category", "Quantity", "Unit", "Stock Status", "Threshold", "Purchase Date", "Expiry Date"])
        for item in items:
            writer.writerow([
                item.name,
                item.category,
                item.quantity or "",
                item.unit or "",
                item.stock_status,
                item.low_stock_threshold,
                item.purchase_date or "",
                item.expiry_date or "",
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=fridgeflow-inventory.csv"}
        )


@router.post("/settings/reset-data")
def reset_local_data(
    confirm: bool = Query(False),
    db: Session = Depends(get_db)
):
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Must provide confirm=true to reset local application data."
        )

    # Delete all rows in tables
    db.query(ScanDetection).delete()
    db.query(InventoryItem).delete()
    db.query(GroceryListItem).delete()
    db.query(ScanRecord).delete()
    db.commit()

    # Clear uploaded images
    try:
        for file in settings.UPLOAD_DIR.glob("*"):
            if file.is_file() and file.name != ".gitkeep":
                file.unlink()
    except Exception:
        pass

    return {"message": "All local inventory, scans, lists, and images have been erased."}
