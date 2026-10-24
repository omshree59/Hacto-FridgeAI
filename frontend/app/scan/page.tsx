'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Upload,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Info,
  ShieldCheck,
  Check,
  Edit2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ScanRecord, ScanDetection, FoodCategory } from '@/lib/types';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';

const SCAN_CATEGORIES = [
  { id: 'full_fridge', label: 'Full Fridge' },
  { id: 'freezer', label: 'Freezer' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'custom', label: 'Custom' },
];

const FOOD_CATEGORIES: FoodCategory[] = [
  'vegetables',
  'fruits',
  'dairy',
  'meat and seafood',
  'eggs',
  'beverages',
  'grains and bread',
  'frozen food',
  'condiments',
  'snacks',
  'other',
];

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scan input states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanType, setScanType] = useState('full_fridge');
  const [scanNotes, setScanNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Scanning progress states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);

  // Detection review states
  const [scanRecord, setScanRecord] = useState<ScanRecord | null>(null);
  const [editableDetections, setEditableDetections] = useState<
    Array<ScanDetection & { deleted?: boolean }>
  >([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  const handleFileChange = (file: File) => {
    setScanError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setScanError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setScanError('Image size exceeds 15MB limit.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleResetScan = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setScanRecord(null);
    setEditableDetections([]);
    setScanError(null);
    setConfirmSuccess(null);
  };

  const handleStartScan = async () => {
    if (!selectedFile) return;

    try {
      setIsScanning(true);
      setScanError(null);

      // Stage progression feedback
      setScanStage('1. Preparing and optimizing image...');
      await new Promise((r) => setTimeout(r, 400));

      setScanStage('2. Connecting to local AI model runtime...');
      await new Promise((r) => setTimeout(r, 400));

      setScanStage('3. Identifying groceries & visible food items...');

      const result = await api.uploadScan(selectedFile, scanType, scanNotes);

      setScanStage('4. Organizing detections & confidence validation...');
      await new Promise((r) => setTimeout(r, 300));

      setScanRecord(result);
      setEditableDetections(
        result.detections.map((d) => ({
          ...d,
          user_confirmed: !d.needs_review,
        }))
      );
    } catch (err: any) {
      setScanError(
        err.message ||
          'Failed to complete local scan. Verify Ollama is running with your configured vision model.'
      );
    } finally {
      setIsScanning(false);
      setScanStage('');
    }
  };

  const handleUpdateDetection = (
    id: number,
    field: keyof ScanDetection,
    value: any
  ) => {
    setEditableDetections((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleDeleteDetection = (id: number) => {
    setEditableDetections((prev) =>
      prev.map((d) => (d.id === id ? { ...d, deleted: true } : d))
    );
  };

  const handleAddCustomDetection = () => {
    const tempId = Date.now();
    const newItem: ScanDetection & { deleted?: boolean } = {
      id: tempId,
      candidate_name: 'New Item',
      category: 'other',
      quantity_estimate: 1,
      unit: 'pcs',
      confidence_level: 'high',
      visible_attributes: ['Manually added by user'],
      needs_review: false,
      user_confirmed: true,
      created_at: new Date().toISOString(),
    };
    setEditableDetections((prev) => [newItem, ...prev]);
  };

  const handleConfirmInventory = async () => {
    if (!scanRecord) return;
    try {
      setIsConfirming(true);
      const itemsToConfirm = editableDetections
        .filter((d) => !d.deleted)
        .map((d) => ({
          id: d.id,
          candidate_name: d.candidate_name,
          category: d.category,
          quantity_estimate: d.quantity_estimate,
          unit: d.unit,
          user_confirmed: true,
          deleted: false,
        }));

      const res = await api.confirmScan(scanRecord.id, itemsToConfirm);
      setConfirmSuccess(res.message);
      setTimeout(() => {
        router.push('/inventory');
      }, 1500);
    } catch (err: any) {
      alert(`Error confirming inventory: ${err.message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Title */}
      <div>
        <Badge variant="success">Local Vision Scanner</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-serif mt-1">
          Scan My Fridge
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Capture or upload a fridge photo. The locally running vision AI parses ingredients and estimates quantities.
        </p>
      </div>

      {/* If Scan in Review Mode */}
      {scanRecord && (
        <div className="space-y-6">
          {confirmSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">{confirmSuccess}</p>
                <p className="text-xs">Redirecting to your updated inventory...</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <h2 className="text-2xl font-bold font-serif">AI Detection Review</h2>
              <p className="text-xs text-gray-500">
                Review and correct detections before saving to your persistent inventory.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddCustomDetection}
                className="px-3.5 py-2 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5"
                style={{ borderColor: 'var(--border-light)' }}
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Add Missing Item</span>
              </button>

              <button
                onClick={handleConfirmInventory}
                disabled={isConfirming}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition hover:scale-102 flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--forest-800)' }}
              >
                <Check className="w-4 h-4" />
                <span>{isConfirming ? 'Saving to Inventory...' : 'Confirm Inventory'}</span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Scanned Image Card */}
            <div className="lg:col-span-5 space-y-3">
              <Card className="p-3 border overflow-hidden">
                <div className="text-xs font-medium text-gray-500 mb-2 px-1 flex justify-between items-center">
                  <span>Scanned Image</span>
                  <Badge variant="default">{scanRecord.scan_type}</Badge>
                </div>
                <div className="relative rounded-xl overflow-hidden aspect-4/3 bg-black/5 flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Fridge scan"
                      className="w-full h-full object-cover"
                    />
                  ) : scanRecord.image_reference ? (
                    <img
                      src={api.getScanImageUrl(scanRecord.image_reference) || ''}
                      alt="Fridge scan"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs">Image purged per retention policy</div>
                  )}
                </div>
                <div className="mt-3 px-1 text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="font-mono">{scanRecord.model_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Detected items:</span>
                    <span className="font-semibold">{editableDetections.filter((d) => !d.deleted).length}</span>
                  </div>
                </div>
              </Card>

              <button
                onClick={handleResetScan}
                className="w-full py-2 rounded-xl border text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center gap-1.5"
                style={{ borderColor: 'var(--border-light)' }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Discard and Scan New Photo</span>
              </button>
            </div>

            {/* Detections List */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>Candidate Detections ({editableDetections.filter((d) => !d.deleted).length})</span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Orange border = Needs review
                </span>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {editableDetections
                  .filter((d) => !d.deleted)
                  .map((detection) => {
                    const isUncertain = detection.needs_review || detection.confidence_level !== 'high';
                    return (
                      <div
                        key={detection.id}
                        className="p-4 rounded-xl border transition-all space-y-3 shadow-xs"
                        style={{
                          backgroundColor: isUncertain ? 'var(--accent-warning-bg)' : 'var(--bg-surface)',
                          borderColor: isUncertain ? 'var(--accent-warning-border)' : 'var(--border-light)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={detection.candidate_name}
                              onChange={(e) =>
                                handleUpdateDetection(detection.id, 'candidate_name', e.target.value)
                              }
                              className="font-bold text-sm bg-transparent border-b border-dashed border-gray-400 dark:border-gray-600 focus:outline-none focus:border-emerald-600 w-full"
                              placeholder="Ingredient Name"
                            />
                            {detection.visible_attributes && detection.visible_attributes.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {detection.visible_attributes.map((attr, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                                  >
                                    {attr}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant={
                                detection.confidence_level === 'high'
                                  ? 'success'
                                  : detection.confidence_level === 'medium'
                                  ? 'warning'
                                  : 'danger'
                              }
                            >
                              {detection.confidence_level}
                            </Badge>

                            <button
                              onClick={() => handleDeleteDetection(detection.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition"
                              title="Delete detection"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Editable Category, Quantity, Unit */}
                        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-0.5">Category</label>
                            <select
                              value={detection.category}
                              onChange={(e) =>
                                handleUpdateDetection(detection.id, 'category', e.target.value)
                              }
                              className="w-full px-2 py-1 rounded-lg border bg-white dark:bg-zinc-800 text-xs"
                              style={{ borderColor: 'var(--border-light)' }}
                            >
                              {FOOD_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 block mb-0.5">Quantity</label>
                            <input
                              type="number"
                              step="any"
                              value={detection.quantity_estimate ?? ''}
                              onChange={(e) =>
                                handleUpdateDetection(
                                  detection.id,
                                  'quantity_estimate',
                                  e.target.value === '' ? null : parseFloat(e.target.value)
                                )
                              }
                              placeholder="Unknown"
                              className="w-full px-2 py-1 rounded-lg border bg-white dark:bg-zinc-800 text-xs"
                              style={{ borderColor: 'var(--border-light)' }}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 block mb-0.5">Unit</label>
                            <input
                              type="text"
                              value={detection.unit ?? ''}
                              onChange={(e) =>
                                handleUpdateDetection(
                                  detection.id,
                                  'unit',
                                  e.target.value || null
                                )
                              }
                              placeholder="pcs, L, pack"
                              className="w-full px-2 py-1 rounded-lg border bg-white dark:bg-zinc-800 text-xs"
                              style={{ borderColor: 'var(--border-light)' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If Not in Review Mode: Image Picker & Upload Section */}
      {!scanRecord && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Upload Dropzone */}
            <Card
              className={`p-8 border-2 border-dashed text-center transition-all ${
                dragActive
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'hover:border-emerald-500/50'
              }`}
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative max-w-md mx-auto aspect-4/3 rounded-2xl overflow-hidden border shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Selected fridge preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleResetScan}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 mx-auto flex items-center justify-center">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg font-serif">Drop your fridge photo here</h3>
                    <p className="text-xs text-gray-500">
                      Supports JPEG, PNG, and WebP (up to 15MB)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs"
                      style={{ backgroundColor: 'var(--forest-800)' }}
                    >
                      Browse Files
                    </button>

                    <label className="px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5"
                      style={{ borderColor: 'var(--border-light)' }}>
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Take Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
            </Card>

            {/* Error Message */}
            {scanError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Scan Failed</span>
                </div>
                <p>{scanError}</p>
                <div className="p-2 bg-red-100/50 dark:bg-red-900/30 rounded font-mono text-[11px]">
                  Tip: Ensure Ollama is running (`ollama serve`) with a vision model like `ollama run gemma3:4b`.
                </div>
              </div>
            )}

            {/* Staged Scan Button / Progress */}
            {isScanning ? (
              <Card className="p-6 border text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm font-serif">Analyzing Fridge Photo Locally</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    {scanStage}
                  </p>
                </div>
                <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                  Running local vision inference with Ollama. Depending on your GPU/CPU, this takes 3-10 seconds.
                </p>
              </Card>
            ) : (
              <button
                onClick={handleStartScan}
                disabled={!selectedFile}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-101 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--forest-800)' }}
              >
                <Sparkles className="w-5 h-5 text-emerald-300" />
                <span>Start Local Vision Analysis</span>
              </button>
            )}
          </div>

          {/* Options Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5 border space-y-4">
              <h3 className="font-bold text-sm font-serif pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                Scan Options
              </h3>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-2">
                  Scan Location
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SCAN_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setScanType(cat.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition ${
                        scanType === cat.id
                          ? 'bg-emerald-900/10 border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'border-gray-200 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">
                  Optional Scan Notes
                </label>
                <textarea
                  value={scanNotes}
                  onChange={(e) => setScanNotes(e.target.value)}
                  placeholder="e.g. Scanned right after grocery shopping"
                  className="w-full p-2.5 rounded-xl border text-xs bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  style={{ borderColor: 'var(--border-light)' }}
                  rows={3}
                />
              </div>

              <div className="p-3 rounded-xl bg-black/2 dark:bg-white/2 border text-xs text-gray-500 space-y-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Privacy First</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your image is processed purely on this machine by your local Ollama daemon. No telemetry, no external AI cloud APIs.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
