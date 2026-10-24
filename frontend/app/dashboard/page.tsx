'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  ShoppingBag,
  AlertTriangle,
  ListTodo,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  ChefHat,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { InventoryItem, GroceryItem, ScanRecord } from '@/lib/types';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';

export default function DashboardPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invRes, grocRes, scanRes] = await Promise.all([
        api.getInventory({ limit: 50 }),
        api.getGroceryList(),
        api.getScans(),
      ]);
      setInventory(invRes.items);
      setGroceries(grocRes.items);
      setScans(scanRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleGrocery = async (item: GroceryItem) => {
    try {
      const updated = await api.updateGroceryItem(item.id, {
        is_completed: !item.is_completed,
      });
      setGroceries((prev) =>
        prev.map((g) => (g.id === item.id ? updated : g))
      );
    } catch (err: any) {
      alert(`Could not update item: ${err.message}`);
    }
  };

  const handleAddLowStockToGrocery = async (item: InventoryItem) => {
    try {
      await api.addGroceryItem({
        name: item.name,
        category: item.category,
        quantity: item.preferred_restock_quantity || (item.low_stock_threshold ? item.low_stock_threshold * 2 : 1),
        unit: item.unit,
        notes: `Restock for low stock (${item.quantity ?? 0} remaining)`,
        priority: 'high',
      });
      const grocRes = await api.getGroceryList();
      setGroceries(grocRes.items);
    } catch (err: any) {
      alert(`Could not add to grocery list: ${err.message}`);
    }
  };

  const handleLoadSampleDemo = async () => {
    try {
      setLoading(true);
      // Create a few realistic starter items in inventory
      await api.createInventoryItem({
        name: 'Whole Milk',
        category: 'dairy',
        quantity: 0.5,
        unit: 'L',
        low_stock_threshold: 1.5,
      });
      await api.createInventoryItem({
        name: 'Roma Tomatoes',
        category: 'vegetables',
        quantity: 5,
        unit: 'pcs',
        low_stock_threshold: 2,
      });
      await api.createInventoryItem({
        name: 'Eggs (Dozen)',
        category: 'eggs',
        quantity: 2,
        unit: 'pcs',
        low_stock_threshold: 4,
      });
      await api.createInventoryItem({
        name: 'Greek Yogurt',
        category: 'dairy',
        quantity: 0,
        unit: 'pack',
        low_stock_threshold: 1,
      });
      await api.createInventoryItem({
        name: 'Avocados',
        category: 'fruits',
        quantity: 3,
        unit: 'pcs',
        low_stock_threshold: 1,
      });
      await loadData();
    } catch (err: any) {
      alert(`Could not load demo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = inventory.filter((i) => i.is_low_stock || i.is_out_of_stock);
  const pendingGroceries = groceries.filter((g) => !g.is_completed);
  const lastScan = scans.length > 0 ? scans[0] : null;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 border shadow-xs relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-light)',
        }}
      >
        <div className="max-w-2xl relative z-10 space-y-3">
          <Badge variant="success">Dashboard</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight">
            What&apos;s inside your fridge?
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
            One quick scan. A smarter grocery run. Keep track of what you have and let local AI flag missing essentials.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-md text-sm transition hover:scale-102"
              style={{ backgroundColor: 'var(--forest-800)' }}
            >
              <Camera className="w-4 h-4 text-emerald-300" />
              <span>Scan Fridge</span>
            </Link>
            <Link
              href="/grocery-list"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition"
              style={{ borderColor: 'var(--border-light)' }}
            >
              <ListTodo className="w-4 h-4 text-emerald-600" />
              <span>Open Grocery List ({pendingGroceries.length})</span>
            </Link>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl border text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
              style={{ borderColor: 'var(--border-light)' }}
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-2">
            <span>Total Inventory</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif">
            {inventory.length}
          </div>
          <p className="text-xs text-gray-500 mt-1">Confirmed ingredients</p>
        </Card>

        <Card className="p-5 border">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-2">
            <span>Running Low</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif text-amber-600 dark:text-amber-400">
            {lowStockItems.length}
          </div>
          <p className="text-xs text-gray-500 mt-1">Items below threshold</p>
        </Card>

        <Card className="p-5 border">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-2">
            <span>Items to Buy</span>
            <ListTodo className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif text-blue-600 dark:text-blue-400">
            {pendingGroceries.length}
          </div>
          <p className="text-xs text-gray-500 mt-1">Active shopping list</p>
        </Card>

        <Card className="p-5 border">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium mb-2">
            <span>Last Scan</span>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-serif truncate">
            {lastScan ? new Date(lastScan.created_at).toLocaleDateString() : 'No scans yet'}
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {lastScan ? `${lastScan.detections?.length || 0} items detected` : 'Take your first photo'}
          </p>
        </Card>
      </div>

      {/* Empty State Banner if No Data */}
      {!loading && inventory.length === 0 && (
        <Card className="p-8 text-center border-dashed border-2 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 mx-auto flex items-center justify-center">
            <Camera className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold font-serif">Your inventory is empty</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Scan your fridge to let the local vision AI populate your ingredients, or populate with realistic sample items to explore.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/scan"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 transition"
            >
              Scan Fridge Now
            </Link>
            <button
              onClick={handleLoadSampleDemo}
              className="px-4 py-2 rounded-xl text-xs font-semibold border text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Realistic Sample Groceries</span>
            </button>
          </div>
        </Card>
      )}

      {/* Main Grid: Low Stock & Shopping List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="p-6 border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold font-serif">Low-Stock Alerts</h3>
            </div>
            <Link href="/inventory" className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
              <span>View Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-gray-700 dark:text-gray-300">All inventory items are well-stocked</p>
              <p>No items currently fall below your defined restock thresholds.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border flex items-center justify-between gap-3 text-xs"
                  style={{
                    backgroundColor: item.is_out_of_stock ? 'var(--accent-alert-bg)' : 'var(--accent-warning-bg)',
                    borderColor: item.is_out_of_stock ? 'var(--accent-alert-border)' : 'var(--accent-warning-border)',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{item.name}</span>
                      <Badge variant={item.is_out_of_stock ? 'danger' : 'warning'}>
                        {item.is_out_of_stock ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                    <span className="text-gray-500 mt-0.5 block">
                      Current: {item.quantity !== null ? `${item.quantity} ${item.unit || ''}` : 'Unknown'} &bull; Threshold: {item.low_stock_threshold} {item.unit || ''}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddLowStockToGrocery(item)}
                    className="px-3 py-1.5 rounded-lg font-semibold border bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs transition shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to List</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Current Grocery List Preview */}
        <Card className="p-6 border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold font-serif">Active Grocery List</h3>
            </div>
            <Link href="/grocery-list" className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
              <span>Full List Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {groceries.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500 space-y-2">
              <p>Your grocery list is currently empty.</p>
              <Link
                href="/grocery-list"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-semibold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Items or Generate from Low Stock</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {groceries.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleGrocery(item)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition ${
                    item.is_completed
                      ? 'bg-black/2 dark:bg-white/2 opacity-60'
                      : 'bg-white dark:bg-zinc-800'
                  }`}
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => {}} // Controlled via card click
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className={`font-medium ${item.is_completed ? 'line-through text-gray-400' : ''}`}>
                      {item.name}
                      {item.quantity ? ` (${item.quantity} ${item.unit || ''})` : ''}
                    </span>
                  </div>
                  <Badge variant={item.priority === 'high' ? 'danger' : 'default'}>
                    {item.priority}
                  </Badge>
                </div>
              ))}
              {groceries.length > 6 && (
                <p className="text-center text-xs text-gray-500 pt-2">
                  + {groceries.length - 6} more items in list
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Action Hub */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link
          href="/scan"
          className="p-5 rounded-2xl border transition hover:shadow-md flex items-center gap-4 group"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 transition group-hover:scale-110">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm font-serif">Scan New Photo</h4>
            <p className="text-xs text-gray-500">Scan fridge, freezer, or pantry</p>
          </div>
        </Link>

        <Link
          href="/recipes"
          className="p-5 rounded-2xl border transition hover:shadow-md flex items-center gap-4 group"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 transition group-hover:scale-110">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm font-serif">Recipe Matcher</h4>
            <p className="text-xs text-gray-500">Check planned meal ingredients</p>
          </div>
        </Link>

        <Link
          href="/history"
          className="p-5 rounded-2xl border transition hover:shadow-md flex items-center gap-4 group"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-700 transition group-hover:scale-110">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm font-serif">Scan History</h4>
            <p className="text-xs text-gray-500">Review past scans & detections</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
