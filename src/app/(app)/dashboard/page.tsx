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
    return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;
  }

  // WAREHOUSE RESTRICTED VIEW (NO REVENUE / PROFIT / RETAIL PRICES)
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.nav.dashboard}</h1>
          <p className="text-sm text-amber-300/90 mt-1">{t.dashboard.warehouseRestricted}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>{t.dashboard.availableStock}</span>
              <Package className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {formatWeight(stats.totalWeightG)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">{lots.length} lotes</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>{t.dashboard.lowStockAlerts}</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {stats.availableBagsCount} {t.dashboard.bagsAvailable}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              50: {stats.bagCounts['50']} · 30: {stats.bagCounts['30']} · 100: {stats.bagCounts['100']}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>{t.dashboard.totalShrinkage}</span>
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {formatWeight(stats.totalShrinkageG)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/inventory"
            className="bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl p-5 transition-colors flex items-center gap-3"
          >
            <Package className="w-6 h-6 text-emerald-400" />
            <span className="font-medium text-white">{t.nav.inventory}</span>
          </Link>
          <Link
            href="/grading"
            className="bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl p-5 transition-colors flex items-center gap-3"
          >
            <Scale className="w-6 h-6 text-amber-400" />
            <span className="font-medium text-white">{t.nav.grading}</span>
          </Link>
          <Link
            href="/sales"
            className="bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl p-5 transition-colors flex items-center gap-3"
          >
            <ShoppingBag className="w-6 h-6 text-teal-400" />
            <span className="font-medium text-white">{t.sales.wholesale}</span>
          </Link>
          <Link
            href="/photos"
            className="bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl p-5 transition-colors flex items-center gap-3"
          >
            <Camera className="w-6 h-6 text-sky-400" />
            <span className="font-medium text-white">{t.nav.photos}</span>
          </Link>
        </div>
      </div>
    );
  }

  // FULL ADMIN DASHBOARD
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.dashboard.title}</h1>
        <p className="text-sm text-zinc-400 mt-1">{t.dashboard.subtitle}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.todaySales}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {formatMoney(stats.todaySales)}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.totalRevenue}</span>
            <ShoppingBag className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {formatMoney(stats.totalRevenue)}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.totalExpenses}</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300 mt-2">
            {formatMoney(stats.totalExpenses)}
          </div>
        </div>

        <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.netProfit}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div
            className={`text-2xl font-bold mt-2 ${
              stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(stats.netProfit)}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.availableStock}</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {formatWeight(stats.totalWeightG)}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>{t.dashboard.totalShrinkage}</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-300 mt-2">
            {formatWeight(stats.totalShrinkageG)}
          </div>
        </div>
      </div>

      {/* Chart + Bag Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">{t.dashboard.salesChart}</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="sales" name={t.nav.sales} fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="expenses"
                  name={t.nav.expenses}
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-200">{t.dashboard.lowStockAlerts}</h2>
          <div className="space-y-3">
            {(['50', '30', '100', 'custom'] as const).map((type) => (
              <div
                key={type}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800"
              >
                <span className="text-sm text-zinc-300">
                  {type === 'custom' ? t.grading.bagCustom : `Bolsa de ${type}`}
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {stats.bagCounts[type]} {t.dashboard.bagsAvailable}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">{t.dashboard.recentSales}</h2>
        {sales.length === 0 ? (
          <p className="text-sm text-zinc-500">{t.app.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-2 pr-4">{t.inventory.strain}</th>
                  <th className="py-2 pr-4">{t.sales.saleType}</th>
                  <th className="py-2 pr-4">{t.sales.quantityG}</th>
                  <th className="py-2 pr-4">{t.sales.totalPrice}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {sales.slice(0, 6).map((sale) => (
                  <tr key={sale.id}>
                    <td className="py-2.5 pr-4 text-zinc-200">
                      {sale.strain?.name || 'Producto'}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          sale.sale_type === 'wholesale'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {sale.sale_type === 'wholesale' ? t.sales.wholesale : t.sales.retail}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-300">{sale.quantity_g} g</td>
                    <td className="py-2.5 pr-4 font-semibold text-emerald-400">
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

