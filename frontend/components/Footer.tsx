import React from 'react';
import { ShieldCheck, HardDrive, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer
      className="w-full border-t mt-auto py-8 text-xs transition-colors"
      style={{
        backgroundColor: 'var(--bg-subtle)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--ink-500)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Local & Private</span>
          </div>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-gray-500" />
            <span>Local SQLite Persistence</span>
          </div>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-gray-500" />
            <span>Zero Remote Inference</span>
          </div>
        </div>

        <div className="text-center md:text-right">
          <p>
            FridgeFlow AI — Your fridge, decoded without cloud surveillance.
          </p>
        </div>
      </div>
    </footer>
  );
}
