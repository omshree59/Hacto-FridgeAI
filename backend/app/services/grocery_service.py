import csv
import io
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models.all_models import GroceryListItem, InventoryItem
from backend.app.schemas.grocery import (
    GroceryItemCreate,
    GroceryItemUpdate,
    GroceryItemResponse,
    GroceryGenerateRequest,
)
from backend.app.services.inventory_service import compute_stock_status
from backend.app.utils.normalization import normalize_ingredient_name, infer_category, normalize_unit


def grocery_to_response(item: GroceryListItem) -> GroceryItemResponse:
    return GroceryItemResponse(
        id=item.id,
        name=item.name,
        normalized_name=item.normalized_name,
        category=item.category,
        quantity=item.quantity,
        unit=item.unit,
        notes=item.notes,
        priority=item.priority,  # type: ignore
        is_completed=item.is_completed,
        source=item.source,  # type: ignore
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


class GroceryService:
    @staticmethod
    def get_items(
        db: Session,
        category: Optional[str] = None,
        completed: Optional[bool] = None,
    ) -> Tuple[List[GroceryItemResponse], int, int]:
        query = db.query(GroceryListItem)

        if category and category.lower() != "all":
            query = query.filter(GroceryListItem.category == category.lower())

        if completed is not None:
            query = query.filter(GroceryListItem.is_completed == completed)

        items = query.order_by(
            GroceryListItem.is_completed.asc(),
            GroceryListItem.priority.desc(),
            GroceryListItem.name.asc()
        ).all()

        total = len(items)
        completed_count = sum(1 for i in items if i.is_completed)
        pending_count = total - completed_count

        return [grocery_to_response(i) for i in items], completed_count, pending_count

    @staticmethod
    def add_item(db: Session, item_in: GroceryItemCreate) -> GroceryItemResponse:
        norm_name = normalize_ingredient_name(item_in.name)
        cat = item_in.category.lower() if item_in.category else infer_category(item_in.name)
        unit = normalize_unit(item_in.unit)

        # Check if an uncompleted item with same normalized name already exists
        existing = db.query(GroceryListItem).filter(
            GroceryListItem.normalized_name == norm_name,
            GroceryListItem.is_completed == False
        ).first()

        if existing:
            # Update quantity if both are known and units match
            if existing.quantity is not None and item_in.quantity is not None:
                if existing.unit == unit:
                    existing.quantity += item_in.quantity
            elif item_in.quantity is not None:
                existing.quantity = item_in.quantity
                existing.unit = unit

            if item_in.notes:
                existing.notes = f"{existing.notes}; {item_in.notes}" if existing.notes else item_in.notes
            
            db.commit()
            db.refresh(existing)
            return grocery_to_response(existing)

        item = GroceryListItem(
            name=item_in.name.strip(),
            normalized_name=norm_name,
            category=cat,
            quantity=item_in.quantity,
            unit=unit,
            notes=item_in.notes,
            priority=item_in.priority,
            is_completed=item_in.is_completed,
            source=item_in.source,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return grocery_to_response(item)

    @staticmethod
    def update_item(
        db: Session, item_id: int, update_in: GroceryItemUpdate
    ) -> Optional[GroceryItemResponse]:
        item = db.query(GroceryListItem).filter(GroceryListItem.id == item_id).first()
        if not item:
            return None

        if update_in.name is not None:
            item.name = update_in.name.strip()
            item.normalized_name = normalize_ingredient_name(update_in.name)
        if update_in.category is not None:
            item.category = update_in.category.lower()
        if update_in.quantity is not None:
            item.quantity = update_in.quantity
        if update_in.unit is not None:
            item.unit = normalize_unit(update_in.unit)
        if update_in.notes is not None:
            item.notes = update_in.notes
        if update_in.priority is not None:
            item.priority = update_in.priority
        if update_in.is_completed is not None:
            item.is_completed = update_in.is_completed

        db.commit()
        db.refresh(item)
        return grocery_to_response(item)

    @staticmethod
    def delete_item(db: Session, item_id: int) -> bool:
        item = db.query(GroceryListItem).filter(GroceryListItem.id == item_id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True

    @staticmethod
    def clear_completed(db: Session) -> int:
        deleted_count = db.query(GroceryListItem).filter(
            GroceryListItem.is_completed == True
        ).delete()
        db.commit()
        return deleted_count

    @staticmethod
    def generate_smart_list(
        db: Session,
        request: GroceryGenerateRequest
    ) -> List[GroceryItemResponse]:
        """
        Generates shopping list items from:
        1. Low-stock inventory items
        2. Out-of-stock inventory items
        3. Optional recipe missing ingredients
        """
        generated: List[GroceryItemResponse] = []

        # 1. Evaluate inventory stock
        if request.include_low_stock or request.include_out_of_stock:
            inventory = db.query(InventoryItem).all()
            for inv in inventory:
                is_low, is_out, status_str = compute_stock_status(inv)
                
                should_add = False
                if is_out and request.include_out_of_stock:
                    should_add = True
                elif is_low and request.include_low_stock:
                    should_add = True

                if should_add:
                    # Calculate suggested buy quantity
                    buy_qty = inv.preferred_restock_quantity
                    if buy_qty is None and inv.quantity is not None:
                        buy_qty = max(1.0, (inv.low_stock_threshold * 2) - inv.quantity)

                    item_create = GroceryItemCreate(
                        name=inv.name,
                        category=inv.category,
                        quantity=round(buy_qty, 1) if buy_qty is not None else None,
                        unit=inv.unit,
                        notes=f"Auto-generated: {status_str.replace('_', ' ')}",
                        priority="high" if is_out else "medium",
                        source="low_stock",
                    )
                    res = GroceryService.add_item(db, item_create)
                    generated.append(res)

        # 2. Add recipe missing items if provided
        if request.recipe_missing_items:
            for rec_item in request.recipe_missing_items:
                res = GroceryService.add_item(db, rec_item)
                generated.append(res)

        return generated

    @staticmethod
    def export_as_csv(db: Session) -> str:
        items = db.query(GroceryListItem).order_by(
            GroceryListItem.category.asc(),
            GroceryListItem.name.asc()
        ).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Name", "Category", "Quantity", "Unit", "Priority", "Completed", "Notes"])
        for item in items:
            writer.writerow([
                item.name,
                item.category,
                item.quantity or "",
                item.unit or "",
                item.priority,
                "Yes" if item.is_completed else "No",
                item.notes or ""
            ])
        return output.getvalue()

    @staticmethod
    def export_as_text(db: Session) -> str:
        items = db.query(GroceryListItem).order_by(
            GroceryListItem.category.asc(),
            GroceryListItem.name.asc()
        ).all()

        lines = ["# FridgeFlow AI - Grocery Shopping List\n"]
        current_cat = None

        for item in items:
            cat = item.category.capitalize()
            if cat != current_cat:
                current_cat = cat
                lines.append(f"\n## {current_cat}")

            status_mark = "[x]" if item.is_completed else "[ ]"
            qty_str = f" ({item.quantity} {item.unit})".strip() if item.quantity is not None else ""
            notes_str = f" - {item.notes}" if item.notes else ""
            lines.append(f"{status_mark} {item.name}{qty_str}{notes_str}")

        return "\n".join(lines)
