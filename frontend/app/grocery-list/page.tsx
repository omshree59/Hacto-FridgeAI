'use client';

import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Plus,
  Sparkles,
  Trash2,
  CheckCircle2,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  Edit2,
  Check,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { GroceryItem } from '@/lib/types';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';

const AISLE_GROUPS: { id: string; label: string; categories: string[] }[] = [
  { id: 'produce', label: 'Produce', categories: ['vegetables', 'fruits'] },
  { id: 'dairy_eggs', label: 'Dairy & Eggs', categories: ['dairy', 'eggs'] },
  { id: 'meat_seafood', label: 'Meat & Seafood', categories: ['meat and seafood'] },
  { id: 'pantry', label: 'Pantry & Grains', categories: ['grains and bread', 'condiments', 'snacks'] },
  { id: 'frozen', label: 'Frozen', categories: ['frozen food'] },
  { id: 'beverages', label: 'Beverages', categories: ['beverages'] },
  { id: 'other', label: 'Other Essentials', categories: ['other'] },
];

export default function GroceryListPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shoppingMode, setShoppingMode] = useState(false);

  // Add / Edit Item modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('other');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formNotes, setFormNotes] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const loadGroceries = async () => {
    try {
      setLoading(true);
      const res = await api.getGroceryList();
      setItems(res.items);
    } catch (err: any) {
      alert(`Failed to load grocery list: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroceries();
  }, []);

  const handleToggleComplete = async (item: GroceryItem) => {
    try {
      const updated = await api.updateGroceryItem(item.id, {
        is_completed: !item.is_completed,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err: any) {
      alert(`Error updating item: ${err.message}`);
    }
  };

  const handleGenerateFromLowStock = async () => {
    try {
      setIsGenerating(true);
      await api.generateGroceryList({
        include_low_stock: true,
        include_out_of_stock: true,
      });
      await loadGroceries();
    } catch (err: any) {
      alert(`Failed to generate grocery items: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearCompleted = async () => {
    if (!confirm('Clear all completed items from your grocery list?')) return;
    try {
      await api.clearCompletedGroceryItems();
      setItems((prev) => prev.filter((i) => !i.is_completed));
    } catch (err: any) {
      alert(`Error clearing items: ${err.message}`);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await api.deleteGroceryItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err: any) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('other');
    setFormQuantity('1');
    setFormUnit('pcs');
    setFormNotes('');
    setFormPriority('medium');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: GroceryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQuantity(item.quantity !== null ? String(item.quantity) : '');
    setFormUnit(item.unit || '');
    setFormNotes(item.notes || '');
    setFormPriority(item.priority);
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
        notes: formNotes.trim() || null,
        priority: formPriority,
      };

      if (editingItem) {
        await api.updateGroceryItem(editingItem.id, payload);
      } else {
        await api.addGroceryItem(payload);
      }
      setModalOpen(false);
      loadGroceries();
    } catch (err: any) {
      alert(`Failed to save grocery item: ${err.message}`);
    }
  };

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.is_completed).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={`space-y-6 ${shoppingMode ? 'max-w-3xl mx-auto py-2' : ''}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <Badge variant="citrus">Smart Restock Engine</Badge>
          <h1 className="text-3xl font-extrabold font-serif mt-1">Smart Grocery List</h1>
          <p className="text-xs text-gray-500">
            Aisle-grouped grocery checklist synced with your local inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Shopping Mode Toggle */}
          <button
            onClick={() => setShoppingMode(!shoppingMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              shoppingMode
                ? 'bg-emerald-800 text-white border-emerald-800 shadow-md'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{ borderColor: shoppingMode ? undefined : 'var(--border-light)' }}
            title="Toggle Large Touch-Friendly Shopping Mode"
          >
            {shoppingMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{shoppingMode ? 'Exit Shopping Mode' : 'Shopping Mode'}</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <a
            href={api.getExportGroceryUrl('text')}
            download
            className="px-3 py-2 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1"
            style={{ borderColor: 'var(--border-light)' }}
            title="Download Plain Text Checklist"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Text</span>
          </a>

          <a
            href={api.getExportGroceryUrl('csv')}
            download
            className="px-3 py-2 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1"
            style={{ borderColor: 'var(--border-light)' }}
            title="Download CSV Spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </a>

          {/* Generate from low stock button */}
          <button
            onClick={handleGenerateFromLowStock}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition hover:scale-102 flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--forest-800)' }}
          >
            <Sparkles className={`w-3.5 h-3.5 text-emerald-300 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Scanning Inventory...' : 'Generate from Low Stock'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 transition flex items-center gap-1"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Summary Card */}
      <Card className="p-5 border space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-sm">{pendingCount} items remaining</span>
            <span className="text-gray-500 ml-2">({completedCount} completed of {totalCount})</span>
          </div>

          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Completed</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Items Section by Aisle */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Loading grocery list...</span>
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 space-y-3">
          <ListTodo className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-base font-serif">Your shopping list is clear!</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Click &quot;Generate from Low Stock&quot; to automatically pull items that are low in your fridge, or manually add what you need.
          </p>
          <div className="pt-2">
            <button
              onClick={handleGenerateFromLowStock}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 transition"
            >
              Generate from Low Stock
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {AISLE_GROUPS.map((group) => {
            const groupItems = items.filter((item) =>
              group.categories.includes(item.category)
            );
            if (groupItems.length === 0) return null;

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 font-serif">
                    {group.label}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.2 bg-black/5 dark:bg-white/10 rounded-full text-gray-500 font-mono">
                    {groupItems.filter((i) => !i.is_completed).length}
                  </span>
                </div>

                <div className="space-y-2">
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition-all ${
                        shoppingMode ? 'p-4' : 'p-3'
                      } flex items-center justify-between gap-3 ${
                        item.is_completed
                          ? 'bg-black/2 dark:bg-white/2 opacity-60'
                          : 'bg-white dark:bg-zinc-800/90 shadow-xs'
                      }`}
                      style={{ borderColor: 'var(--border-light)' }}
                    >
                      {/* Left: Checkbox & Info */}
                      <div
                        onClick={() => handleToggleComplete(item)}
                        className="flex items-center gap-3.5 flex-1 cursor-pointer select-none"
                      >
                        <div
                          className={`rounded-xl flex items-center justify-center transition-all ${
                            shoppingMode ? 'w-7 h-7' : 'w-5 h-5'
                          } ${
                            item.is_completed
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-gray-400 dark:border-zinc-500 hover:border-emerald-600'
                          }`}
                        >
                          {item.is_completed && (
                            <Check className={shoppingMode ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${
                                shoppingMode ? 'text-base' : 'text-sm'
                              } ${
                                item.is_completed ? 'line-through text-gray-400' : ''
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.quantity && (
                              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                                {item.quantity} {item.unit || ''}
                              </span>
                            )}
                            {item.source === 'low_stock' && (
                              <Badge variant="warning">Low Stock</Badge>
                            )}
                            {item.priority === 'high' && (
                              <Badge variant="danger">Priority</Badge>
                            )}
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      {!shoppingMode && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 transition"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Grocery Item' : 'Add Item to Grocery List'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Ingredient / Product Name *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Oat Milk, Sliced Sourdough, Apples"
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
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="dairy">Dairy</option>
                <option value="meat and seafood">Meat & Seafood</option>
                <option value="eggs">Eggs</option>
                <option value="beverages">Beverages</option>
                <option value="grains and bread">Grains & Bread</option>
                <option value="frozen food">Frozen Food</option>
                <option value="condiments">Condiments</option>
                <option value="snacks">Snacks</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Priority
              </label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              >
                <option value="high">High (Must Buy)</option>
                <option value="medium">Medium</option>
                <option value="low">Low (Optional)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Quantity to Buy
              </label>
              <input
                type="number"
                step="any"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
                placeholder="e.g. 1, 2.5"
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
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

          <div>
            <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Optional Note
            </label>
            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Prefer unsweetened brand"
              className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
              style={{ borderColor: 'var(--border-light)' }}
            />
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
              {editingItem ? 'Save Changes' : 'Add to Grocery List'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
