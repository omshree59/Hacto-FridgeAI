import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.models.all_models import ScanRecord, ScanDetection, InventoryItem
from backend.app.schemas.scan import (
    ScanRecordResponse,
    ScanConfirmRequest,
    ScanDetectionResponse,
)
from backend.app.schemas.inventory import InventoryReconcileItem
from backend.app.services.image_service import ImageService
from backend.app.services.ollama_service import ollama_service
from backend.app.services.inventory_service import InventoryService
from backend.app.utils.normalization import normalize_ingredient_name, infer_category, normalize_unit

router = APIRouter(tags=["Scan"])


@router.post("/scan", response_model=ScanRecordResponse)
async def scan_fridge_image(
    file: UploadFile = File(...),
    scan_type: str = Form("full_fridge"),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Accepts an uploaded fridge photo, performs image preprocessing,
    runs the local Ollama vision model, parses structured detections,
    and stores the scan record for review.
    """
    # 1. Image validation and preprocessing
    filename, base64_img, _, _ = ImageService.validate_and_process_upload(file)

    # 2. Create initial ScanRecord
    scan_record = ScanRecord(
        scan_type=scan_type,
        model_name=settings.OLLAMA_VISION_MODEL,
        status="processing",
        image_reference=filename,
        notes=notes,
    )
    db.add(scan_record)
    db.commit()
    db.refresh(scan_record)

    # 3. Local AI Vision Inference
    try:
        ai_result, raw_response = await ollama_service.analyze_fridge_image(
            base64_image=base64_img,
            scan_type=scan_type,
            custom_notes=notes,
        )

        scan_record.raw_response = raw_response
        scan_record.status = "completed"
        scan_record.completed_at = datetime.now(timezone.utc)

        # 4. Save detections
        for item in ai_result.items:
            det = ScanDetection(
                scan_id=scan_record.id,
                candidate_name=item.name,
                category=item.category,
                quantity_estimate=item.quantity_estimate,
                unit=item.unit,
                confidence_level=item.confidence_level,
                visible_attributes=json.dumps(item.visible_attributes),
                needs_review=item.needs_review,
                user_confirmed=False,
            )
            db.add(det)

        db.commit()
        db.refresh(scan_record)

        # Optional auto-deletion of original image if requested by user setting
        if settings.AUTO_DELETE_IMAGES_AFTER_ANALYSIS:
            ImageService.delete_image_file(filename)
            scan_record.image_reference = None
            db.commit()

        # Format detections for response
        det_responses = []
        for d in scan_record.detections:
            attrs = []
            if d.visible_attributes:
                try:
                    attrs = json.loads(d.visible_attributes)
                except Exception:
                    pass
            det_responses.append(
                ScanDetectionResponse(
                    id=d.id,
                    candidate_name=d.candidate_name,
                    category=d.category,
                    quantity_estimate=d.quantity_estimate,
                    unit=d.unit,
                    confidence_level=d.confidence_level,
                    visible_attributes=attrs,
                    needs_review=d.needs_review,
                    user_confirmed=d.user_confirmed,
                    created_at=d.created_at,
                )
            )

        return ScanRecordResponse(
            id=scan_record.id,
            scan_type=scan_record.scan_type,
            model_name=scan_record.model_name,
            status=scan_record.status,
            image_reference=scan_record.image_reference,
            notes=scan_record.notes,
            error_message=scan_record.error_message,
            created_at=scan_record.created_at,
            completed_at=scan_record.completed_at,
            detections=det_responses,
        )

    except Exception as exc:
        scan_record.status = "failed"
        scan_record.error_message = str(exc)
        scan_record.completed_at = datetime.now(timezone.utc)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scan analysis failed: {str(exc)}"
        ) from exc


@router.get("/scans", response_model=List[ScanRecordResponse])
def get_scan_history(db: Session = Depends(get_db)):
    """Retrieves all previous scans with their detections."""
    scans = db.query(ScanRecord).order_by(ScanRecord.created_at.desc()).all()
    results = []
    for s in scans:
        det_responses = []
        for d in s.detections:
            attrs = []
            if d.visible_attributes:
                try:
                    attrs = json.loads(d.visible_attributes)
                except Exception:
                    pass
            det_responses.append(
                ScanDetectionResponse(
                    id=d.id,
                    candidate_name=d.candidate_name,
                    category=d.category,
                    quantity_estimate=d.quantity_estimate,
                    unit=d.unit,
                    confidence_level=d.confidence_level,
                    visible_attributes=attrs,
                    needs_review=d.needs_review,
                    user_confirmed=d.user_confirmed,
                    created_at=d.created_at,
                )
            )
        results.append(
            ScanRecordResponse(
                id=s.id,
                scan_type=s.scan_type,
                model_name=s.model_name,
                status=s.status,
                image_reference=s.image_reference,
                notes=s.notes,
                error_message=s.error_message,
                created_at=s.created_at,
                completed_at=s.completed_at,
                detections=det_responses,
            )
        )
    return results


@router.get("/scans/{scan_id}", response_model=ScanRecordResponse)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    det_responses = []
    for d in scan.detections:
        attrs = []
        if d.visible_attributes:
            try:
                attrs = json.loads(d.visible_attributes)
            except Exception:
                pass
        det_responses.append(
            ScanDetectionResponse(
                id=d.id,
                candidate_name=d.candidate_name,
                category=d.category,
                quantity_estimate=d.quantity_estimate,
                unit=d.unit,
                confidence_level=d.confidence_level,
                visible_attributes=attrs,
                needs_review=d.needs_review,
                user_confirmed=d.user_confirmed,
                created_at=d.created_at,
            )
        )

    return ScanRecordResponse(
        id=scan.id,
        scan_type=scan.scan_type,
        model_name=scan.model_name,
        status=scan.status,
        image_reference=scan.image_reference,
        notes=scan.notes,
        error_message=scan.error_message,
        created_at=scan.created_at,
        completed_at=scan.completed_at,
        detections=det_responses,
    )


@router.post("/scans/{scan_id}/confirm")
def confirm_scan_detections(
    scan_id: int,
    request: ScanConfirmRequest,
    db: Session = Depends(get_db)
):
    """
    Applies user edits/confirmations to candidate detections and updates inventory.
    """
    scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    proposals = []
    for item in request.items:
        det = db.query(ScanDetection).filter(
            ScanDetection.id == item.id,
            ScanDetection.scan_id == scan_id
        ).first()

        if not det:
            continue

        if item.deleted:
            db.delete(det)
            continue

        # Update candidate attributes if user edited them
        name = item.candidate_name if item.candidate_name else det.candidate_name
        cat = item.category if item.category else det.category
        qty = item.quantity_estimate if item.quantity_estimate is not None else det.quantity_estimate
        unit = item.unit if item.unit is not None else det.unit

        det.candidate_name = name
        det.category = cat
        det.quantity_estimate = qty
        det.unit = unit
        det.user_confirmed = True
        det.needs_review = False

        # Build reconciliation proposal item
        norm_name = normalize_ingredient_name(name)
        existing = db.query(InventoryItem).filter(
            InventoryItem.normalized_name == norm_name
        ).first()

        if existing:
            action = "update_quantity" if qty is not None else "ignore"
            proposals.append(
                InventoryReconcileItem(
                    scan_detection_id=det.id,
                    candidate_name=name,
                    category=existing.category,
                    detected_quantity=qty,
                    detected_unit=unit,
                    existing_item_id=existing.id,
                    existing_quantity=existing.quantity,
                    action=action,
                    confirmed_quantity=qty if qty is not None else existing.quantity,
                    confirmed_unit=unit or existing.unit,
                )
            )
        else:
            proposals.append(
                InventoryReconcileItem(
                    scan_detection_id=det.id,
                    candidate_name=name,
                    category=cat,
                    detected_quantity=qty,
                    detected_unit=unit,
                    existing_item_id=None,
                    existing_quantity=None,
                    action="create_new",
                    confirmed_quantity=qty,
                    confirmed_unit=unit,
                )
            )

    db.commit()

    # Execute reconciliation into inventory
    reconciled_items = InventoryService.execute_reconciliation(
        db, proposals, source_scan_id=scan.id
    )

    return {
        "message": f"Successfully confirmed scan #{scan_id} and reconciled {len(reconciled_items)} items into inventory.",
        "reconciled_count": len(reconciled_items),
        "items": reconciled_items
    }


@router.delete("/scans/{scan_id}")
def delete_scan(
    scan_id: int,
    delete_image: bool = True,
    db: Session = Depends(get_db)
):
    scan = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if delete_image and scan.image_reference:
        ImageService.delete_image_file(scan.image_reference)

    db.delete(scan)
    db.commit()
    return {"message": f"Scan #{scan_id} deleted successfully."}


@router.get("/scans/image/{filename}")
def get_scan_image(filename: str):
    """Safely serves uploaded scan photos."""
    safe_name = Path(filename).name
    file_path = settings.UPLOAD_DIR / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(file_path, media_type="image/jpeg")
