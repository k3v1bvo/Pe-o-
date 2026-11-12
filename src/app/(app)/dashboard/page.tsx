'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Package,
  Scale,
  ShoppingBag,
  Camera,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useApp } from '@/components/providers/app-provider';
import { getExpenses, getGradedBags, getLots, getSales } from '@/lib/data-service';
import { formatWeight } from '@/lib/utils';
import type { Expense, GradedBag, InventoryLot, Sale } from '@/types/database';

export default function DashboardPage() {
  const { profile, t, formatMoney } = useApp();
  const isAdmin = profile?.role === 'admin';

  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [bags, setBags] = useState<GradedBag[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [l, b, s, e] = await Promise.all([
          getLots(),
          getGradedBags(),
          getSales(),
          getExpenses(),
        ]);
        setLots(l);
        setBags(b);
        setSales(s);
        setExpenses(e);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySales = sales
      .filter((s) => s.sold_at.slice(0, 10) === todayStr)
      .reduce((acc, s) => acc + Number(s.total_price), 0);
    const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total_price), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const totalWeightG = lots.reduce((acc, l) => acc + Number(l.actual_weight_g), 0);
    const totalShrinkageG = lots.reduce((acc, l) => acc + Number(l.shrinkage_g), 0);
    const availableBags = bags.filter((b) => b.status === 'available');

    const bagCounts = {
      '50': availableBags.filter((b) => b.bag_type === '50').length,
      '30': availableBags.filter((b) => b.bag_type === '30').length,
      '100': availableBags.filter((b) => b.bag_type === '100').length,
      custom: availableBags.filter((b) => b.bag_type === 'custom').length,
    };

    return {
      todaySales,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalWeightG,
      totalShrinkageG,
      availableBagsCount: availableBags.length,
      bagCounts,
    };
  }, [lots, bags, sales, expenses]);

  const chartData = useMemo(() => {
    const days: Record<string, { day: string; sales: number; expenses: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { day: key.slice(5), sales: 0, expenses: 0 };
    }
    sales.forEach((s) => {
      const key = s.sold_at.slice(0, 10);
      if (days[key]) days[key].sales += Number(s.total_price);
    });
    expenses.forEach((e) => {
      const key = e.created_at.slice(0, 10);
      if (days[key]) days[key].expenses += Number(e.amount);
    });
    return Object.values(days);
  }, [sales, expenses]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 rounded-xl bg-white/[0.05]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="h-28 rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  // WAREHOUSE RESTRICTED VIEW (NO REVENUE / PROFIT / RETAIL PRICES)
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {t.nav.dashboard}
          </h1>
          <p className="text-sm text-amber-300/90 mt-1">{t.dashboard.warehouseRestricted}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="obsidian-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>{t.dashboard.availableStock}</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Package className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-white mt-3">
              {formatWeight(stats.totalWeightG)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">{lots.length} lotes</p>
          </div>

          <div className="obsidian-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>{t.dashboard.lowStockAlerts}</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Scale className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-white mt-3">
              {stats.availableBagsCount} {t.dashboard.bagsAvailable}
            </div>
            <p className="text-xs text-zinc-500 mt-1 tabular-nums">
              50: {stats.bagCounts['50']} · 30: {stats.bagCounts['30']} · 100:{' '}
              {stats.bagCounts['100']}
            </p>
          </div>

          <div className="obsidian-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>{t.dashboard.totalShrinkage}</span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              </div>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-orange-200 mt-3">
              {formatWeight(stats.totalShrinkageG)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/inventory', icon: Package, label: t.nav.inventory, tone: 'text-emerald-400' },
            { href: '/grading', icon: Scale, label: t.nav.grading, tone: 'text-amber-400' },
            { href: '/sales', icon: ShoppingBag, label: t.sales.wholesale, tone: 'text-teal-400' },
            { href: '/photos', icon: Camera, label: t.nav.photos, tone: 'text-sky-400' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="obsidian-card hover:border-white/20 rounded-2xl p-5 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${item.tone}`} />
                  <span className="font-medium text-white text-sm">{item.label}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-200 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // FULL ADMIN DASHBOARD
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {t.dashboard.title}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">{t.dashboard.subtitle}</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.todaySales}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-white mt-3">
            {formatMoney(stats.todaySales)}
          </div>
        </div>

        <div className="obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.totalRevenue}</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-teal-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-white mt-3">
            {formatMoney(stats.totalRevenue)}
          </div>
        </div>

        <div className="obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.totalExpenses}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-rose-300 mt-3">
            {formatMoney(stats.totalExpenses)}
          </div>
        </div>

        <div className="obsidian-card rounded-2xl p-5 !border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] via-[#0d1410] to-[#0a0f0c]">
          <div className="flex items-center justify-between text-emerald-300/80 text-xs font-medium">
            <span>{t.dashboard.netProfit}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div
            className={`text-2xl font-semibold tabular-nums mt-3 ${
              stats.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}
          >
            {formatMoney(stats.netProfit)}
          </div>
        </div>

        <div className="obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.availableStock}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-white mt-3">
            {formatWeight(stats.totalWeightG)}
          </div>
        </div>

        <div className="obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.totalShrinkage}</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <div className="text-2xl font-semibold tabular-nums text-orange-300 mt-3">
            {formatWeight(stats.totalShrinkageG)}
          </div>
        </div>
      </div>

      {/* Chart + Bag Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 obsidian-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-zinc-100 mb-4">{t.dashboard.salesChart}</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
                  </linearGradient>
                  <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    backgroundColor: '#0c110e',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="sales" name={t.nav.sales} fill="url(#salesGrad)" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="expenses"
                  name={t.nav.expenses}
                  fill="url(#expensesGrad)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="obsidian-card rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-100">{t.dashboard.lowStockAlerts}</h2>
          <div className="space-y-2.5">
            {(['50', '30', '100', 'custom'] as const).map((type) => (
              <div
                key={type}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-white/[0.025] border border-white/[0.06]"
              >
                <span className="text-sm text-zinc-300">
                  {type === 'custom' ? t.grading.bagCustom : `Bolsa de ${type}`}
                </span>
                <span className="text-sm font-semibold tabular-nums text-emerald-400">
                  {stats.bagCounts[type]} {t.dashboard.bagsAvailable}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="obsidian-card rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-zinc-100 mb-3">{t.dashboard.recentSales}</h2>
        {sales.length === 0 ? (
          <p className="text-sm text-zinc-500">{t.app.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 border-b border-white/[0.07]">
                <tr>
                  <th className="py-2.5 pr-4 font-medium">{t.inventory.strain}</th>
                  <th className="py-2.5 pr-4 font-medium">{t.sales.saleType}</th>
                  <th className="py-2.5 pr-4 font-medium">{t.sales.quantityG}</th>
                  <th className="py-2.5 pr-4 font-medium">{t.sales.totalPrice}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {sales.slice(0, 6).map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 text-zinc-100 font-medium">
                      {sale.strain?.name || 'Producto'}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border ${
                          sale.sale_type === 'wholesale'
                            ? 'bg-amber-500/12 border-amber-500/25 text-amber-300'
                            : 'bg-emerald-500/12 border-emerald-500/25 text-emerald-300'
                        }`}
                      >
                        {sale.sale_type === 'wholesale' ? t.sales.wholesale : t.sales.retail}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-300 tabular-nums">{sale.quantity_g} g</td>
                    <td className="py-3 pr-4 font-semibold tabular-nums text-emerald-400">
                      {formatMoney(sale.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
