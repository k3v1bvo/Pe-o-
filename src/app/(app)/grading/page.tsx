'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Scale, Plus } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { createGradedBagsBatch, getGradedBags, getLots } from '@/lib/data-service';
import { formatWeight } from '@/lib/utils';
import {
  DEFAULT_BAG_PRESETS,
  type BagType,
  type GradedBag,
  type InventoryLot,
} from '@/types/database';

export default function GradingPage() {
  const { profile, t, formatMoney } = useApp();
  const isAdmin = profile?.role === 'admin';

  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [bags, setBags] = useState<GradedBag[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLotId, setSelectedLotId] = useState('');
  const [bagType, setBagType] = useState<BagType>('50');
  const [weightG, setWeightG] = useState('27');
  const [price, setPrice] = useState('50');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [l, b] = await Promise.all([getLots(), getGradedBags()]);
      setLots(l);
      setBags(b);
      if (l.length > 0 && !selectedLotId) {
        setSelectedLotId(l[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedLotId]);

  useEffect(() => {
    let active = true;
    Promise.all([getLots(), getGradedBags()])
      .then(([l, b]) => {
        if (!active) return;
        setLots(l);
        setBags(b);
        if (l.length > 0) {
          setSelectedLotId((prev) => prev || l[0].id);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleBagTypeChange = (type: BagType) => {
    setBagType(type);
    const preset = DEFAULT_BAG_PRESETS.find((p) => p.type === type);
    if (preset) {
      setWeightG(String(preset.defaultWeightG));
      setPrice(String(preset.defaultPrice));
    }
  };

  const selectedLot = useMemo(
    () => lots.find((l) => l.id === selectedLotId),
    [lots, selectedLotId]
  );

  const lotBags = useMemo(
    () => bags.filter((b) => b.lot_id === selectedLotId),
    [bags, selectedLotId]
  );

  const totalGradedG = useMemo(
    () => lotBags.reduce((acc, b) => acc + Number(b.weight_g), 0),
    [lotBags]
  );

  const handleCreateBags = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotId || !profile) return;
    setSaving(true);
    try {
      await createGradedBagsBatch({
        lot_id: selectedLotId,
        bag_type: bagType,
        weight_g: parseFloat(weightG) || 0,
        price: isAdmin ? parseFloat(price) || 0 : Number(price) || 0,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        graded_by: profile.id,
      });
      setQuantity('1');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.grading.title}</h1>
        <p className="text-sm text-zinc-400 mt-1">{t.grading.subtitle}</p>
      </div>

      {/* Lot Selector + Metrics */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t.grading.selectLot}</label>
          <select
            value={selectedLotId}
            onChange={(e) => setSelectedLotId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
          >
            {lots.map((l) => (
              <option key={l.id} value={l.id}>
                {l.strain?.name || 'Producto'} — {l.supplier} ({formatWeight(l.actual_weight_g)})
              </option>
            ))}
          </select>
        </div>

        {selectedLot && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
              <div className="text-[11px] text-zinc-500">{t.inventory.actualWeight}</div>
              <div className="font-mono font-bold text-white mt-0.5">
                {formatWeight(selectedLot.actual_weight_g)}
              </div>
            </div>
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
              <div className="text-[11px] text-zinc-500">{t.grading.totalGraded}</div>
              <div className="font-mono font-bold text-emerald-400 mt-0.5">
                {formatWeight(totalGradedG)} ({lotBags.length} bolsas)
              </div>
            </div>
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
              <div className="text-[11px] text-zinc-500">{t.grading.remainingShrinkage}</div>
              <div className="font-mono font-bold text-amber-300 mt-0.5">
                {formatWeight(Number(selectedLot.actual_weight_g) - totalGradedG)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Graded Bags Form */}
      <form
        onSubmit={handleCreateBags}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4"
      >
        <div>
          <h2 className="text-sm font-semibold text-white">Armar Bolsas para Venta (50tas / 30s / 100s)</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Elige el tamaño de bolsa que estás empaquetando, el peso real por bolsa y cuántas armaste.
            Se descontarán automáticamente del stock del lote.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { type: '50', label: t.grading.bag50 },
              { type: '30', label: t.grading.bag30 },
              { type: '100', label: t.grading.bag100 },
              { type: 'custom', label: t.grading.bagCustom },
            ] as const
          ).map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => handleBagTypeChange(opt.type)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                bagType === opt.type
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              {t.grading.weightPerBag}
            </label>
            <p className="text-[11px] text-zinc-500 mb-1.5">Gramos que pesa 1 bolsa individual.</p>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={weightG}
                onChange={(e) => setWeightG(e.target.value)}
                placeholder="Ej: 27"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                g
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">{t.grading.quantity}</label>
            <p className="text-[11px] text-zinc-500 mb-1.5">Cuántas bolsas iguales armaste ahora.</p>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ej: 10"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>

          {isAdmin ? (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">{t.grading.bagPrice}</label>
              <p className="text-[11px] text-zinc-500 mb-1.5">Precio de venta al público de cada bolsa.</p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ej: 50"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-end pb-2 text-xs text-zinc-500">
              {t.grading.priceHiddenWarehouse}
            </div>
          )}
        </div>

        {(() => {
          const totalToPack = (parseFloat(weightG) || 0) * (parseInt(quantity, 10) || 0);
          const remaining = selectedLot ? Number(selectedLot.actual_weight_g) - totalGradedG : 0;
          const afterPack = remaining - totalToPack;
          const overLimit = selectedLot ? afterPack < 0 : false;
          return (
            <div
              className={`flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-xs ${
                overLimit
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-white/[0.03] border-white/[0.08] text-zinc-300'
              }`}
            >
              <span>
                Total a empaquetar:{' '}
                <strong className="text-emerald-300 font-mono">{totalToPack.toFixed(1)} g</strong> (
                {parseInt(quantity, 10) || 0} bolsas × {parseFloat(weightG) || 0}g)
              </span>
              {selectedLot && (
                <span className="font-mono">
                  {overLimit
                    ? `Excede disponible por ${Math.abs(afterPack).toFixed(1)}g`
                    : `Quedarán ${afterPack.toFixed(1)}g sin embolsar`}
                </span>
              )}
            </div>
          );
        })()}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving || !selectedLotId}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {t.grading.createBags}
          </button>
        </div>
      </form>

      {/* Graded Bags Grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>
              {t.grading.availableBags}:{' '}
              {lotBags.filter((b) => b.status === 'available').length} · {t.grading.soldBags}:{' '}
              {lotBags.filter((b) => b.status === 'sold').length}
            </span>
          </h2>
        </div>

        {lotBags.length === 0 ? (
          <p className="text-sm text-zinc-500">{t.app.noData}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {lotBags.map((bag) => (
              <div
                key={bag.id}
                className={`rounded-xl p-3 border text-xs ${
                  bag.status === 'available'
                    ? 'bg-zinc-950 border-zinc-800'
                    : 'bg-zinc-950/40 border-zinc-800/40 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">
                    {bag.bag_type === 'custom' ? 'Custom' : `Bolsa ${bag.bag_type}`}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      bag.status === 'available'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {bag.status}
                  </span>
                </div>
                <div className="font-mono text-zinc-400 mt-1">{bag.weight_g} g</div>
                {isAdmin && (
                  <div className="font-mono font-semibold text-emerald-400 mt-1">
                    {formatMoney(bag.price)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

