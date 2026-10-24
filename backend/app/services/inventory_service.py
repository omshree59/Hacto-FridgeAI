from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from backend.app.models.all_models import InventoryItem
from backend.app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    InventoryReconcileItem,
    ReconcileProposal,
)
from backend.app.utils.normalization import normalize_ingredient_name, infer_category, normalize_unit


def compute_stock_status(item: InventoryItem) -> Tuple[bool, bool, str]:
    """
    Computes (is_low_stock, is_out_of_stock, stock_status)
    Rules:
    - If quantity is unknown, stock_status is 'unknown'.
    - If quantity <= 0, stock_status is 'out_of_stock'.
    - If quantity <= low_stock_threshold, stock_status is 'low_stock'.
    - Otherwise 'in_stock'.
    """
    if not item.quantity_known or item.quantity is None:
        return False, False, "unknown"
    if item.quantity <= 0:
        return True, True, "out_of_stock"
    if item.quantity <= item.low_stock_threshold:
        return True, False, "low_stock"
    return False, False, "in_stock"


def item_to_response(item: InventoryItem) -> InventoryItemResponse:
    is_low, is_out, status_str = compute_stock_status(item)
    return InventoryItemResponse(
        id=item.id,
        name=item.name,
        normalized_name=item.normalized_name,
        category=item.category,
        quantity=item.quantity,
        unit=item.unit,
        quantity_known=item.quantity_known,
        low_stock_threshold=item.low_stock_threshold,
        preferred_restock_quantity=item.preferred_restock_quantity,
        source_scan_id=item.source_scan_id,
        purchase_date=item.purchase_date,
        expiry_date=item.expiry_date,
        is_low_stock=is_low,
        is_out_of_stock=is_out,
        stock_status=status_str,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


class InventoryService:
    @staticmethod
    def get_items(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        low_stock_only: bool = False,
        sort_by: str = "name",  # "name", "date", "category"
        sort_order: str = "asc",  # "asc", "desc"
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[InventoryItemResponse], int]:
        query = db.query(InventoryItem)

        if search:
            s_clean = search.strip().lower()
            query = query.filter(
                or_(
                    InventoryItem.name.ilike(f"%{s_clean}%"),
                    InventoryItem.normalized_name.ilike(f"%{s_clean}%")
                )
            )

        if category and category.lower() != "all":
            query = query.filter(InventoryItem.category == category.lower())

        # Determine order
        order_col = InventoryItem.name
        if sort_by == "date":
            order_col = InventoryItem.updated_at
        elif sort_by == "category":
            order_col = InventoryItem.category

        if sort_order == "desc":
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))

        all_items = query.all()

        # Low stock filtering based on dynamic rules
        if low_stock_only:
            filtered = []
            for item in all_items:
                is_low, is_out, _ = compute_stock_status(item)
                if is_low or is_out:
                    filtered.append(item)
            all_items = filtered

        total = len(all_items)
        paginated = all_items[skip:skip + limit]
        return [item_to_response(i) for i in paginated], total

    @staticmethod
    def get_by_id(db: Session, item_id: int) -> Optional[InventoryItem]:
        return db.query(InventoryItem).filter(InventoryItem.id == item_id).first()

    @staticmethod
    def create_item(db: Session, item_in: InventoryItemCreate) -> InventoryItemResponse:
        norm_name = normalize_ingredient_name(item_in.name)
        cat = item_in.category.lower() if item_in.category else infer_category(item_in.name)
        norm_u = normalize_unit(item_in.unit)

        item = InventoryItem(
            name=item_in.name.strip(),
            normalized_name=norm_name,
            category=cat,
            quantity=item_in.quantity,
            unit=norm_u,
            quantity_known=item_in.quantity_known if item_in.quantity is not None else False,
            low_stock_threshold=item_in.low_stock_threshold,
            preferred_restock_quantity=item_in.preferred_restock_quantity,
            source_scan_id=item_in.source_scan_id,
            purchase_date=item_in.purchase_date,
            expiry_date=item_in.expiry_date,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item_to_response(item)

    @staticmethod
    def update_item(
        db: Session, item: InventoryItem, update_in: InventoryItemUpdate
    ) -> InventoryItemResponse:
        if update_in.name is not None:
            item.name = update_in.name.strip()
            item.normalized_name = normalize_ingredient_name(update_in.name)
        if update_in.category is not None:
            item.category = update_in.category.lower()
        if update_in.quantity is not None:
            item.quantity = update_in.quantity
            item.quantity_known = True
        if update_in.unit is not None:
            item.unit = normalize_unit(update_in.unit)
        if update_in.quantity_known is not None:
            item.quantity_known = update_in.quantity_known
        if update_in.low_stock_threshold is not None:
            item.low_stock_threshold = update_in.low_stock_threshold
        if update_in.preferred_restock_quantity is not None:
            item.preferred_restock_quantity = update_in.preferred_restock_quantity
        if update_in.purchase_date is not None:
            item.purchase_date = update_in.purchase_date
        if update_in.expiry_date is not None:
            item.expiry_date = update_in.expiry_date

        db.commit()
        db.refresh(item)
        return item_to_response(item)

    @staticmethod
    def delete_item(db: Session, item_id: int) -> bool:
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True

    @staticmethod
    def propose_reconciliation(
        db: Session,
        detections: List[dict]
    ) -> ReconcileProposal:
        """
        Compares candidate detections against current inventory.
        Proposes merge/update/create actions for user confirmation.
        """
        proposals = []
        for det in detections:
            name = det.get("candidate_name", "")
            norm_name = normalize_ingredient_name(name)
            cat = det.get("category", "other")
            qty = det.get("quantity_estimate")
            unit = normalize_unit(det.get("unit"))

            # Look for existing inventory match
            existing = db.query(InventoryItem).filter(
                InventoryItem.normalized_name == norm_name
            ).first()

            if existing:
                # Suggest update or merge
                action = "update_quantity" if qty is not None else "ignore"
                proposals.append(
                    InventoryReconcileItem(
                        scan_detection_id=det.get("id"),
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
                        scan_detection_id=det.get("id"),
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

        return ReconcileProposal(items=proposals)

    @staticmethod
    def execute_reconciliation(
        db: Session,
        proposals: List[InventoryReconcileItem],
        source_scan_id: Optional[int] = None
    ) -> List[InventoryItemResponse]:
        """Executes confirmed reconciliation actions in a single atomic transaction."""
        results = []
        try:
            for p in proposals:
                if p.action == "create_new":
                    new_item = InventoryItem(
                        name=p.candidate_name,
                        normalized_name=normalize_ingredient_name(p.candidate_name),
                        category=p.category,
                        quantity=p.confirmed_quantity,
                        unit=normalize_unit(p.confirmed_unit),
                        quantity_known=p.confirmed_quantity is not None,
                        source_scan_id=source_scan_id,
                    )
                    db.add(new_item)
                    db.flush()
                    results.append(item_to_response(new_item))

                elif p.action in ("update_quantity", "merge") and p.existing_item_id:
                    existing = db.query(InventoryItem).filter(
                        InventoryItem.id == p.existing_item_id
                    ).first()
                    if existing:
                        if p.action == "merge" and existing.quantity is not None and p.confirmed_quantity is not None:
                            existing.quantity += p.confirmed_quantity
                        else:
                            existing.quantity = p.confirmed_quantity
                            if p.confirmed_unit:
                                existing.unit = normalize_unit(p.confirmed_unit)
                        existing.quantity_known = existing.quantity is not None
                        if source_scan_id:
                            existing.source_scan_id = source_scan_id
                        db.flush()
                        results.append(item_to_response(existing))

            db.commit()
            return results
        except Exception:
            db.rollback()
            raise
