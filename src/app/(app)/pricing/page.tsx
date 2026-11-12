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

const BAG_DEFAULT_GRAMS: Record<PricingBagType, { weight: string; price?: string }> = {
  '50': { weight: '27', price: '50' },
  '30': { weight: '15', price: '30' },
  '100': { weight: '60', price: '100' },
  '125g': { weight: '125' },
  '250g': { weight: '250' },
  '500g': { weight: '500' },
  '1000g': { weight: '1000' },
  custom: { weight: '' },
};

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
        <div>
          <h2 className="text-sm font-semibold text-white">{t.pricing.strainsTitle}</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Registra cada variedad o producto. El precio por gramo sirve como base automática para
            calcular ventas a granel si no hay una regla especial.
          </p>
        </div>

        <form onSubmit={handleAddStrain} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              {t.pricing.strainName} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={strainName}
              onChange={(e) => setStrainName(e.target.value)}
              placeholder="Ej: OG Kush, Sativa Indoor..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Nota o calidad (opcional)
            </label>
            <input
              type="text"
              value={strainDesc}
              onChange={(e) => setStrainDesc(e.target.value)}
              placeholder="Ej: Cosecha Nov, Hidropónica..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              {t.pricing.pricePerGram} <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={pricePerGram}
              onChange={(e) => setPricePerGram(e.target.value)}
              placeholder="Ej: 15 (precio por 1 gramo)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-600"
            />
          </div>

          <button
            type="submit"
            className="h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer"
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
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{s.name}</div>
                {s.description ? (
                  <div className="text-xs text-zinc-500 truncate">{s.description}</div>
                ) : (
                  <div className="text-[11px] text-zinc-600">Edita el $/g y sal del cuadro</div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <span className="block text-[10px] text-zinc-500 mb-0.5">Precio x gramo</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
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
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Rules Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Tags className="w-4 h-4 text-emerald-400" />
            <span>{t.pricing.rulesTitle}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configura precios fijos por bolsa armada o paquetes al mayoreo. Ejemplo: una{' '}
            <strong className="text-zinc-200">Bolsa 50</strong> trae{' '}
            <strong className="text-zinc-200">27g</strong> y se vende en{' '}
            <strong className="text-zinc-200">$50</strong>.
          </p>
        </div>

        <form onSubmit={handleAddRule} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Cepa / Producto
              </label>
              <select
                value={ruleStrainId}
                onChange={(e) => setRuleStrainId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
              >
                {strains.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Tipo de venta
              </label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as PricingRuleType)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="retail">{t.sales.retail}</option>
                <option value="wholesale">{t.sales.wholesale}</option>
                <option value="special">{t.pricing.special}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Presentación / Tamaño
              </label>
              <select
                value={bagType}
                onChange={(e) => {
                  const next = e.target.value as PricingBagType;
                  setBagType(next);
                  const preset = BAG_DEFAULT_GRAMS[next];
                  if (preset.weight) setRuleWeight(preset.weight);
                  if (preset.price) setRulePrice(preset.price);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="50">Bolsa 50</option>
                <option value="30">Bolsa 30</option>
                <option value="100">Bolsa 100</option>
                <option value="125g">125g (Octavo)</option>
                <option value="250g">250g (Cuarto)</option>
                <option value="500g">500g (Medio)</option>
                <option value="1000g">1000g (Kilo)</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Gramos que incluye (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={ruleWeight}
                onChange={(e) => setRuleWeight(e.target.value)}
                placeholder="Ej: 27"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Precio de venta ($) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={rulePrice}
                onChange={(e) => setRulePrice(e.target.value)}
                placeholder="Ej: 50"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-600"
              />
            </div>

            <button
              type="submit"
              className="h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t.app.add}
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Descripción o nombre de la promo (opcional)
            </label>
            <input
              type="text"
              value={ruleDesc}
              onChange={(e) => setRuleDesc(e.target.value)}
              placeholder="Ej: Promo 2x bolsas de 50, Precio socio por cuarto, etc."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            />
          </div>
        </form>

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

