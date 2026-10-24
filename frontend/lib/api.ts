import {
  AIStatus,
  GroceryItem,
  GroceryListResponse,
  InventoryItem,
  InventoryListResponse,
  RecipeCompareResponse,
  ScanRecord,
  SystemSettings,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'An unexpected error occurred.';
    try {
      const data = await res.json();
      errorDetail = data.detail || data.error || JSON.stringify(data);
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Health & AI Status
  async getHealth() {
    const res = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
    return handleResponse<{ status: string; app_name: string; version: string }>(res);
  },

  async getAIStatus(): Promise<AIStatus> {
    const res = await fetch(`${API_BASE}/api/ai/status`, { cache: 'no-store' });
    return handleResponse<AIStatus>(res);
  },

  // Scan & Detection
  async uploadScan(file: File, scanType = 'full_fridge', notes = ''): Promise<ScanRecord> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scan_type', scanType);
    if (notes) formData.append('notes', notes);

    const res = await fetch(`${API_BASE}/api/scan`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<ScanRecord>(res);
  },

  async getScans(): Promise<ScanRecord[]> {
    const res = await fetch(`${API_BASE}/api/scans`, { cache: 'no-store' });
    return handleResponse<ScanRecord[]>(res);
  },

  async getScan(id: number): Promise<ScanRecord> {
    const res = await fetch(`${API_BASE}/api/scans/${id}`, { cache: 'no-store' });
    return handleResponse<ScanRecord>(res);
  },

  async confirmScan(
    scanId: number,
    items: Array<{
      id: number;
      candidate_name?: string;
      category?: string;
      quantity_estimate?: number | null;
      unit?: string | null;
      user_confirmed: boolean;
      deleted?: boolean;
    }>
  ) {
    const res = await fetch(`${API_BASE}/api/scans/${scanId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scan_id: scanId, items }),
    });
    return handleResponse<{ message: string; reconciled_count: number }>(res);
  },

  async deleteScan(scanId: number, deleteImage = true) {
    const res = await fetch(`${API_BASE}/api/scans/${scanId}?delete_image=${deleteImage}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  getScanImageUrl(filename: string | null) {
    if (!filename) return null;
    return `${API_BASE}/api/scans/image/${encodeURIComponent(filename)}`;
  },

  // Inventory
  async getInventory(params?: {
    search?: string;
    category?: string;
    low_stock_only?: boolean;
    sort_by?: string;
    sort_order?: string;
    limit?: number;
    skip?: number;
  }): Promise<InventoryListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.low_stock_only) query.append('low_stock_only', 'true');
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.sort_order) query.append('sort_order', params.sort_order);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.skip) query.append('skip', String(params.skip));

    const res = await fetch(`${API_BASE}/api/inventory?${query.toString()}`, { cache: 'no-store' });
    return handleResponse<InventoryListResponse>(res);
  },

  async createInventoryItem(data: {
    name: string;
    category?: string;
    quantity?: number | null;
    unit?: string | null;
    low_stock_threshold?: number;
    preferred_restock_quantity?: number | null;
    purchase_date?: string | null;
    expiry_date?: string | null;
  }): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/api/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<InventoryItem>(res);
  },

  async updateInventoryItem(
    itemId: number,
    data: Partial<InventoryItem>
  ): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/api/inventory/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<InventoryItem>(res);
  },

  async deleteInventoryItem(itemId: number) {
    const res = await fetch(`${API_BASE}/api/inventory/${itemId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  // Grocery List
  async getGroceryList(category?: string, completed?: boolean): Promise<GroceryListResponse> {
    const query = new URLSearchParams();
    if (category) query.append('category', category);
    if (completed !== undefined) query.append('completed', String(completed));

    const res = await fetch(`${API_BASE}/api/grocery-list?${query.toString()}`, {
      cache: 'no-store',
    });
    return handleResponse<GroceryListResponse>(res);
  },

  async addGroceryItem(data: {
    name: string;
    category?: string;
    quantity?: number | null;
    unit?: string | null;
    notes?: string | null;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<GroceryItem> {
    const res = await fetch(`${API_BASE}/api/grocery-list/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<GroceryItem>(res);
  },

  async updateGroceryItem(itemId: number, data: Partial<GroceryItem>): Promise<GroceryItem> {
    const res = await fetch(`${API_BASE}/api/grocery-list/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<GroceryItem>(res);
  },

  async deleteGroceryItem(itemId: number) {
    const res = await fetch(`${API_BASE}/api/grocery-list/items/${itemId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  async clearCompletedGroceryItems() {
    const res = await fetch(`${API_BASE}/api/grocery-list/completed`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  async generateGroceryList(options?: {
    include_low_stock?: boolean;
    include_out_of_stock?: boolean;
    recipe_missing_items?: any[];
  }): Promise<GroceryItem[]> {
    const res = await fetch(`${API_BASE}/api/grocery-list/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || { include_low_stock: true, include_out_of_stock: true }),
    });
    return handleResponse<GroceryItem[]>(res);
  },

  getExportGroceryUrl(format: 'csv' | 'text' = 'csv') {
    return `${API_BASE}/api/grocery-list/export?format=${format}`;
  },

  getExportInventoryUrl(format: 'csv' | 'json' = 'csv') {
    return `${API_BASE}/api/export/inventory?format=${format}`;
  },

  // Recipes
  async compareRecipe(
    recipeName: string,
    ingredients: Array<{ name: string; quantity?: number | null; unit?: string | null }>
  ): Promise<RecipeCompareResponse> {
    const res = await fetch(`${API_BASE}/api/recipes/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe_name: recipeName, ingredients }),
    });
    return handleResponse<RecipeCompareResponse>(res);
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/api/settings`, { cache: 'no-store' });
    return handleResponse<SystemSettings>(res);
  },

  async updateSettings(data: Partial<SystemSettings>) {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; settings: SystemSettings }>(res);
  },

  async resetData(confirm = true) {
    const res = await fetch(`${API_BASE}/api/settings/reset-data?confirm=${confirm}`, {
      method: 'POST',
    });
    return handleResponse<{ message: string }>(res);
  },
};
