'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Save,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AIStatus, SystemSettings } from '@/lib/types';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Form fields
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [visionModel, setVisionModel] = useState('');
  const [textModel, setTextModel] = useState('');
  const [timeoutSeconds, setTimeoutSeconds] = useState(90);
  const [autoDeleteImages, setAutoDeleteImages] = useState(false);
  const [defaultThreshold, setDefaultThreshold] = useState(1.0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sets, ai] = await Promise.all([
        api.getSettings(),
        api.getAIStatus(),
      ]);
      setSettings(sets);
      setAIStatus(ai);

      setOllamaUrl(sets.ollama_base_url);
      setVisionModel(sets.ollama_vision_model);
      setTextModel(sets.ollama_text_model);
      setTimeoutSeconds(sets.ollama_timeout_seconds);
      setAutoDeleteImages(sets.auto_delete_images);
      setDefaultThreshold(sets.default_low_stock_threshold);
    } catch (err: any) {
      alert(`Failed to load settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(null);
      const res = await api.updateSettings({
        ollama_base_url: ollamaUrl,
        ollama_vision_model: visionModel,
        ollama_text_model: textModel,
        ollama_timeout_seconds: timeoutSeconds,
        auto_delete_images: autoDeleteImages,
        default_low_stock_threshold: defaultThreshold,
      });
      setSaveSuccess('Settings saved successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
      loadData();
    } catch (err: any) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (
      !confirm(
        'WARNING: This will erase all inventory items, scans, grocery lists, and uploaded photos from SQLite and disk. Are you sure?'
      )
    ) {
      return;
    }
    try {
      await api.resetData(true);
      alert('Local application data has been wiped.');
      window.location.reload();
    } catch (err: any) {
      alert(`Error resetting data: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <Badge variant="default">System Preferences</Badge>
        <h1 className="text-3xl font-extrabold font-serif mt-1">Settings & Local AI</h1>
        <p className="text-xs text-gray-500">
          Configure Ollama models, storage retention, low-stock thresholds, and privacy.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Ollama Live Status Card */}
      <Card className="p-6 border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2 font-bold font-serif text-base">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <span>Ollama Local Daemon Status</span>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Endpoint:</span>
              <span className="font-mono">{aiStatus?.base_url}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Service:</span>
              <Badge variant={aiStatus?.connected ? 'success' : 'danger'}>
                {aiStatus?.connected ? 'Connected (Online)' : 'Unreachable (Offline)'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Vision Model Installed:</span>
              <Badge variant={aiStatus?.vision_model_installed ? 'success' : 'warning'}>
                {aiStatus?.vision_model_installed ? 'Installed' : 'Not Pulled'}
              </Badge>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/2 dark:bg-white/2 border text-xs space-y-1" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Detected Ollama Models:
            </span>
            {aiStatus?.installed_models && aiStatus.installed_models.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {aiStatus.installed_models.map((m) => (
                  <span
                    key={m}
                    className="font-mono text-[10px] px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border"
                  >
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic">No models found in Ollama library</span>
            )}
          </div>
        </div>

        {/* Model Setup Terminal Instructions */}
        <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs space-y-1.5">
          <span className="font-semibold text-emerald-900 dark:text-emerald-300 block">
            Terminal Quick Commands:
          </span>
          <div className="space-y-1 font-mono text-[11px]">
            <p className="text-gray-600 dark:text-gray-300">Start Ollama daemon:</p>
            <code className="block p-1.5 rounded bg-black/5 dark:bg-white/5">
              ollama serve
            </code>
            <p className="text-gray-600 dark:text-gray-300 pt-1">Pull recommended vision model (Gemma 3 or LLaVA):</p>
            <code className="block p-1.5 rounded bg-black/5 dark:bg-white/5">
              ollama run gemma3:4b
            </code>
          </div>
        </div>
      </Card>

      {/* Configuration Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <Card className="p-6 border space-y-4">
          <h3 className="font-bold font-serif text-base pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            Model & Runtime Configuration
          </h3>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Ollama Base URL
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 font-mono text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Vision Model Name
              </label>
              <input
                type="text"
                value={visionModel}
                onChange={(e) => setVisionModel(e.target.value)}
                placeholder="e.g. gemma3:4b, llama3.2-vision"
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 font-mono text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Text Reasoning Model Name
              </label>
              <input
                type="text"
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                placeholder="e.g. gemma3:4b"
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 font-mono text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Inference Timeout (Seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseFloat(e.target.value) || 90)}
                className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                style={{ borderColor: 'var(--border-light)' }}
              />
            </div>
          </div>
        </Card>

        {/* Inventory Defaults & Image Retention */}
        <Card className="p-6 border space-y-4">
          <h3 className="font-bold font-serif text-base pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            Inventory & Privacy Rules
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Default Low-Stock Threshold
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={defaultThreshold}
                  onChange={(e) => setDefaultThreshold(parseFloat(e.target.value) || 1.0)}
                  className="w-32 p-2.5 rounded-xl border bg-white dark:bg-zinc-800 text-xs"
                  style={{ borderColor: 'var(--border-light)' }}
                />
                <span className="text-gray-500">
                  Items with quantity &le; this value trigger low-stock alerts.
                </span>
              </div>
            </div>

            <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoDeleteImages}
                  onChange={(e) => setAutoDeleteImages(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 block">
                    Auto-Delete Fridge Photos Immediately After Analysis
                  </span>
                  <span className="text-gray-500 block text-[11px]">
                    Increases privacy by purging the uploaded image file as soon as structured items are detected.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition hover:scale-102 flex items-center gap-2"
            style={{ backgroundColor: 'var(--forest-800)' }}
          >
            <Save className="w-4 h-4 text-emerald-300" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Storage and Data Wipe Section */}
      <Card className="p-6 border border-red-200 dark:border-red-900/40 space-y-4">
        <div className="flex items-center gap-2 text-red-600 font-bold font-serif text-base">
          <Trash2 className="w-5 h-5" />
          <span>Local Data Management</span>
        </div>

        <p className="text-xs text-gray-500">
          All your inventory and scans are stored locally in SQLite at{' '}
          <code className="font-mono bg-black/5 dark:bg-white/5 p-1 rounded">
            {settings?.database_url}
          </code>
          .
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={api.getExportInventoryUrl('json')}
            download
            className="px-3.5 py-2 rounded-xl border text-xs font-semibold hover:bg-black/5 flex items-center gap-1.5"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Complete Inventory JSON</span>
          </a>

          <button
            onClick={handleResetData}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 hover:bg-red-100 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Erase All Local Data</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
