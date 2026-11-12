'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ShoppingBag, Sparkles, Lock } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import {
  createSale,
  getGradedBags,
  getLots,
  getPricingRules,
  getSales,
  getStrains,
} from '@/lib/data-service';
import { formatWeight } from '@/lib/utils';
import type {
  GradedBag,
  InventoryLot,
  PricingRule,
  Sale,
  SaleType,
  Strain,
} from '@/types/database';

export default function SalesPage() {
  const { profile, t, formatMoney } = useApp();
  const isAdmin = profile?.role === 'admin';

  const [bags, setBags] = useState<GradedBag[]>([]);
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<'bag' | 'bulk'>(isAdmin ? 'bag' : 'bulk');
  const [saleType, setSaleType] = useState<SaleType>(isAdmin ? 'retail' : 'wholesale');
  const [selectedBagId, setSelectedBagId] = useState('');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [quantityG, setQuantityG] = useState('250');
  const [unitPrice, setUnitPrice] = useState('0');
  const [totalPrice, setTotalPrice] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const applyBulkPrice = useCallback(
    (
      lotId: string,
      qtyStr: string,
      currentRules: PricingRule[] = rules,
      currentLots: InventoryLot[] = lots,
      currentStrains: Strain[] = strains
    ) => {
      const lot = currentLots.find((l) => l.id === lotId);
      if (!lot) return;
      const qty = parseFloat(qtyStr) || 0;
      const matchingWholesale = currentRules.find(
        (r) =>
          r.active &&
          r.rule_type === 'wholesale' &&
          r.strain_id === lot.strain_id &&
          r.weight_g === qty
      );
      if (matchingWholesale) {
        setTotalPrice(String(matchingWholesale.price));
        setUnitPrice(qty > 0 ? (matchingWholesale.price / qty).toFixed(2) : '0');
      } else {
        const strain = currentStrains.find((s) => s.id === lot.strain_id);
        const perG = strain ? Number(strain.price_per_gram) : 0;
        setUnitPrice(String(perG));
        setTotalPrice((perG * qty).toFixed(2));
      }
    },
    [rules, lots, strains]
  );

  const loadData = useCallback(async () => {
    try {
      const [b, l, st, r, s] = await Promise.all([
        getGradedBags(),
        getLots(),
        getStrains(),
        getPricingRules(),
        getSales(),
      ]);
      setBags(b);
      setLots(l);
      setStrains(st);
      setRules(r);
      setSales(s);
      const avail = b.filter((item) => item.status === 'available');
      if (avail.length > 0 && !selectedBagId) {
        setSelectedBagId(avail[0].id);
        if (isAdmin) {
          setUnitPrice(String(avail[0].price));
          setTotalPrice(String(avail[0].price));
        }
      }
      if (l.length > 0 && !selectedLotId) {
        setSelectedLotId(l[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedBagId, selectedLotId, isAdmin]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getGradedBags(),
      getLots(),
      getStrains(),
      getPricingRules(),
      getSales(),
    ])
      .then(([b, l, st, r, s]) => {
        if (!active) return;
        setBags(b);
        setLots(l);
        setStrains(st);
        setRules(r);
        setSales(s);
        const avail = b.filter((item) => item.status === 'available');
        if (avail.length > 0) {
          setSelectedBagId(avail[0].id);
          if (isAdmin) {
            setUnitPrice(String(avail[0].price));
            setTotalPrice(String(avail[0].price));
          }
        }
        if (l.length > 0) {
          setSelectedLotId(l[0].id);
          if (!isAdmin) {
            applyBulkPrice(l[0].id, '250', r, l, st);
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableBags = useMemo(
    () => bags.filter((b) => b.status === 'available'),
    [bags]
  );

  const selectedBag = useMemo(
    () => availableBags.find((b) => b.id === selectedBagId),
    [availableBags, selectedBagId]
  );

  const selectedLot = useMemo(
    () => lots.find((l) => l.id === selectedLotId),
    [lots, selectedLotId]
  );

  const applySpecialRule = (rule: PricingRule) => {
    setMode('bulk');
    setSaleType(rule.rule_type === 'wholesale' ? 'wholesale' : 'retail');
    if (rule.weight_g) setQuantityG(String(rule.weight_g));
    setTotalPrice(String(rule.price));
    if (rule.weight_g && rule.weight_g > 0) {
      setUnitPrice((rule.price / rule.weight_g).toFixed(2));
    }
    if (rule.description) setNotes(rule.description);
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const effectiveSaleType: SaleType = isAdmin ? saleType : 'wholesale';

      if (mode === 'bag' && selectedBag) {
        const lot = lots.find((l) => l.id === selectedBag.lot_id);
        await createSale({
          bag_id: selectedBag.id,
          lot_id: selectedBag.lot_id,
          strain_id: lot?.strain_id || strains[0]?.id || '',
          quantity_g: selectedBag.weight_g,
          unit_price: parseFloat(unitPrice) || selectedBag.price,
          total_price: parseFloat(totalPrice) || selectedBag.price,
          sale_type: effectiveSaleType,
          notes: notes.trim() || `Bolsa ${selectedBag.bag_type}`,
          sold_by: profile.id,
        });
      } else if (selectedLot) {
        const qty = parseFloat(quantityG) || 0;
        await createSale({
          bag_id: null,
          lot_id: selectedLot.id,
          strain_id: selectedLot.strain_id,
          quantity_g: qty,
          unit_price: parseFloat(unitPrice) || 0,
          total_price: parseFloat(totalPrice) || 0,
          sale_type: effectiveSaleType,
          notes: notes.trim() || undefined,
          sold_by: profile.id,
        });
      }

      setNotes('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;

  const specialRules = rules.filter((r) => r.active && (isAdmin || r.rule_type === 'wholesale'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.sales.title}</h1>
        <p className="text-sm text-zinc-400 mt-1">{t.sales.subtitle}</p>
      </div>

      {!isAdmin && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>{t.sales.warehouseWholesaleOnly}</span>
        </div>
      )}

      {/* Quick Specials / Wholesale Presets */}
      {specialRules.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="text-xs font-medium text-zinc-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.sales.specials}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {specialRules.map((rule) => (
              <button
                key={rule.id}
                type="button"
                onClick={() => applySpecialRule(rule)}
                className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 cursor-pointer"
              >
                <span className="font-semibold text-emerald-400">{formatMoney(rule.price)}</span>
                <span className="text-zinc-400 ml-1.5">
                  · {rule.description || `${rule.bag_type} (${rule.rule_type})`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* POS Form */}
      <form
        onSubmit={handleSaleSubmit}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4"
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('bag');
              if (selectedBag) {
                setUnitPrice(String(selectedBag.price));
                setTotalPrice(String(selectedBag.price));
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer ${
              mode === 'bag'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}
          >
            {t.sales.selectBag} ({availableBags.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('bulk');
              if (selectedLotId) applyBulkPrice(selectedLotId, quantityG);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer ${
              mode === 'bulk'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}
          >
            {t.sales.bulkSale}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mode === 'bag' ? (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t.sales.selectBag}</label>
              <select
                value={selectedBagId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedBagId(id);
                  const bag = availableBags.find((b) => b.id === id);
                  if (bag) {
                    setUnitPrice(String(bag.price));
                    setTotalPrice(String(bag.price));
                  }
                }}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                {availableBags.map((bag) => (
                  <option key={bag.id} value={bag.id}>
                    Bolsa {bag.bag_type} ({bag.weight_g}g) — {formatMoney(bag.price)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t.sales.selectLot}</label>
              <select
                value={selectedLotId}
                onChange={(e) => {
                  setSelectedLotId(e.target.value);
                  applyBulkPrice(e.target.value, quantityG);
                }}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.strain?.name || 'Producto'} — {l.supplier} ({formatWeight(l.actual_weight_g)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t.sales.saleType}</label>
            <select
              value={isAdmin ? saleType : 'wholesale'}
              disabled={!isAdmin}
              onChange={(e) => setSaleType(e.target.value as SaleType)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white disabled:opacity-60"
            >
              {isAdmin && <option value="retail">{t.sales.retail}</option>}
              <option value="wholesale">{t.sales.wholesale}</option>
            </select>
          </div>
        </div>

        {mode === 'bulk' && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Octavo (125g)', g: '125' },
                { label: 'Cuarto (250g)', g: '250' },
                { label: 'Medio (500g)', g: '500' },
                { label: 'Kilo (1000g)', g: '1000' },
              ].map((u) => (
                <button
                  key={u.g}
                  type="button"
                  onClick={() => {
                    setQuantityG(u.g);
                    if (selectedLotId) applyBulkPrice(selectedLotId, u.g);
                  }}
                  className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer"
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {mode === 'bulk' && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t.sales.quantityG}</label>
              <input
                type="number"
                step="0.1"
                required
                value={quantityG}
                onChange={(e) => {
                  setQuantityG(e.target.value);
                  if (selectedLotId) applyBulkPrice(selectedLotId, e.target.value);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t.sales.unitPrice}</label>
            <input
              type="number"
              step="0.01"
              required
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t.sales.totalPrice}</label>
            <input
              type="number"
              step="0.01"
              required
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-emerald-400 font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t.inventory.notes}</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving || (mode === 'bag' && !selectedBag) || (mode === 'bulk' && !selectedLot)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer disabled:opacity-60"
        >
          <ShoppingBag className="w-4 h-4" />
          {t.sales.registerSale}
        </button>
      </form>

      {/* Sales History */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">{t.sales.history}</h2>
        {sales.length === 0 ? (
          <p className="text-sm text-zinc-500">{t.app.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">{t.inventory.strain}</th>
                  <th className="py-2 pr-4">{t.sales.saleType}</th>
                  <th className="py-2 pr-4">{t.sales.quantityG}</th>
                  <th className="py-2 pr-4">{t.sales.totalPrice}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 pr-4 text-xs text-zinc-400">
                      {new Date(s.sold_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-200">
                      {s.strain?.name || 'Producto'}
                      {s.notes ? (
                        <span className="block text-xs text-zinc-500">{s.notes}</span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          s.sale_type === 'wholesale'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {s.sale_type === 'wholesale' ? t.sales.wholesale : t.sales.retail}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-300">{s.quantity_g} g</td>
                    <td className="py-2.5 pr-4 font-mono font-semibold text-emerald-400">
                      {formatMoney(s.total_price)}
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

