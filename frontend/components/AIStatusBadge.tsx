'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AIStatus } from '@/lib/types';
import { Cpu, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function AIStatusBadge() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getAIStatus();
      setStatus(data);
    } catch {
      setStatus({
        connected: false,
        status: 'unreachable',
        base_url: 'http://localhost:11434',
        configured_vision_model: 'gemma3:4b',
        configured_text_model: 'gemma3:4b',
        vision_model_installed: false,
        text_model_installed: false,
        installed_models: [],
        error: 'Backend or Ollama service unreachable',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = status?.connected && status?.vision_model_installed;
  const isMissingModel = status?.connected && !status?.vision_model_installed;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-xs"
        style={{
          backgroundColor: isOnline
            ? 'var(--accent-success-bg)'
            : isMissingModel
            ? 'var(--accent-warning-bg)'
            : 'var(--accent-alert-bg)',
          borderColor: isOnline
            ? 'var(--accent-success-border)'
            : isMissingModel
            ? 'var(--accent-warning-border)'
            : 'var(--accent-alert-border)',
          color: isOnline
            ? 'var(--accent-success)'
            : isMissingModel
            ? 'var(--accent-warning)'
            : 'var(--accent-alert)',
        }}
        title="Click to view local AI engine details"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            loading ? 'animate-pulse bg-gray-400' : isOnline ? 'bg-emerald-500' : isMissingModel ? 'bg-amber-500' : 'bg-red-500'
          }`}
        />
        <Cpu className="w-3.5 h-3.5" />
        <span>
          {loading
            ? 'Checking AI...'
            : isOnline
            ? `Local AI Ready (${status?.configured_vision_model})`
            : isMissingModel
            ? `Model Missing (${status?.configured_vision_model})`
            : 'Ollama Offline'}
        </span>
      </button>

      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div
            className="absolute right-0 mt-2 w-80 p-4 rounded-xl shadow-xl z-50 text-sm border"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-light)',
              color: 'var(--ink-900)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2 font-semibold">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>Local AI Architecture</span>
              </div>
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                title="Refresh AI Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Service Runtime:</span>
                <span className="font-medium font-mono">{status?.base_url}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Connection Status:</span>
                <span className="font-semibold flex items-center gap-1">
                  {status?.connected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> Online
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 inline" /> Offline
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vision Model:</span>
                <span className="font-mono font-medium">{status?.configured_vision_model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vision Capable:</span>
                <span className="font-medium">
                  {status?.vision_capability?.supports_vision ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Privacy Status:</span>
                <span className="text-emerald-600 font-medium">100% Local (0 External APIs)</span>
              </div>

              {!status?.connected && (
                <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300">
                  <p className="font-semibold mb-1">How to start Ollama:</p>
                  <code className="block p-1 bg-black/10 rounded font-mono text-[11px] mb-1">
                    ollama serve
                  </code>
                  <p className="text-[11px]">Keep Ollama running in a terminal.</p>
                </div>
              )}

              {isMissingModel && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300">
                  <p className="font-semibold mb-1">Download vision model:</p>
                  <code className="block p-1 bg-black/10 rounded font-mono text-[11px] mb-1">
                    ollama run {status?.configured_vision_model}
                  </code>
                  <p className="text-[11px]">Recommended for local image understanding.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
