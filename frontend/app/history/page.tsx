'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  ExternalLink,
  Camera,
  Layers,
  Calendar,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ScanRecord } from '@/lib/types';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

  // Compare mode
  const [compareIds, setCompareIds] = useState<number[]>([]);

  const loadScans = async () => {
    try {
      setLoading(true);
      const data = await api.getScans();
      setScans(data);
    } catch (err: any) {
      alert(`Error loading scan history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  const handleDeleteScan = async (scanId: number) => {
    if (!confirm('Are you sure you want to delete this scan and its saved image?')) return;
    try {
      await api.deleteScan(scanId, true);
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      if (selectedScan?.id === scanId) setSelectedScan(null);
    } catch (err: any) {
      alert(`Error deleting scan: ${err.message}`);
    }
  };

  const toggleCompareId = (id: number) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((cid) => cid !== id));
    } else {
      if (compareIds.length >= 2) {
        setCompareIds([compareIds[1], id]);
      } else {
        setCompareIds([...compareIds, id]);
      }
    }
  };

  const comparedScans = scans.filter((s) => compareIds.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <Badge variant="info">Historical Records</Badge>
          <h1 className="text-3xl font-extrabold font-serif mt-1">Scan History</h1>
          <p className="text-xs text-gray-500">
            Review previous scans, compare detections over time, and manage image storage.
          </p>
        </div>

        {compareIds.length === 2 && (
          <button
            onClick={() => setCompareIds([])}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold hover:bg-black/5"
          >
            Clear Comparison Selection
          </button>
        )}
      </div>

      {/* Compare View if 2 scans selected */}
      {comparedScans.length === 2 && (
        <Card className="p-6 border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="font-bold text-base font-serif">
              Scan Comparison: #{comparedScans[0].id} vs #{comparedScans[1].id}
            </h3>
            <span className="text-xs text-gray-500">Comparing detected grocery items</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {comparedScans.map((s) => (
              <div key={s.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">
                    Scan #{s.id} &bull; {new Date(s.created_at).toLocaleDateString()}
                  </span>
                  <Badge variant="default">{s.scan_type}</Badge>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {s.detections.map((d) => (
                    <div
                      key={d.id}
                      className="p-2 rounded-lg border text-xs flex justify-between bg-white dark:bg-zinc-800"
                    >
                      <span className="font-medium">{d.candidate_name}</span>
                      <span className="text-gray-500">
                        {d.quantity_estimate ? `${d.quantity_estimate} ${d.unit || ''}` : 'Unknown qty'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Scans List */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Loading scan history...</span>
        </div>
      ) : scans.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 space-y-3">
          <History className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-base font-serif">No scans on record</h3>
          <p className="text-xs text-gray-500">
            Photos you scan will appear here along with their detected ingredients and confidence records.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {scans.map((scan) => {
            const isComparingThis = compareIds.includes(scan.id);
            return (
              <Card
                key={scan.id}
                className={`p-4 border transition hover:shadow-md flex flex-col justify-between ${
                  isComparingThis ? 'ring-2 ring-emerald-600' : ''
                }`}
              >
                <div>
                  {/* Image Thumbnail */}
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-black/5 mb-3 border">
                    {scan.image_reference ? (
                      <img
                        src={api.getScanImageUrl(scan.image_reference) || ''}
                        alt="Scan preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        Image purged
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge variant={scan.status === 'completed' ? 'success' : 'danger'}>
                        {scan.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(scan.created_at).toLocaleDateString()}
                      </span>
                      <span className="capitalize">{scan.scan_type}</span>
                    </div>

                    <h4 className="font-bold text-sm font-serif">
                      Scan #{scan.id} &bull; {scan.detections.length} items detected
                    </h4>

                    {scan.notes && (
                      <p className="text-[11px] text-gray-500 line-clamp-1 italic">
                        &quot;{scan.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t mt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    onClick={() => toggleCompareId(scan.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      isComparingThis
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {isComparingThis ? 'Comparing' : 'Compare'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedScan(scan)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleDeleteScan(scan.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition"
                      title="Delete scan record and photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Scan Detail Modal */}
      <Modal
        isOpen={selectedScan !== null}
        onClose={() => setSelectedScan(null)}
        title={`Scan Record #${selectedScan?.id || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedScan && (
          <div className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-black/5 border">
                {selectedScan.image_reference ? (
                  <img
                    src={api.getScanImageUrl(selectedScan.image_reference) || ''}
                    alt="Scan photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image file stored
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Scan Type:</span>
                  <span className="font-semibold capitalize">{selectedScan.scan_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Model Name:</span>
                  <span className="font-mono font-medium">{selectedScan.model_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge variant={selectedScan.status === 'completed' ? 'success' : 'danger'}>
                    {selectedScan.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timestamp:</span>
                  <span>{new Date(selectedScan.created_at).toLocaleString()}</span>
                </div>
                {selectedScan.notes && (
                  <div className="pt-2">
                    <span className="text-gray-500 block mb-0.5">Notes:</span>
                    <p className="p-2 rounded-lg bg-black/5 dark:bg-white/5">{selectedScan.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <h4 className="font-bold text-sm font-serif mb-2">
                Detected Items ({selectedScan.detections.length})
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {selectedScan.detections.map((d) => (
                  <div
                    key={d.id}
                    className="p-2.5 rounded-xl border flex items-center justify-between bg-white dark:bg-zinc-800"
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    <div>
                      <span className="font-semibold">{d.candidate_name}</span>
                      <span className="text-gray-500 text-[11px] block capitalize">
                        {d.category} &bull; {d.quantity_estimate ? `${d.quantity_estimate} ${d.unit || ''}` : 'Unknown qty'}
                      </span>
                    </div>
                    <Badge variant={d.confidence_level === 'high' ? 'success' : 'warning'}>
                      {d.confidence_level}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
