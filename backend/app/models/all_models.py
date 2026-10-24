from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base


def utc_now():
    return datetime.now(timezone.utc)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    normalized_name = Column(String(120), nullable=False, index=True)
    category = Column(String(60), nullable=False, default="other", index=True)
    quantity = Column(Float, nullable=True)
    unit = Column(String(30), nullable=True)
    quantity_known = Column(Boolean, default=True, nullable=False)
    low_stock_threshold = Column(Float, default=1.0, nullable=False)
    preferred_restock_quantity = Column(Float, nullable=True)
    source_scan_id = Column(Integer, ForeignKey("scans.id", ondelete="SET NULL"), nullable=True)
    
    # Optional expiry and purchase dates entered by user
    purchase_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    source_scan = relationship("ScanRecord", back_populates="inventory_items")

    __table_args__ = (
        Index("ix_inventory_cat_name", "category", "normalized_name"),
    )


class GroceryListItem(Base):
    __tablename__ = "grocery_list_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    normalized_name = Column(String(120), nullable=False, index=True)
    category = Column(String(60), nullable=False, default="other", index=True)
    quantity = Column(Float, nullable=True)
    unit = Column(String(30), nullable=True)
    notes = Column(String(255), nullable=True)
    priority = Column(String(20), default="medium", nullable=False)  # high, medium, low
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    source = Column(String(30), default="manual", nullable=False)  # manual, low_stock, recipe, scan
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)


class ScanRecord(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_type = Column(String(40), default="full_fridge", nullable=False)
    model_name = Column(String(100), nullable=False)
    status = Column(String(30), default="pending", nullable=False)  # pending, processing, completed, failed
    image_reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    raw_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    detections = relationship("ScanDetection", back_populates="scan", cascade="all, delete-orphan")
    inventory_items = relationship("InventoryItem", back_populates="source_scan")


class ScanDetection(Base):
    __tablename__ = "scan_detections"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_name = Column(String(120), nullable=False)
    category = Column(String(60), default="other", nullable=False)
    quantity_estimate = Column(Float, nullable=True)
    unit = Column(String(30), nullable=True)
    confidence_level = Column(String(20), default="medium", nullable=False)  # high, medium, low
    visible_attributes = Column(Text, nullable=True)  # JSON-encoded array of strings
    needs_review = Column(Boolean, default=False, nullable=False)
    user_confirmed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    scan = relationship("ScanRecord", back_populates="detections")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_name = Column(String(120), nullable=False, index=True)
    ingredient_name = Column(String(120), nullable=False)
    normalized_name = Column(String(120), nullable=False, index=True)
    quantity = Column(Float, nullable=True)
    unit = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
