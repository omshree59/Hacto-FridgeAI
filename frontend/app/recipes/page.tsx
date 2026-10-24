'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChefHat,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ListPlus,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api';
import { RecipeCompareResponse, RecipeIngredientInput } from '@/lib/types';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';

const RECIPE_PRESETS: {
  name: string;
  ingredients: RecipeIngredientInput[];
}[] = [
  {
    name: 'Caprese Salad',
    ingredients: [
      { name: 'Tomatoes', quantity: 3, unit: 'pcs' },
      { name: 'Mozzarella', quantity: 1, unit: 'pack' },
      { name: 'Fresh Basil', quantity: 1, unit: 'bunch' },
      { name: 'Olive Oil', quantity: 1, unit: 'bottle' },
    ],
  },
  {
    name: 'Avocado Toast & Poached Egg',
    ingredients: [
      { name: 'Avocado', quantity: 2, unit: 'pcs' },
      { name: 'Eggs', quantity: 2, unit: 'pcs' },
      { name: 'Sourdough Bread', quantity: 1, unit: 'pack' },
      { name: 'Butter', quantity: 1, unit: 'pack' },
    ],
  },
  {
    name: 'Classic Chicken Stir Fry',
    ingredients: [
      { name: 'Chicken Breast', quantity: 500, unit: 'g' },
      { name: 'Bell Pepper', quantity: 2, unit: 'pcs' },
      { name: 'Broccoli', quantity: 1, unit: 'pcs' },
      { name: 'Soy Sauce', quantity: 1, unit: 'bottle' },
      { name: 'Garlic', quantity: 3, unit: 'pcs' },
    ],
  },
  {
    name: 'Berry Banana Protein Smoothie',
    ingredients: [
      { name: 'Banana', quantity: 2, unit: 'pcs' },
      { name: 'Strawberries', quantity: 1, unit: 'pack' },
      { name: 'Whole Milk', quantity: 1, unit: 'L' },
      { name: 'Greek Yogurt', quantity: 1, unit: 'pack' },
    ],
  },
];

export default function RecipeHelperPage() {
  const router = useRouter();
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>([
    { name: '', quantity: 1, unit: 'pcs' },
  ]);
  const [comparisonResult, setComparisonResult] = useState<RecipeCompareResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  const handleAddRow = () => {
    setIngredients((prev) => [...prev, { name: '', quantity: 1, unit: 'pcs' }]);
  };

  const handleRemoveRow = (index: number) => {
    setIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateRow = (
    index: number,
    field: keyof RecipeIngredientInput,
    val: any
  ) => {
    setIngredients((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  const handleSelectPreset = (preset: typeof RECIPE_PRESETS[0]) => {
    setRecipeName(preset.name);
    setIngredients(preset.ingredients);
    setComparisonResult(null);
    setAddedMessage(null);
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    const validIngredients = ingredients.filter((i) => i.name.trim() !== '');
    if (!recipeName.trim() || validIngredients.length === 0) {
      alert('Please enter a recipe name and at least one ingredient.');
      return;
    }

    try {
      setIsComparing(true);
      setAddedMessage(null);
      const res = await api.compareRecipe(recipeName, validIngredients);
      setComparisonResult(res);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setIsComparing(false);
    }
  };

  const handleAddMissingToGrocery = async () => {
    if (!comparisonResult) return;
    try {
      setIsAddingToList(true);
      let count = 0;
      for (const res of comparisonResult.results) {
        if (res.status === 'missing' || res.status === 'low_stock') {
          await api.addGroceryItem({
            name: res.name,
            quantity: res.shortage_quantity || res.required_quantity || 1,
            unit: res.required_unit || res.inventory_unit,
            notes: `Needed for recipe: ${comparisonResult.recipe_name}`,
            priority: 'high',
          });
          count++;
        }
      }
      setAddedMessage(`Successfully added ${count} missing/low ingredients to your Grocery List!`);
    } catch (err: any) {
      alert(`Could not add items to list: ${err.message}`);
    } finally {
      setIsAddingToList(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <Badge variant="citrus">Recipe Ingredient Helper</Badge>
        <h1 className="text-3xl font-extrabold font-serif mt-1">
          Plan Meals Against Inventory
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Compare planned recipe ingredients against confirmed fridge stock.
          Instantly add what you need to your shopping list.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          <span>Quick Recipe Presets:</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {RECIPE_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleSelectPreset(p)}
              className="px-3 py-1.5 rounded-xl border text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-500 transition shadow-xs"
              style={{ borderColor: 'var(--border-light)' }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Recipe & Ingredients Input */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-6 border space-y-4">
            <h3 className="font-bold text-base font-serif pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              Recipe Ingredients
            </h3>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Recipe Name
              </label>
              <input
                type="text"
                placeholder="e.g. Grandma's Minestrone"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="w-full p-2.5 rounded-xl border text-xs bg-white dark:bg-zinc-800"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                Required Ingredients
              </label>

              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ingredient Name"
                    value={ing.name}
                    onChange={(e) => handleUpdateRow(idx, 'name', e.target.value)}
                    className="flex-1 p-2 rounded-xl border text-xs bg-white dark:bg-zinc-800"
                    style={{ borderColor: 'var(--border-light)' }}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Qty"
                    value={ing.quantity ?? ''}
                    onChange={(e) =>
                      handleUpdateRow(
                        idx,
                        'quantity',
                        e.target.value === '' ? null : parseFloat(e.target.value)
                      )
                    }
                    className="w-18 p-2 rounded-xl border text-xs bg-white dark:bg-zinc-800"
                    style={{ borderColor: 'var(--border-light)' }}
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={ing.unit ?? ''}
                    onChange={(e) => handleUpdateRow(idx, 'unit', e.target.value)}
                    className="w-20 p-2 rounded-xl border text-xs bg-white dark:bg-zinc-800"
                    style={{ borderColor: 'var(--border-light)' }}
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Ingredient</span>
              </button>
            </div>

            <button
              onClick={handleCompare}
              disabled={isComparing}
              className="w-full py-3 rounded-xl text-xs font-semibold text-white shadow-md transition hover:scale-102 flex items-center justify-center gap-2 mt-4"
              style={{ backgroundColor: 'var(--forest-800)' }}
            >
              <ChefHat className="w-4 h-4 text-emerald-300" />
              <span>{isComparing ? 'Comparing...' : 'Compare With My Fridge'}</span>
            </button>
          </Card>
        </div>

        {/* Right: Comparison Results */}
        <div className="lg:col-span-6 space-y-4">
          {addedMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{addedMessage}</span>
              </div>
              <button
                onClick={() => router.push('/grocery-list')}
                className="font-bold underline shrink-0 hover:text-emerald-900"
              >
                View List &rarr;
              </button>
            </div>
          )}

          {comparisonResult ? (
            <Card className="p-6 border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h3 className="font-bold text-base font-serif">Comparison Breakdown</h3>
                  <p className="text-xs text-gray-500">
                    {comparisonResult.matched_count} in stock &bull; {comparisonResult.missing_count} missing
                  </p>
                </div>

                <Badge variant={comparisonResult.missing_count === 0 ? 'success' : 'warning'}>
                  {comparisonResult.missing_count === 0 ? 'Ready to Cook!' : 'Ingredients Missing'}
                </Badge>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {comparisonResult.results.map((res, i) => {
                  const isInStock = res.status === 'in_stock';
                  const isLow = res.status === 'low_stock';
                  const isMissing = res.status === 'missing';

                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl border flex items-center justify-between text-xs"
                      style={{
                        backgroundColor: isInStock
                          ? 'var(--accent-success-bg)'
                          : isLow
                          ? 'var(--accent-warning-bg)'
                          : 'var(--accent-alert-bg)',
                        borderColor: isInStock
                          ? 'var(--accent-success-border)'
                          : isLow
                          ? 'var(--accent-warning-border)'
                          : 'var(--accent-alert-border)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        {isInStock ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : isLow ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                        )}

                        <div>
                          <span className="font-bold block capitalize">{res.name}</span>
                          <span className="text-[11px] text-gray-500">
                            Required: {res.required_quantity} {res.required_unit || ''}
                            {res.inventory_quantity !== null && (
                              <> &bull; In Fridge: {res.inventory_quantity} {res.inventory_unit || ''}</>
                            )}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant={isInStock ? 'success' : isLow ? 'warning' : 'danger'}
                      >
                        {isInStock
                          ? 'In Stock'
                          : isLow
                          ? `Short by ${res.shortage_quantity}`
                          : 'Missing'}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {comparisonResult.missing_count > 0 && (
                <button
                  onClick={handleAddMissingToGrocery}
                  disabled={isAddingToList}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition hover:scale-102 flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: 'var(--forest-800)' }}
                >
                  <ListPlus className="w-4 h-4 text-emerald-300" />
                  <span>
                    {isAddingToList
                      ? 'Adding Items...'
                      : 'Add Missing Items to Grocery List'}
                  </span>
                </button>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center border-dashed border-2 space-y-2">
              <ChefHat className="w-10 h-10 text-gray-400 mx-auto" />
              <h4 className="font-bold text-sm font-serif">No Recipe Compared Yet</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Pick a quick preset above or type your planned ingredients, then click &quot;Compare With My Fridge&quot;.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
