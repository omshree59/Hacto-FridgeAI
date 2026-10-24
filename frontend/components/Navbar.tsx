'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Refrigerator,
  Camera,
  ShoppingBag,
  ListTodo,
  ChefHat,
  History,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { AIStatusBadge } from './AIStatusBadge';

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Scan', href: '/scan', icon: Camera },
    { label: 'Inventory', href: '/inventory', icon: ShoppingBag },
    { label: 'Grocery List', href: '/grocery-list', icon: ListTodo },
    { label: 'Recipes', href: '/recipes', icon: ChefHat },
    { label: 'History', href: '/history', icon: History },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    );
  }, []);

  return (
    <header
      className="sticky top-0 z-30 w-full border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'rgba(var(--bg-surface), 0.85)',
        borderColor: 'var(--border-light)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="p-2 rounded-xl text-white shadow-xs transition-transform group-hover:scale-105"
              style={{ backgroundColor: 'var(--forest-800)' }}
            >
              <Refrigerator className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block leading-tight font-serif">
                FridgeFlow<span className="text-emerald-600 font-sans text-xs ml-1 font-bold uppercase tracking-widest">AI</span>
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-medium">
                Local-First Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-emerald-800 dark:hover:text-emerald-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            <span className="hidden xl:inline-block text-xs text-gray-500 font-medium">
              {currentDate}
            </span>

            {/* AI Status Badge */}
            <AIStatusBadge />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              style={{ borderColor: 'var(--border-light)' }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-b px-4 pt-2 pb-4 space-y-1"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-light)',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 text-emerald-600" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
