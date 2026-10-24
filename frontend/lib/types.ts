export type FoodCategory =
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'meat and seafood'
  | 'eggs'
  | 'beverages'
  | 'grains and bread'
  | 'frozen food'
  | 'condiments'
  | 'snacks'
  | 'other';

export interface InventoryItem {
  id: number;
  name: string;
  normalized_name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  quantity_known: boolean;
  low_stock_threshold: number;
  preferred_restock_quantity: number | null;
  source_scan_id: number | null;
  purchase_date: string | null;
  expiry_date: string | null;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  created_at: string;
  updated_at: string;
}

export interface InventoryListResponse {
  total: number;
  items: InventoryItem[];
}

export interface GroceryItem {
  id: number;
  name: string;
  normalized_name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  source: 'manual' | 'low_stock' | 'recipe' | 'scan';
  created_at: string;
  updated_at: string;
}

export interface GroceryListResponse {
  total: number;
  completed_count: number;
  pending_count: number;
  items: GroceryItem[];
}

export interface ScanDetection {
  id: number;
  candidate_name: string;
  category: string;
  quantity_estimate: number | null;
  unit: string | null;
  confidence_level: 'high' | 'medium' | 'low';
  visible_attributes: string[];
  needs_review: boolean;
  user_confirmed: boolean;
  created_at: string;
}

export interface ScanRecord {
  id: number;
  scan_type: string;
  model_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  image_reference: string | null;
  notes: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  detections: ScanDetection[];
}

export interface AIStatus {
  connected: boolean;
  status: 'online' | 'unreachable' | 'error';
  base_url: string;
  configured_vision_model: string;
  configured_text_model: string;
  vision_model_installed: boolean;
  text_model_installed: boolean;
  installed_models: string[];
  error: string | null;
  vision_capability?: {
    model: string;
    supports_vision: boolean;
    family?: string;
    verified: boolean;
    error?: string;
  };
}

export interface RecipeIngredientInput {
  name: string;
  quantity?: number | null;
  unit?: string | null;
}

export interface IngredientComparisonResult {
  name: string;
  normalized_name: string;
  required_quantity: number | null;
  required_unit: string | null;
  inventory_quantity: number | null;
  inventory_unit: string | null;
  status: 'in_stock' | 'low_stock' | 'missing' | 'unit_mismatch';
  matched_inventory_name: string | null;
  shortage_quantity: number | null;
}

export interface RecipeCompareResponse {
  recipe_name: string;
  total_ingredients: number;
  missing_count: number;
  matched_count: number;
  results: IngredientComparisonResult[];
}

export interface SystemSettings {
  project_name: string;
  version: string;
  ollama_base_url: string;
  ollama_vision_model: string;
  ollama_text_model: string;
  ollama_timeout_seconds: number;
  max_upload_size_mb: number;
  allowed_image_types: string[];
  database_url: string;
  data_directory: string;
  upload_directory: string;
  auto_delete_images: boolean;
  default_low_stock_threshold: number;
}
