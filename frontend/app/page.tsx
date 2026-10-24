'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  ShieldCheck,
  Cpu,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Refrigerator,
  Layers,
  ShoppingBag,
  ListOrdered,
  ScanLine,
  Sliders,
  Check,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'detect' | 'list'>('detect');

  return (
    <div className="space-y-24 py-6 md:py-12">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider shadow-xs"
          style={{
            backgroundColor: 'var(--accent-success-bg)',
            borderColor: 'var(--accent-success-border)',
            color: 'var(--accent-success)',
          }}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>100% Local Inference &bull; Zero Cloud Uploads</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-serif text-emerald-950 dark:text-emerald-100">
          Your fridge. <span className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-300 dark:decoration-emerald-700 decoration-wavy decoration-2">Decoded.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Snap a photo. Know what you have. Shop only what you need.
          Powered locally by Ollama and vision models running on your machine.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/scan"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 hover:scale-102 hover:shadow-xl"
            style={{ backgroundColor: 'var(--forest-800)' }}
          >
            <Camera className="w-5 h-5 text-emerald-300" />
            <span>Scan My Fridge</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold border text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <Refrigerator className="w-4 h-4 text-emerald-600" />
            <span>Open Dashboard</span>
          </Link>
        </div>
      </section>

      {/* Interactive Feature Transition Showcase */}
      <section className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif mb-2">
            From Camera Snap to Smart Shopping Run
          </h2>
          <p className="text-sm text-gray-500">
            See how FridgeFlow AI decodes groceries and updates your shopping list deterministically.
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'scan'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300'
              }`}
            >
              1. Fridge Snap
            </button>
            <button
              onClick={() => setActiveTab('detect')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'detect'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300'
              }`}
            >
              2. AI Detection & Review
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'list'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300'
              }`}
            >
              3. Smart Grocery List
            </button>
          </div>
        </div>

        <Card className="p-6 md:p-8 overflow-hidden border">
          {activeTab === 'scan' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative rounded-xl overflow-hidden aspect-4/3 bg-linear-to-br from-emerald-950 via-slate-900 to-zinc-900 flex items-center justify-center text-white border border-emerald-800/40 p-6">
                <div className="text-center space-y-4">
                  <div className="inline-block p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <ScanLine className="w-12 h-12 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg font-serif">Simulated Fridge Camera</h4>
                    <p className="text-xs text-emerald-200/80">Scanning produce shelf & dairy compartment</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-700/50">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Resolution: 1280&times;960 &bull; EXIF Corrected</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Badge variant="success">Step 1: Local Preprocessing</Badge>
                <h3 className="text-2xl font-bold font-serif">Zero-Lag Safe Processing</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  Upload photos or capture right from your phone. Your image is auto-rotated via EXIF orientation, resized preserving aspect ratio using Pillow, and encoded for local vision processing without leaving your machine.
                </p>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Supports JPEG, PNG, and WebP up to 15MB
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Optional automatic image purge after detection
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'detect' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-3">
                <Badge variant="info">Step 2: Structured Output</Badge>
                <h3 className="text-2xl font-bold font-serif">Editable Detection Review</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  FridgeFlow AI classifies ingredients with confidence scores. Uncertain items are flagged with <code>needs_review</code> so you never get hallucinated inventory numbers.
                </p>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Only user-confirmed items are written into persistent SQLite storage.</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: 'Organic Roma Tomatoes', cat: 'vegetables', qty: '4 pcs', conf: 'high', review: false },
                  { name: 'Whole Milk Carton', cat: 'dairy', qty: '1 L', conf: 'high', review: false },
                  { name: 'Greek Plain Yogurt', cat: 'dairy', qty: 'Unknown', conf: 'medium', review: true },
                  { name: 'Baby Spinach Bag', cat: 'vegetables', qty: '1 pack', conf: 'high', review: false },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border flex items-center justify-between transition-all"
                    style={{
                      backgroundColor: item.review ? 'var(--accent-warning-bg)' : 'var(--bg-surface-elevated)',
                      borderColor: item.review ? 'var(--accent-warning-border)' : 'var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{item.name}</span>
                        {item.review && <Badge variant="warning">Needs Review</Badge>}
                      </div>
                      <span className="text-xs text-gray-500 capitalize">{item.cat} &bull; {item.qty}</span>
                    </div>
                    <Badge variant={item.conf === 'high' ? 'success' : 'warning'}>
                      {item.conf} confidence
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Badge variant="citrus">Step 3: Low-Stock Intelligence</Badge>
                <h3 className="text-2xl font-bold font-serif">Smart Prioritized Grocery List</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  The shopping list engine compares current stock against your custom thresholds. Low-stock and out-of-stock essentials are queued automatically into aisle-friendly categories.
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/grocery-list"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-800 text-white text-xs font-semibold"
                  >
                    <span>View Shopping Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              <div className="space-y-2 border rounded-xl p-4 bg-black/2 dark:bg-white/2" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Produce</div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded border flex items-center justify-center bg-emerald-600 text-white border-emerald-600">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-medium line-through text-gray-400">Bell Peppers (2 pcs)</span>
                  </div>
                  <Badge variant="default">Purchased</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded border border-gray-400" />
                    <span className="text-xs font-medium">Garlic Bulb (1 pc)</span>
                  </div>
                  <Badge variant="danger">Out of Stock</Badge>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-4 mb-2">Dairy & Eggs</div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded border border-gray-400" />
                    <span className="text-xs font-medium">Oat Milk (1 L)</span>
                  </div>
                  <Badge variant="warning">Low Stock</Badge>
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* 3 Step Explanation */}
      <section className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-serif">How It Works</h2>
          <p className="text-sm text-gray-500 mt-2">Designed for zero cognitive overhead when planning meals</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 border">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: 'var(--forest-800)' }}>
              <Camera className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">01 &bull; Snap</div>
            <h3 className="text-lg font-bold font-serif">Take a Quick Photo</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Open your fridge, freezer, or pantry door and snap a picture. Drag and drop from your computer or use your phone camera.
            </p>
          </Card>

          <Card className="p-6 space-y-4 border">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: 'var(--forest-800)' }}>
              <Cpu className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">02 &bull; Analyze</div>
            <h3 className="text-lg font-bold font-serif">Local Vision Model</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Ollama parses the image with Gemma vision models directly on your hardware. Items are structured into validated JSON with quantities and units.
            </p>
          </Card>

          <Card className="p-6 space-y-4 border">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: 'var(--forest-800)' }}>
              <ShoppingBag className="w-6 h-6 text-emerald-300" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">03 &bull; Shop</div>
            <h3 className="text-lg font-bold font-serif">Smart Restock Run</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Low-stock alerts dynamically create a checklist for your next grocery trip. Check off items in real time with Shopping Mode.
            </p>
          </Card>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-5xl mx-auto rounded-3xl p-8 md:p-12 border shadow-sm" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-2xl mb-8">
          <Badge variant="success">Engineered for Reliability</Badge>
          <h2 className="text-3xl font-bold font-serif mt-2">No Hallucinations. No Cloud Fees.</h2>
          <p className="text-sm text-gray-500 mt-2">
            Why FridgeFlow AI is built differently from generic AI chatbot wrappers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Privacy Guaranteed
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your home food photos are personal. They are never sent to external AI APIs or third-party servers.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Deterministic Inventory Logic
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Reconciles duplicate scans safely. If you already have milk, scanning it again proposes an update rather than creating duplicates.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-emerald-600" />
              Recipe Ingredient Matcher
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Plan meals and compare needed ingredients against what you actually have. Only missing items are added to your grocery list.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <h4 className="font-bold text-base font-serif">Ready to organize your kitchen?</h4>
            <p className="text-xs text-gray-500">Free, open-source, and runs on your computer.</p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl font-semibold text-white text-sm shadow-md transition hover:scale-102"
            style={{ backgroundColor: 'var(--forest-800)' }}
          >
            Launch Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
