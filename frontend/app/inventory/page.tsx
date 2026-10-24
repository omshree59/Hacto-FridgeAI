'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { api } from '@/lib/api';
import { InventoryItem, FoodCategory } from '@/lib/types';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'meat and seafood', label: 'Meat & Seafood' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'beverages', label: 'Beverages' },
  { id: 'grains and bread', label: 'Grains & Bread' },
  { id: 'frozen food', label: 'Frozen' },
  { id: 'condiments', label: 'Condiments' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'other', label: 'Other' },
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('other');
  const [formQuantity, setFormQuantity] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('');
  const [formThreshold, setFormThreshold] = useState<string>('1.0');
  const [formRestock, setFormRestock] = useState<string>('');
  const [formPurchaseDate, setFormPurchaseDate] = useState<string>('');
  const [formExpiryDate, setFormExpiryDate] = useState<string>('');

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory({
        search: search || undefined,
        category: category !== 'all' ? category : undefined,
        low_stock_only: lowStockOnly,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setItems(res.items);
    } catch (err: any) {
      alert(`Failed to load inventory: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventory();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, category, lowStockOnly, sortBy, sortOrder]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('other');
    setFormQuantity('');
    setFormUnit('pcs');
    setFormThreshold('1.0');
    setFormRestock('');
    setFormPurchaseDate('');
    setFormExpiryDate('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQuantity(item.quantity !== null ? String(item.quantity) : '');
    setFormUnit(item.unit || '');
    setFormThreshold(String(item.low_stock_threshold));
    setFormRestock(item.preferred_restock_quantity !== null ? String(item.preferred_restock_quantity) : '');
    setFormPurchaseDate(item.purchase_date ? item.purchase_date.split('T')[0] : '');
    setFormExpiryDate(item.expiry_date ? item.expiry_date.split('T')[0] : '');
    setModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      const payload = {
        name: formName.trim(),
        category: formCategory,
        quantity: formQuantity === '' ? null : parseFloat(formQuantity),
        unit: formUnit.trim() || null,
        low_stock_threshold: parseFloat(formThreshold) || 1.0,
        preferred_restock_quantity: formRestock === '' ? null : parseFloat(formRestock),
        purchase_date: formPurchaseDate ? new Date(formPurchaseDate).toISOString() : null,
        expiry_date: formExpiryDate ? new Date(formExpiryDate).toISOString() : null,
      };

      if (editingItem) {
        await api.updateInventoryItem(editingItem.id, payload);
      } else {
        await api.createInventoryItem(payload);
      }
      setModalOpen(false);
      loadInventory();
    } catch (err: any) {
      alert(`Failed to save item: ${err.message}`);
    }
  };

  const handleAdjustQuantity = async (item: InventoryItem, delta: number) => {
    const current = item.quantity ?? 0;
    const newQty = Math.max(0, current + delta);
    try {
      const updated = await api.updateInventoryItem(item.id, {
        quantity: newQty,
        quantity_known: true,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err: any) {
      alert(`Error adjusting quantity: ${err.message}`);
    }
  };

  const handleMarkFinished = async (item: InventoryItem) => {
    try {
      const updated = await api.updateInventoryItem(item.id, {
        quantity: 0,
        quantity_known: true,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err: any) {
      alert(`Error marking finished: ${err.message}`);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      await api.deleteInventoryItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err: any) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <Badge variant="success">Persistent Storage</Badge>
          <h1 className="text-3xl font-extrabold font-serif mt-1">Kitchen Inventory</h1>
          <p className="text-xs text-gray-500">
            Manage your pantry, fridge, and freezer supplies with custom thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.getExportInventoryUrl('csv')}
            download
            className="px-3.5 py-2 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition hover:scale-102 flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--forest-800)' }}
          >
            <Plus className="w-4 h-4 text-emerald-300" />
            <span>Add Item Manually</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ingredient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              style={{ borderColor: 'var(--border-light)' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                lowStockOnly
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                  : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:bg-black/5'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Only</span>
            </button>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as any;
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold border bg-white dark:bg-zinc-800"
              style={{ borderColor: 'var(--border-light)' }}
            >
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="date-desc">Sort: Recently Added</option>
              <option value="category-asc">Sort: Category</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full shrink-0 font-medium transition ${
                category === cat.id
                  ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Items Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Loading inventory...</span>
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 space-y-3">
          <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-base font-serif">No inventory items found</h3>
          <p className="text-xs text-gray-500">
            {search || category !== 'all' || lowStockOnly
              ? 'Try adjusting your filters or search query.'
              : 'Add an item manually or scan your fridge to build your stock.'}
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="p-4 border transition hover:shadow-md flex flex-col justify-between"
              style={{
                borderColor:
                  item.is_out_of_stock
                    ? 'var(--accent-alert-border)'
                    : item.is_low_stock
                    ? 'var(--accent-warning-border)'
                    : 'var(--border-light)',
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-sm tracking-tight capitalize">{item.name}</h3>
                    <span className="text-[11px] text-gray-500 capitalize">{item.category}</span>
                  </div>
                  <Badge
                    variant={
                      item.is_out_of_stock
                        ? 'danger'
                        : item.is_low_stock
                        ? 'warning'
                        : item.quantity_known
                        ? 'success'
                        : 'default'
                    }
                  >
                    {item.stock_status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Quantity and threshold details */}
                <div className="my-3 p-2.5 rounded-xl bg-black/2 dark:bg-white/2 border text-xs space-y-1" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">In Stock:</span>
                    <span className="font-bold font-mono text-sm">
                      {item.quantity_known && item.quantity !== null
                        ? `${item.quantity} ${item.unit || ''}`
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Threshold:</span>
                    <span>{item.low_stock_threshold} {item.unit || ''}</span>
                  </div>
                  {item.expiry_date && (
                    <div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400">
                      <span>Expires:</span>
                      <span>{new Date(item.expiry_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                {/* Quantity adjust stepper */}
                <div className="flex items-center border rounded-lg bg-white dark:bg-zinc-800 text-xs overflow-hidden" style={{ borderColor: 'var(--border-light)' }}>
                  <button
                    onClick={() => handleAdjustQuantity(item, -1)}
                    className="px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 transition font-bold"
                    title="Decrease quantity by 1"
                  >
                    -
                  </button>
                  <span className="px-2 font-mono text-xs">{item.quantity ?? 0}</span>
                  <button
                    onClick={() => handleAdjustQuantity(item, 1)}
                    className="px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 transition font-bold"
                    title="Increase quantity by 1"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-black/5 transition"
                    title="Edit Item Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMarkFinished(item)}
                    className="px-2 py-1 rounded-lg text-[10px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition"
                    title="Mark item as finished (quantity 0)"
                  >
                    Empty
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Inventory Item' : 'Add New Groceries to Inventory'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Ingredient Name *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Roma Tomatoes, Whole Milk, Butter"
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
              style={{ borderColor: 'var(--border-light)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Unit
              </label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="pcs, L, kg, pack"
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Current Quantity
              </label>
              <input
                type="number"
                step="any"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                placeholder="Leave blank if unknown"
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                step="any"
                value={formThreshold}
                onChange={(e) => setFormThreshold(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Preferred Restock Qty
              </label>
              <input
                type="number"
                step="any"
                value={formRestock}
                onChange={(e) => setFormRestock(e.target.value)}
                placeholder="e.g. 2"
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Purchase Date (Optional)
              </label>
              <input
                type="date"
                value={formPurchaseDate}
                onChange={(e) => setFormPurchaseDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 shadow-xs"
            >
              {editingItem ? 'Save Changes' : 'Create Inventory Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
