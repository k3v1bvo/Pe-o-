'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Receipt, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import {
  createExpense,
  deleteExpense,
  getExpenses,
  uploadImageFile,
} from '@/lib/data-service';
import type { Expense, ExpenseCategory } from '@/types/database';

export default function ExpensesPage() {
  const { profile, t, formatMoney } = useApp();
  const isAdmin = profile?.role === 'admin';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<'all' | ExpenseCategory>('all');

  const [category, setCategory] = useState<ExpenseCategory>('taxi');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getExpenses()
      .then((data) => {
        if (active) setExpenses(data);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      let receiptUrl: string | null = null;
      if (receiptFile) {
        receiptUrl = await uploadImageFile(receiptFile, 'greenscale/receipts');
      }
      await createExpense({
        category,
        amount: parseFloat(amount) || 0,
        description: description.trim(),
        receipt_url: receiptUrl,
        created_by: profile.id,
      });
      setAmount('');
      setDescription('');
      setReceiptFile(null);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const base = isAdmin
      ? expenses
      : expenses.filter((e) => e.created_by === profile?.id);
    if (filterCat === 'all') return base;
    return base.filter((e) => e.category === filterCat);
  }, [expenses, filterCat, isAdmin, profile?.id]);

  const totalAmount = useMemo(
    () => filtered.reduce((acc, e) => acc + Number(e.amount), 0),
    [filtered]
  );

  if (loading) return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;

  const categories = Object.keys(t.expenses.categories) as ExpenseCategory[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.expenses.title}</h1>
          <p className="text-sm text-zinc-400 mt-1">{t.expenses.subtitle}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-right">
          <div className="text-[11px] text-zinc-400">{t.expenses.totalExpenses}</div>
          <div className="text-lg font-bold font-mono text-rose-400">
            {formatMoney(totalAmount)}
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      <form
        onSubmit={handleCreate}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">{t.expenses.category}</label>
            <p className="text-[11px] text-zinc-500 mb-1.5">En qué área se usó el dinero.</p>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {t.expenses.categories[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">{t.expenses.amount}</label>
            <p className="text-[11px] text-zinc-500 mb-1.5">Cuánto dinero salió de caja.</p>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej: 150"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">{t.expenses.description}</label>
            <p className="text-[11px] text-zinc-500 mb-1.5">Detalle claro para control del Admin.</p>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: 100 bolsas ziploc, taxi centro..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{receiptFile ? receiptFile.name : t.expenses.receipt}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {saving ? t.app.uploading : t.expenses.newExpense}
          </button>
        </div>
      </form>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer border ${
            filterCat === 'all'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer border ${
              filterCat === cat
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            {t.expenses.categories[cat]}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-500">{t.app.noData}</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filtered.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Receipt className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white">{exp.description}</div>
                    <div className="text-xs text-zinc-500">
                      {t.expenses.categories[exp.category]} ·{' '}
                      {new Date(exp.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {exp.receipt_url && (
                    <a
                      href={exp.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky-400 underline"
                    >
                      Recibo
                    </a>
                  )}
                  <span className="font-mono font-semibold text-rose-400 text-sm">
                    -{formatMoney(exp.amount)}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteExpense(exp.id);
                        await loadData();
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

