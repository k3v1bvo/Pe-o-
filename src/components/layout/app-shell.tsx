'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Scale,
  ShoppingBag,
  HandCoins,
  Tags,
  Receipt,
  Camera,
  Users,
  Settings,
  KeyRound,
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
import { BrandLogo } from '@/components/ui/brand-logo';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  allowedRoles?: ('admin' | 'warehouse' | 'seller' | 'consignee')[];
}

const CONSIGNEE_ALLOWED_PATHS = ['/consignments', '/account'];
const SELLER_ALLOWED_PATHS = ['/sales', '/account'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, t, locale, setLocale, signOut, isDemo, setDemoUser } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isSeller = profile?.role === 'seller';
  const isConsignee = profile?.role === 'consignee';

  useEffect(() => {
    if (isConsignee && !CONSIGNEE_ALLOWED_PATHS.some((p) => pathname.startsWith(p))) {
      router.replace('/consignments');
    } else if (isSeller && !SELLER_ALLOWED_PATHS.some((p) => pathname.startsWith(p))) {
      router.replace('/sales');
    }
  }, [isConsignee, isSeller, pathname, router]);

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'warehouse'],
    },
    {
      href: '/inventory',
      label: t.nav.inventory,
      icon: Package,
      allowedRoles: ['admin', 'warehouse'],
    },
    {
      href: '/grading',
      label: t.nav.grading,
      icon: Scale,
      allowedRoles: ['admin', 'warehouse'],
    },
    {
      href: '/sales',
      label: t.nav.sales,
      icon: ShoppingBag,
      allowedRoles: ['admin', 'warehouse', 'seller'],
    },
    {
      href: '/consignments',
      label: t.nav.consignments,
      icon: HandCoins,
      allowedRoles: ['admin', 'warehouse', 'consignee'],
    },
    { href: '/pricing', label: t.nav.pricing, icon: Tags, adminOnly: true },
    {
      href: '/expenses',
      label: t.nav.expenses,
      icon: Receipt,
      allowedRoles: ['admin', 'warehouse'],
    },
    {
      href: '/photos',
      label: t.nav.photos,
      icon: Camera,
      allowedRoles: ['admin', 'warehouse'],
    },
    { href: '/users', label: t.nav.users, icon: Users, adminOnly: true },
    { href: '/settings', label: t.nav.settings, icon: Settings, adminOnly: true },
    { href: '/account', label: t.nav.account, icon: KeyRound },
  ];

  const visibleNav = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.allowedRoles && profile?.role && !item.allowedRoles.includes(profile.role)) {
      return false;
    }
    return true;
  });
  const currentTitle = visibleNav.find((item) => item.href === pathname)?.label || 'GreenScale';
  const roleLabel = isAdmin
    ? t.auth.roleAdmin
    : isSeller
    ? t.auth.roleSeller
    : isConsignee
    ? t.auth.roleConsignee
    : t.auth.roleWarehouse;

  const handleLockToCalculator = async () => {
    await signOut();
    router.push('/');
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[#080c0a] border-r border-white/[0.07] w-[264px] p-4">
      <div className="flex items-center justify-between mb-5 px-1.5 pt-1">
        <BrandLogo size="md" />
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Role Identity Pill */}
      <div className="mb-5 px-3 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isAdmin
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : isSeller
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/25'
              : isConsignee
              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
          }`}
        >
          {isAdmin ? (
            <Shield className="w-4 h-4" />
          ) : isSeller ? (
            <ShoppingBag className="w-4 h-4" />
          ) : isConsignee ? (
            <HandCoins className="w-4 h-4" />
          ) : (
            <Warehouse className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-zinc-100 truncate">
            {profile?.name || profile?.email || roleLabel}
          </div>
          <div className="text-[11px] text-zinc-400 truncate">{roleLabel}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-0.5">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                active
                  ? 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-400" />
              )}
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  active ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 mt-4 border-t border-white/[0.07] space-y-2">
        {isDemo && (
          <div className="flex gap-1.5 pb-1">
            <button
              type="button"
              onClick={() => setDemoUser('admin')}
              className={`flex-1 py-1.5 text-[11px] font-medium rounded-xl border cursor-pointer transition-colors ${
                isAdmin
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/[0.03] border-white/[0.07] text-zinc-400'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('warehouse')}
              className={`flex-1 py-1.5 text-[11px] font-medium rounded-xl border cursor-pointer transition-colors ${
                !isAdmin
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/[0.03] border-white/[0.07] text-zinc-400'
              }`}
            >
              Almacén
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07]">
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
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-sm font-medium transition-colors cursor-pointer"
        >
          <Calculator className="w-4 h-4" />
          <span>{t.nav.lockCalculator}</span>
        </button>

        <button
          type="button"
          onClick={handleLockToCalculator}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-400 hover:text-rose-300 hover:bg-white/[0.04] text-xs transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.auth.signOut}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex bg-[#060807] text-zinc-100 relative">
      {/* Subtle Ambient Backdrop */}
      <div className="vault-grid fixed inset-0 opacity-30 pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen z-20">{SidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full">{SidebarContent}</div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Desktop Top Utility Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 h-16 border-b border-white/[0.06] bg-[#060807]/85 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-sm font-medium text-zinc-200">{currentTitle}</span>
          </div>
          <button
            type="button"
            onClick={handleLockToCalculator}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{t.nav.lockCalculator}</span>
          </button>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-[#080c0a]/90 backdrop-blur-xl sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BrandLogo size="sm" />
          <button
            type="button"
            onClick={handleLockToCalculator}
            title={t.nav.lockCalculator}
            aria-label={t.nav.lockCalculator}
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
