'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Scale,
  ShoppingBag,
  Tags,
  Receipt,
  Camera,
  Users,
  Settings,
  Calculator,
  LogOut,
  Menu,
  X,
  Globe,
  Shield,
  Warehouse,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { LOCALE_LABELS, type Locale } from '@/i18n/dictionaries';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, t, locale, setLocale, signOut, isDemo, setDemoUser } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const navItems: NavItem[] = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/inventory', label: t.nav.inventory, icon: Package },
    { href: '/grading', label: t.nav.grading, icon: Scale },
    { href: '/sales', label: t.nav.sales, icon: ShoppingBag },
    { href: '/pricing', label: t.nav.pricing, icon: Tags, adminOnly: true },
    { href: '/expenses', label: t.nav.expenses, icon: Receipt },
    { href: '/photos', label: t.nav.photos, icon: Camera },
    { href: '/users', label: t.nav.users, icon: Users, adminOnly: true },
    { href: '/settings', label: t.nav.settings, icon: Settings, adminOnly: true },
  ];

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleLockToCalculator = async () => {
    await signOut();
    router.push('/');
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800/80 w-64 p-4">
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <span className="text-lg font-bold tracking-tight text-emerald-400">GreenScale</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isAdmin ? (
              <Shield className="w-3 h-3 text-emerald-400" />
            ) : (
              <Warehouse className="w-3 h-3 text-amber-400" />
            )}
            <span className="text-[11px] text-zinc-400">
              {isAdmin ? t.auth.roleAdmin : t.auth.roleWarehouse}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-4 border-t border-zinc-800/80 space-y-2">
        {isDemo && (
          <div className="flex gap-1.5 pb-1">
            <button
              type="button"
              onClick={() => setDemoUser('admin')}
              className={`flex-1 py-1 text-[11px] rounded-lg border cursor-pointer ${
                isAdmin
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('warehouse')}
              className={`flex-1 py-1 text-[11px] rounded-lg border cursor-pointer ${
                !isAdmin
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              Almacén
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800">
          <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
          <select
            aria-label="Language"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="bg-transparent text-xs text-zinc-200 w-full focus:outline-none cursor-pointer"
          >
            {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
              <option key={code} value={code} className="bg-zinc-900">
                {LOCALE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleLockToCalculator}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium transition-colors cursor-pointer"
        >
          <Calculator className="w-4 h-4" />
          <span>{t.nav.lockCalculator}</span>
        </button>

        <button
          type="button"
          onClick={handleLockToCalculator}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-400 hover:text-red-300 hover:bg-zinc-900 text-xs transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.auth.signOut}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#090d0b] text-zinc-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0">{SidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full">{SidebarContent}</div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/90 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-emerald-400 text-sm">GreenScale</span>
          <button
            type="button"
            onClick={handleLockToCalculator}
            title={t.nav.lockCalculator}
            className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300"
          >
            <Calculator className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

