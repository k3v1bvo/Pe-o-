'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tags, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import {
  createPricingRule,
  createStrain,
  deletePricingRule,
  getPricingRules,
  getStrains,
  updateStrain,
} from '@/lib/data-service';
import type { PricingBagType, PricingRule, PricingRuleType, Strain } from '@/types/database';

export default function PricingPage() {
  const { profile, t, formatMoney } = useApp();
  const router = useRouter();
  const isAdmin = profile?.role === 'admin';

  const [strains, setStrains] = useState<Strain[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Strain Form
  const [strainName, setStrainName] = useState('');
  const [strainDesc, setStrainDesc] = useState('');
  const [pricePerGram, setPricePerGram] = useState('15');

  // Rule Form
  const [ruleStrainId, setRuleStrainId] = useState('');
  const [ruleType, setRuleType] = useState<PricingRuleType>('retail');
  const [bagType, setBagType] = useState<PricingBagType>('50');
  const [rulePrice, setRulePrice] = useState('50');
  const [ruleWeight, setRuleWeight] = useState('27');
  const [ruleDesc, setRuleDesc] = useState('');

  useEffect(() => {
    if (profile && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [profile, isAdmin, router]);

  const loadData = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([getStrains(), getPricingRules()]);
      setStrains(s);
      setRules(r);
      if (s.length > 0 && !ruleStrainId) setRuleStrainId(s[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [ruleStrainId]);

  useEffect(() => {
    let active = true;
    Promise.all([getStrains(), getPricingRules()])
      .then(([s, r]) => {
        if (!active) return;
        setStrains(s);
        setRules(r);
        if (s.length > 0) {
          setRuleStrainId((prev) => prev || s[0].id);
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

  const handleAddStrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strainName.trim()) return;
    await createStrain({
      name: strainName.trim(),
      description: strainDesc.trim() || undefined,
      price_per_gram: parseFloat(pricePerGram) || 0,
    });
    setStrainName('');
    setStrainDesc('');
    await loadData();
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleStrainId) return;
    await createPricingRule({
      strain_id: ruleStrainId,
      rule_type: ruleType,
      bag_type: bagType,
      price: parseFloat(rulePrice) || 0,
      weight_g: parseFloat(ruleWeight) || null,
      description: ruleDesc.trim() || undefined,
    });
    setRuleDesc('');
    await loadData();
  };

  if (!isAdmin || loading) return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.pricing.title}</h1>
        <p className="text-sm text-zinc-400 mt-1">{t.pricing.subtitle}</p>
      </div>

      {/* Strains Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">{t.pricing.strainsTitle}</h2>

        <form onSubmit={handleAddStrain} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            value={strainName}
            onChange={(e) => setStrainName(e.target.value)}
            placeholder={t.pricing.strainName}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            type="text"
            value={strainDesc}
            onChange={(e) => setStrainDesc(e.target.value)}
            placeholder={t.pricing.description}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
          />
          <input
            type="number"
            step="0.01"
            required
            value={pricePerGram}
            onChange={(e) => setPricePerGram(e.target.value)}
            placeholder={t.pricing.pricePerGram}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.pricing.newStrain}
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {strains.map((s) => (
            <div
              key={s.id}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-white">{s.name}</div>
                {s.description && <div className="text-xs text-zinc-500">{s.description}</div>}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  defaultValue={s.price_per_gram}
                  onBlur={async (e) => {
                    const val = parseFloat(e.target.value);
                    if (!Number.isNaN(val) && val !== s.price_per_gram) {
                      await updateStrain(s.id, { price_per_gram: val });
                      await loadData();
                    }
                  }}
                  className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-right text-sm font-mono text-emerald-400"
                />
                <span className="text-xs text-zinc-500">/g</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Rules Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Tags className="w-4 h-4 text-emerald-400" />
          <span>{t.pricing.rulesTitle}</span>
        </h2>

        <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select
            value={ruleStrainId}
            onChange={(e) => setRuleStrainId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
          >
            {strains.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as PricingRuleType)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="retail">{t.sales.retail}</option>
            <option value="wholesale">{t.sales.wholesale}</option>
            <option value="special">{t.pricing.special}</option>
          </select>

          <select
            value={bagType}
            onChange={(e) => setBagType(e.target.value as PricingBagType)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="50">Bolsa 50</option>
            <option value="30">Bolsa 30</option>
            <option value="100">Bolsa 100</option>
            <option value="125g">125g (Octavo)</option>
            <option value="250g">250g (Cuarto)</option>
            <option value="500g">500g (Medio)</option>
            <option value="1000g">1000g (Kilo)</option>
            <option value="custom">Custom</option>
          </select>

          <input
            type="number"
            step="0.1"
            value={ruleWeight}
            onChange={(e) => setRuleWeight(e.target.value)}
            placeholder="Peso (g)"
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
          />

          <input
            type="number"
            step="0.01"
            required
            value={rulePrice}
            onChange={(e) => setRulePrice(e.target.value)}
            placeholder="Precio"
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
          />

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.app.add}
          </button>
        </form>

        <input
          type="text"
          value={ruleDesc}
          onChange={(e) => setRuleDesc(e.target.value)}
          placeholder="Descripción (ej: Promo 2x bolsas de 50, Mayorista cuarto, etc.)"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
        />

        <div className="divide-y divide-zinc-800">
          {rules.map((rule) => (
            <div key={rule.id} className="py-3 flex items-center justify-between gap-4 text-sm">
              <div>
                <div className="font-medium text-white">
                  {rule.strain?.name || 'Producto'} ·{' '}
                  <span className="text-emerald-400 font-mono">{formatMoney(rule.price)}</span>
                </div>
                <div className="text-xs text-zinc-400">
                  {rule.rule_type.toUpperCase()} · {rule.bag_type}
                  {rule.weight_g ? ` (${rule.weight_g}g)` : ''}
                  {rule.description ? ` · ${rule.description}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await deletePricingRule(rule.id);
                  await loadData();
                }}
                className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

