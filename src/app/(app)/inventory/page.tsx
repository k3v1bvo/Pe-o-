'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Camera, Package, Scale, Upload, X, Lock, Search } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import {
  addLotPhoto,
  closeLotWithSpill,
  createLot,
  getConsignments,
  getGradedBags,
  getLotCosts,
  getLots,
  getSales,
  getStrains,
  updateLotStatus,
  uploadImageFile,
  upsertLotCost,
} from '@/lib/data-service';
import { formatWeight } from '@/lib/utils';
import {
  INVENTORY_UNITS,
  type Consignment,
  type GradedBag,
  type InventoryLot,
  type LotCost,
  type LotStatus,
  type Sale,
  type Strain,
} from '@/types/database';

export default function InventoryPage() {
  const { profile, t, formatMoney } = useApp();
  const isAdmin = profile?.role === 'admin';
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [lotCosts, setLotCosts] = useState<LotCost[]>([]);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [bags, setBags] = useState<GradedBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // New Lot Form
  const [strainId, setStrainId] = useState('');
  const [supplier, setSupplier] = useState('');
  const [declaredWeightG, setDeclaredWeightG] = useState('1000');
  const [actualWeightG, setActualWeightG] = useState('1000');
  const [costPerKg, setCostPerKg] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [lotSearch, setLotSearch] = useState('');

  // Add photo to existing lot
  const [uploadingLotId, setUploadingLotId] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const [closingLotId, setClosingLotId] = useState<string | null>(null);
  const [spillWeightG, setSpillWeightG] = useState('0');
  const [closingBusy, setClosingBusy] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [l, s, c, cons, sal, b] = await Promise.all([
        getLots(),
        getStrains(),
        isAdmin ? getLotCosts() : Promise.resolve([]),
        getConsignments(),
        getSales(),
        getGradedBags(),
      ]);
      setLots(l);
      setStrains(s);
      setLotCosts(c);
      setConsignments(cons);
      setSales(sal);
      setBags(b);
      if (s.length > 0 && !strainId) {
        setStrainId(s[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [strainId, isAdmin]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getLots(),
      getStrains(),
      isAdmin ? getLotCosts() : Promise.resolve([]),
      getConsignments(),
      getSales(),
      getGradedBags(),
    ])
      .then(([l, s, c, cons, sal, b]) => {
        if (!active) return;
        setLots(l);
        setStrains(s);
        setLotCosts(c);
        setConsignments(cons);
        setSales(sal);
        setBags(b);
        if (s.length > 0) {
          setStrainId((prev) => prev || s[0].id);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const addUnitShortcut = (grams: number) => {
    const current = parseFloat(declaredWeightG) || 0;
    const next = current + grams;
    setDeclaredWeightG(String(next));
    setActualWeightG(String(next));
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strainId || !profile) return;
    setSaving(true);
    try {
      const lot = await createLot({
        strain_id: strainId,
        supplier: supplier.trim() || 'Sin proveedor',
        declared_weight_g: parseFloat(declaredWeightG) || 0,
        actual_weight_g: parseFloat(actualWeightG) || 0,
        received_by: profile.id,
        notes: notes.trim() || undefined,
      });

      const parsedCostKg = parseFloat(costPerKg);
      if (isAdmin && Number.isFinite(parsedCostKg) && parsedCostKg > 0) {
        const kilos = (parseFloat(actualWeightG) || parseFloat(declaredWeightG) || 0) / 1000;
        await upsertLotCost({
          lot_id: lot.id,
          cost_per_kg: parsedCostKg,
          total_cost: Number((kilos * parsedCostKg).toFixed(2)),
          created_by: profile.id,
        });
      }

      // Upload attached scale photos
      for (let i = 0; i < photoFiles.length; i++) {
        const url = await uploadImageFile(photoFiles[i], 'greenscale/scales');
        await addLotPhoto({
          lot_id: lot.id,
          photo_url: url,
          description: `Pesaje inicial #${i + 1}`,
        });
      }

      setSupplier('');
      setDeclaredWeightG('1000');
      setActualWeightG('1000');
      setCostPerKg('');
      setNotes('');
      setPhotoFiles([]);
      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadExtraPhoto = async (lotId: string, file: File) => {
    setUploadingLotId(lotId);
    try {
      const url = await uploadImageFile(file, 'greenscale/scales');
      await addLotPhoto({
        lot_id: lotId,
        photo_url: url,
        description: `Control de peso ${new Date().toLocaleDateString()}`,
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingLotId(null);
    }
  };

  const statusLabels: Record<LotStatus, string> = {
    received: t.inventory.statusReceived,
    grading: t.inventory.statusGrading,
    graded: t.inventory.statusGraded,
    sold_out: t.inventory.statusSoldOut,
  };

  if (loading) return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.inventory.title}</h1>
          <p className="text-sm text-zinc-400 mt-1">{t.inventory.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t.inventory.newLot}
        </button>
      </div>

      {/* New Lot Form */}
      {showForm && (
        <form
          onSubmit={handleCreateLot}
          className="bg-zinc-900/95 border border-emerald-500/25 rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
            <div>
              <h2 className="text-sm font-semibold text-white">Registrar Ingreso a Almacén</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Anota cuánto venía declarado, cuánto pesó en báscula y adjunta fotos si las tienes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"
            >
              {t.app.close}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                {t.inventory.strain} <span className="text-rose-400">*</span>
              </label>
              <select
                value={strainId}
                onChange={(e) => setStrainId(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15 transition-all"
              >
                {strains.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">{t.inventory.supplier}</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Ej: Envío Norte - 3 paquetes"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15 transition-all"
              />
            </div>
          </div>

          {/* Unit Shortcuts */}
          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/[0.06] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-300">{t.inventory.quickUnit}</span>
              <span className="text-[11px] text-zinc-500">{t.inventory.bagCountHint}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeclaredWeightG('0');
                  setActualWeightG('0');
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 cursor-pointer transition-colors"
              >
                0g (Reiniciar)
              </button>
              {INVENTORY_UNITS.map((u) => (
                <button
                  key={u.key}
                  type="button"
                  onClick={() => addUnitShortcut(u.grams)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-medium text-emerald-300 cursor-pointer transition-colors"
                >
                  + {u.grams}g
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-300">
                  {t.inventory.declaredWeight} <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                  {((parseFloat(declaredWeightG) || 0) / 1000).toFixed(2)} kg
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mb-1.5">
                Peso que dice el envío o proveedor (ej: 3 kilos = 3000 g).
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={declaredWeightG}
                  onChange={(e) => setDeclaredWeightG(e.target.value)}
                  placeholder="Ej: 3000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                  g
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-300">
                  {t.inventory.actualWeight} <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] font-mono text-emerald-400">
                  {((parseFloat(actualWeightG) || 0) / 1000).toFixed(2)} kg
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mb-1.5">
                Peso real en báscula. Ajusta directo o resta merma por kilo:
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={actualWeightG}
                  onChange={(e) => setActualWeightG(e.target.value)}
                  placeholder="Ej: 2940"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                  g
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: 'Exacto', lossPerKg: 0 },
                  { label: '-10g/kg', lossPerKg: 10 },
                  { label: '-20g/kg', lossPerKg: 20 },
                  { label: '-30g/kg', lossPerKg: 30 },
                ].map((opt) => (
                  <button
                    key={opt.lossPerKg}
                    type="button"
                    onClick={() => {
                      const decl = parseFloat(declaredWeightG) || 0;
                      const kilos = decl / 1000;
                      const nextActual = Math.max(0, Number((decl - kilos * opt.lossPerKg).toFixed(2)));
                      setActualWeightG(String(nextActual));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 border border-white/[0.06] text-[11px] text-zinc-300 font-mono cursor-pointer transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(() => {
            const decl = parseFloat(declaredWeightG) || 0;
            const act = parseFloat(actualWeightG) || 0;
            const diff = act - decl;
            return (
              <div
                className={`flex flex-wrap items-center justify-between gap-2 text-xs px-3.5 py-2.5 rounded-xl border ${
                  diff < 0
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                    : diff > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/[0.03] border-white/[0.08] text-zinc-300'
                }`}
              >
                <span>
                  Resumen: <strong className="font-mono text-white">{decl}g</strong> declarados →{' '}
                  <strong className="font-mono text-white">{act}g</strong> reales
                </span>
                <span className="font-mono font-semibold">
                  {diff === 0
                    ? 'Sin merma (0g)'
                    : diff < 0
                    ? `Merma: ${Math.abs(diff).toFixed(1)}g`
                    : `Excedente: +${diff.toFixed(1)}g`}
                </span>
              </div>
            );
          })()}

          {isAdmin && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/[0.08] to-emerald-500/[0.02] border border-emerald-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inversión / Costo (Solo visible para Admin)</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                  Privado
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Anota el costo acordado por kilo (1,000g). Almacén y Ventas nunca verán este valor.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Costo por Kilo (Bs./kg)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">
                      Bs.
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPerKg}
                      onChange={(e) => setCostPerKg(e.target.value)}
                      placeholder="Ej: 850"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15 transition-all"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Inversión calculada:</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {formatMoney(
                      ((parseFloat(actualWeightG) || parseFloat(declaredWeightG) || 0) / 1000) *
                        (parseFloat(costPerKg) || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">{t.inventory.notes}</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Llegaron sellados, buena calidad..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">{t.inventory.photos}</label>
              <label className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-dashed border-zinc-700 hover:border-emerald-500/60 hover:bg-zinc-900/60 transition-all cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-zinc-300 truncate">
                    {photoFiles.length > 0
                      ? `${photoFiles.length} foto(s) de pesaje listas`
                      : 'Subir fotos de báscula (opcional)'}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-emerald-400 shrink-0 ml-2">Examinar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer disabled:opacity-60"
            >
              {saving ? t.app.uploading : t.app.save}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm cursor-pointer"
            >
              {t.app.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Lots List */}
      <div className="space-y-4">
        {lots.length > 0 && (
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 mr-2.5 shrink-0" />
            <input
              type="text"
              value={lotSearch}
              onChange={(e) => setLotSearch(e.target.value)}
              placeholder="Buscar lote por cepa, proveedor o nota..."
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        )}

        {lots.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm">
            {t.app.noData}
          </div>
        ) : (
          lots
            .filter((lot) => {
              const q = lotSearch.trim().toLowerCase();
              if (!q) return true;
              return (
                (lot.strain?.name || '').toLowerCase().includes(q) ||
                (lot.supplier || '').toLowerCase().includes(q) ||
                (lot.notes || '').toLowerCase().includes(q)
              );
            })
            .map((lot) => {
            const intakeDiff = Number(lot.actual_weight_g) - Number(lot.declared_weight_g);
            const lotCost = isAdmin ? lotCosts.find((c) => c.lot_id === lot.id) : undefined;
            const consignedG = consignments
              .filter((c) => c.lot_id === lot.id && c.status !== 'requested')
              .reduce((acc, c) => acc + Number(c.total_grams), 0);
            const bulkSoldG = sales
              .filter((s) => s.lot_id === lot.id && !s.bag_id)
              .reduce((acc, s) => acc + Number(s.quantity_g), 0);
            const bagSoldG = bags
              .filter((b) => b.lot_id === lot.id && b.status === 'sold')
              .reduce((acc, b) => acc + Number(b.weight_g), 0);
            const soldG = bulkSoldG + bagSoldG;
            const availableRealG = Math.max(
              0,
              Number(lot.actual_weight_g) - consignedG - soldG
            );
            return (
              <div
                key={lot.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-semibold text-white">
                        {lot.strain?.name || 'Producto'} — {lot.supplier}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(lot.received_at).toLocaleString()}
                      {lot.notes ? ` · ${lot.notes}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isAdmin && lotCost && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/25 text-[11px] font-medium text-emerald-300 tabular-nums">
                        <Lock className="w-3 h-3" />
                        Costo: {formatMoney(lotCost.cost_per_kg)}/kg · Total{' '}
                        {formatMoney(lotCost.total_cost)}
                      </span>
                    )}
                    <select
                      value={lot.status}
                      onChange={async (e) => {
                        await updateLotStatus(lot.id, e.target.value as LotStatus);
                        await loadData();
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200"
                    >
                      {(Object.keys(statusLabels) as LotStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {statusLabels[st]}
                        </option>
                      ))}
                    </select>
                    {lot.status !== 'sold_out' && (
                      <button
                        type="button"
                        onClick={() => {
                          setClosingLotId(closingLotId === lot.id ? null : lot.id);
                          setSpillWeightG('0');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-medium text-amber-300 cursor-pointer transition-colors"
                      >
                        Pesar derrame / Cerrar
                      </button>
                    )}
                  </div>
                </div>

                {closingLotId === lot.id && (
                  <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/25 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-200">
                        Cierre de Lote · Cuadre de Derrame y Merma Final
                      </span>
                      <button
                        type="button"
                        onClick={() => setClosingLotId(null)}
                        className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                      >
                        {t.app.cancel}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Teórico restante en sistema: <strong className="font-mono text-white">{availableRealG.toFixed(1)} g</strong>.
                      Pesa lo que sobró en derrame/polvo al acabarse el lote para calcular la merma final real.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-[11px] text-zinc-300 mb-1">Derrame pesado (g)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={spillWeightG}
                          onChange={(e) => setSpillWeightG(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                        />
                      </div>
                      <div className="text-xs text-zinc-300 pb-2">
                        Merma final detectada:{' '}
                        <strong className="font-mono text-amber-300">
                          {Math.max(0, availableRealG - (parseFloat(spillWeightG) || 0)).toFixed(1)} g
                        </strong>
                      </div>
                      <button
                        type="button"
                        disabled={closingBusy}
                        onClick={async () => {
                          setClosingBusy(true);
                          try {
                            await closeLotWithSpill({
                              id: lot.id,
                              spillWeightG: parseFloat(spillWeightG) || 0,
                              theoreticalRemainingG: availableRealG,
                              currentShrinkageG: Number(lot.shrinkage_g),
                              existingNotes: lot.notes,
                            });
                            setClosingLotId(null);
                            await loadData();
                          } finally {
                            setClosingBusy(false);
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs cursor-pointer disabled:opacity-60"
                      >
                        {closingBusy ? t.app.loading : 'Confirmar Cierre y Merma'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
                    <div className="text-[11px] text-zinc-500">{t.inventory.declaredWeight}</div>
                    <div className="font-mono font-semibold text-zinc-200 mt-0.5">
                      {formatWeight(lot.declared_weight_g)}
                    </div>
                  </div>
                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
                    <div className="text-[11px] text-zinc-500">{t.inventory.actualWeight}</div>
                    <div className="font-mono font-semibold text-emerald-400 mt-0.5">
                      {formatWeight(lot.actual_weight_g)}
                    </div>
                    <div
                      className={`text-[10px] font-mono mt-0.5 ${
                        intakeDiff < 0 ? 'text-rose-400' : 'text-emerald-300/80'
                      }`}
                    >
                      Dif: {intakeDiff >= 0 ? '+' : ''}
                      {intakeDiff.toFixed(1)} g
                    </div>
                  </div>
                  <div className="bg-zinc-950/70 border border-emerald-500/25 rounded-xl p-3">
                    <div className="text-[11px] text-emerald-300/80">Disponible Real</div>
                    <div className="font-mono font-semibold text-white mt-0.5">
                      {formatWeight(availableRealG)}
                    </div>
                  </div>
                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
                    <div className="text-[11px] text-zinc-500">En Concesión / Vendido</div>
                    <div className="font-mono font-semibold text-sky-300 mt-0.5">
                      {formatWeight(consignedG + soldG)}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 tabular-nums">
                      Conc: {formatWeight(consignedG)} · Vta: {formatWeight(soldG)}
                    </div>
                  </div>
                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
                    <div className="text-[11px] text-zinc-500">{t.inventory.shrinkage}</div>
                    <div className="font-mono font-semibold text-amber-300 mt-0.5 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5" />
                      {formatWeight(lot.shrinkage_g)}
                    </div>
                  </div>
                </div>

                {/* Photos */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {lot.photos?.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setZoomPhoto(photo.photo_url)}
                      className="relative group w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 cursor-pointer"
                    >
                      <Image
                        src={photo.photo_url}
                        alt={photo.description || 'Scale'}
                        width={64}
                        height={64}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}

                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingLotId === lot.id ? t.app.uploading : t.inventory.addPhoto}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadExtraPhoto(lot.id, f);
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setZoomPhoto(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-white"
            onClick={() => setZoomPhoto(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <Image
            src={zoomPhoto}
            alt="Scale zoom"
            width={1024}
            height={1024}
            unoptimized
            className="max-h-[88vh] w-auto max-w-full rounded-2xl border border-zinc-700"
          />
        </div>
      )}
    </div>
  );
}

