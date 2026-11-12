'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Camera, Package, Scale, Upload, X, Lock } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import {
  addLotPhoto,
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

  // Add photo to existing lot
  const [uploadingLotId, setUploadingLotId] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

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
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t.inventory.strain}</label>
              <select
                value={strainId}
                onChange={(e) => setStrainId(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                {strains.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t.inventory.supplier}</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Ej: Envío Norte - 4 bolsas"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          {/* Unit Shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">{t.inventory.quickUnit}</span>
              <span className="text-xs text-zinc-500">{t.inventory.bagCountHint}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDeclaredWeightG('0')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 cursor-pointer"
              >
                0g (Reset)
              </button>
              {INVENTORY_UNITS.map((u) => (
                <button
                  key={u.key}
                  type="button"
                  onClick={() => addUnitShortcut(u.grams)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs text-emerald-300 cursor-pointer"
                >
                  + {u.grams}g
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                {t.inventory.declaredWeight}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={declaredWeightG}
                onChange={(e) => setDeclaredWeightG(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                {t.inventory.actualWeight}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={actualWeightG}
                onChange={(e) => setActualWeightG(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                <Lock className="w-3.5 h-3.5" />
                <span>Inversión / Costo por Kilo (Solo Admin — oculto para Almacén)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPerKg}
                  onChange={(e) => setCostPerKg(e.target.value)}
                  placeholder="Ej: 850 por kilo"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
                <div className="text-xs text-zinc-400 tabular-nums">
                  Inversión total estimada:{' '}
                  <span className="text-emerald-300 font-semibold">
                    {formatMoney(
                      ((parseFloat(actualWeightG) || 0) / 1000) * (parseFloat(costPerKg) || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t.inventory.notes}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t.inventory.photos}</label>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 cursor-pointer">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>
                {photoFiles.length > 0
                  ? `${photoFiles.length} foto(s) seleccionada(s)`
                  : t.inventory.addPhoto}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
              />
            </label>
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
        {lots.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-sm">
            {t.app.noData}
          </div>
        ) : (
          lots.map((lot) => {
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
                  </div>
                </div>

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

