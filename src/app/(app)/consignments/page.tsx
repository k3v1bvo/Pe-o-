'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  HandCoins,
  Plus,
  CheckCircle2,
  Clock,
  Lock,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  Wallet,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import {
  addConsignmentPayment,
  approveConsignmentRequest,
  createConsignment,
  deleteConsignment,
  deleteConsignmentPayment,
  getConsignmentAdminCosts,
  getConsignmentPayments,
  getConsignments,
  getLotCosts,
  getLots,
  getProfiles,
  getStrains,
  requestConsignment,
  updateConsignmentDeliveryStatus,
} from '@/lib/data-service';
import type {
  Consignment,
  ConsignmentAdminCost,
  ConsignmentDeliveryStatus,
  ConsignmentItemKind,
  ConsignmentPayment,
  ConsignmentStatus,
  InventoryLot,
  LotCost,
  Profile,
  Strain,
} from '@/types/database';

type FilterTab = 'all' | 'open' | 'paid' | 'requested';

interface UnitPreset {
  id: string;
  label: string;
  itemKind: ConsignmentItemKind;
  unitLabel: string;
  gramsPerUnit: number;
}

const CONSIGNMENT_PRESETS: UnitPreset[] = [
  { id: 'kg', label: 'Kilo (1,000g)', itemKind: 'bulk', unitLabel: 'kg', gramsPerUnit: 1000 },
  { id: '500g', label: 'Medio (500g)', itemKind: 'bulk', unitLabel: 'medio', gramsPerUnit: 500 },
  { id: '250g', label: 'Cuarto (250g)', itemKind: 'bulk', unitLabel: 'cuarto', gramsPerUnit: 250 },
  { id: '125g', label: 'Octavo (125g)', itemKind: 'bulk', unitLabel: 'octavo', gramsPerUnit: 125 },
  { id: 'bag_50', label: '50tas (Bolsa 50)', itemKind: 'bag_50', unitLabel: '50tas', gramsPerUnit: 27 },
  { id: 'bag_30', label: '30s (Bolsa 30)', itemKind: 'bag_30', unitLabel: '30s', gramsPerUnit: 15 },
  { id: 'bag_100', label: '100s (Bolsa 100)', itemKind: 'bag_100', unitLabel: '100s', gramsPerUnit: 60 },
  { id: 'g', label: 'Gramos (g)', itemKind: 'bulk', unitLabel: 'g', gramsPerUnit: 1 },
];

function toLocalInputValue(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function ConsignmentsPage() {
  const { profile, t, formatMoney } = useApp();
  const isAdmin = profile?.role === 'admin';

  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [payments, setPayments] = useState<ConsignmentPayment[]>([]);
  const [adminCosts, setAdminCosts] = useState<ConsignmentAdminCost[]>([]);
  const [lotCosts, setLotCosts] = useState<LotCost[]>([]);
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [showGiveForm, setShowGiveForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Admin: Give consignment form
  const [consigneeId, setConsigneeId] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [selectedStrainId, setSelectedStrainId] = useState('');
  const [givePresetId, setGivePresetId] = useState('kg');
  const [giveQty, setGiveQty] = useState('4');
  const [giveUnitPrice, setGiveUnitPrice] = useState('');
  const [giveTotal, setGiveTotal] = useState('');
  const [giveAdminCost, setGiveAdminCost] = useState('');
  const [giveDate, setGiveDate] = useState(toLocalInputValue());
  const [giveNotes, setGiveNotes] = useState('');
  const [submittingGive, setSubmittingGive] = useState(false);

  // Consignee/Warehouse: Request 50tas / stock form
  const [reqPresetId, setReqPresetId] = useState('bag_50');
  const [reqQty, setReqQty] = useState('10');
  const [reqStrainId, setReqStrainId] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  // Payment modal/inline state
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  // Approve request inline state (Admin)
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveUnitPrice, setApproveUnitPrice] = useState('');
  const [approveTotal, setApproveTotal] = useState('');
  const [approveAdminCost, setApproveAdminCost] = useState('');
  const [approveLotId, setApproveLotId] = useState('');
  const [submittingApprove, setSubmittingApprove] = useState(false);

  const applyLoadedData = useCallback(
    (
      c: Consignment[],
      p: ConsignmentPayment[],
      l: InventoryLot[],
      s: Strain[],
      profs: Profile[],
      ac: ConsignmentAdminCost[],
      lc: LotCost[]
    ) => {
      setConsignments(c);
      setPayments(p);
      setLots(l);
      setStrains(s);
      setProfiles(profs);
      setAdminCosts(ac);
      setLotCosts(lc);

      if (s.length > 0) {
        setSelectedStrainId((prev) => prev || s[0].id);
        setReqStrainId((prev) => prev || s[0].id);
      }
      if (isAdmin && profs.length > 0) {
        const preferred =
          profs.find((u) => u.role === 'seller') ||
          profs.find((u) => u.role === 'warehouse') ||
          profs[0];
        setConsigneeId((prev) => {
          if (!prev) {
            setConsigneeName(preferred.name || preferred.email);
            return preferred.id;
          }
          return prev;
        });
      }
    },
    [isAdmin]
  );

  const loadData = useCallback(async () => {
    try {
      const [c, p, l, s, profs, ac, lc] = await Promise.all([
        getConsignments(),
        getConsignmentPayments(),
        getLots(),
        getStrains(),
        isAdmin ? getProfiles() : Promise.resolve([]),
        isAdmin ? getConsignmentAdminCosts() : Promise.resolve([]),
        isAdmin ? getLotCosts() : Promise.resolve([]),
      ]);
      applyLoadedData(c, p, l, s, profs, ac, lc);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudieron cargar las concesiones.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, applyLoadedData]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [c, p, l, s, profs, ac, lc] = await Promise.all([
          getConsignments(),
          getConsignmentPayments(),
          getLots(),
          getStrains(),
          isAdmin ? getProfiles() : Promise.resolve([]),
          isAdmin ? getConsignmentAdminCosts() : Promise.resolve([]),
          isAdmin ? getLotCosts() : Promise.resolve([]),
        ]);
        if (active) {
          applyLoadedData(c, p, l, s, profs, ac, lc);
        }
      } catch (err) {
        console.error(err);
        if (active) setErrorMsg('No se pudieron cargar las concesiones.');
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [isAdmin, applyLoadedData]);

  // Auto-calculate Admin's total price and reference cost when lot/qty/unit price changes
  const activePreset =
    CONSIGNMENT_PRESETS.find((p) => p.id === givePresetId) || CONSIGNMENT_PRESETS[0];

  const handleLotChange = (lotId: string) => {
    setSelectedLotId(lotId);
    const lot = lots.find((l) => l.id === lotId);
    if (lot) {
      setSelectedStrainId(lot.strain_id);
      const lc = lotCosts.find((c) => c.lot_id === lot.id);
      if (lc && lc.cost_per_kg > 0) {
        const qtyNum = parseFloat(giveQty) || 0;
        const grams = qtyNum * activePreset.gramsPerUnit;
        setGiveAdminCost(((grams / 1000) * lc.cost_per_kg).toFixed(2));
      }
    }
  };

  const handleQtyOrUnitPriceChange = (nextQty: string, nextUnitPrice: string) => {
    setGiveQty(nextQty);
    setGiveUnitPrice(nextUnitPrice);
    const q = parseFloat(nextQty);
    const p = parseFloat(nextUnitPrice);
    if (Number.isFinite(q) && Number.isFinite(p)) {
      setGiveTotal((q * p).toFixed(2));
    }
    if (selectedLotId) {
      const lc = lotCosts.find((c) => c.lot_id === selectedLotId);
      if (lc && lc.cost_per_kg > 0 && Number.isFinite(q)) {
        const grams = q * activePreset.gramsPerUnit;
        setGiveAdminCost(((grams / 1000) * lc.cost_per_kg).toFixed(2));
      }
    }
  };

  const stats = useMemo(() => {
    const activeEntries = consignments.filter((c) => c.status !== 'requested');
    const totalAgreed = activeEntries.reduce((acc, c) => acc + Number(c.agreed_total), 0);
    const totalPaid = activeEntries.reduce((acc, c) => acc + Number(c.paid_amount), 0);
    const totalOwed = activeEntries.reduce(
      (acc, c) => acc + Math.max(0, Number(c.agreed_total) - Number(c.paid_amount)),
      0
    );
    const pendingRequests = consignments.filter((c) => c.status === 'requested').length;

    const totalAdminCost = isAdmin
      ? activeEntries.reduce((acc, c) => {
          const found = adminCosts.find((ac) => ac.consignment_id === c.id);
          return acc + Number(found?.admin_cost_total || 0);
        }, 0)
      : 0;

    return {
      totalAgreed,
      totalPaid,
      totalOwed,
      pendingRequests,
      totalAdminCost,
      projectedProfit: totalAgreed - totalAdminCost,
    };
  }, [consignments, adminCosts, isAdmin]);

  const [filterPerson, setFilterPerson] = useState<string>('all');

  const consigneeSummaries = useMemo(() => {
    if (!isAdmin) return [];
    const map = new Map<string, { name: string; agreed: number; paid: number; owed: number }>();
    for (const c of consignments) {
      if (c.status === 'requested') continue;
      const key = c.consignee_name || 'Sin nombre';
      const cur = map.get(key) || { name: key, agreed: 0, paid: 0, owed: 0 };
      const agreed = Number(c.agreed_total);
      const paid = Number(c.paid_amount);
      cur.agreed += agreed;
      cur.paid += paid;
      cur.owed += Math.max(0, agreed - paid);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.owed - a.owed);
  }, [consignments, isAdmin]);

  const filteredList = useMemo(() => {
    const byPerson =
      filterPerson === 'all'
        ? consignments
        : consignments.filter((c) => (c.consignee_name || 'Sin nombre') === filterPerson);

    switch (filterTab) {
      case 'open':
        return byPerson.filter((c) => c.status === 'pending' || c.status === 'partial');
      case 'paid':
        return byPerson.filter((c) => c.status === 'paid');
      case 'requested':
        return byPerson.filter((c) => c.status === 'requested');
      default:
        return byPerson;
    }
  }, [consignments, filterTab, filterPerson]);

  const handleGiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !isAdmin) return;
    setErrorMsg('');
    setSubmittingGive(true);
    try {
      const qtyNum = parseFloat(giveQty) || 0;
      const totalNum = parseFloat(giveTotal) || 0;
      const unitNum =
        parseFloat(giveUnitPrice) || (qtyNum > 0 ? Number((totalNum / qtyNum).toFixed(2)) : 0);
      const strainName = strains.find((s) => s.id === selectedStrainId)?.name || 'Producto';

      await createConsignment({
        consignee_id: consigneeId || null,
        consignee_name: consigneeName.trim() || 'Socio',
        lot_id: selectedLotId || null,
        strain_id: selectedStrainId || null,
        item_label: `${qtyNum} ${activePreset.unitLabel} · ${strainName}`,
        item_kind: activePreset.itemKind,
        quantity: qtyNum,
        unit_label: activePreset.unitLabel,
        total_grams: qtyNum * activePreset.gramsPerUnit,
        unit_sale_price: unitNum,
        agreed_total: totalNum,
        admin_cost_total: parseFloat(giveAdminCost) || null,
        notes: giveNotes.trim() || undefined,
        given_by: profile.id,
        given_at: giveDate ? new Date(giveDate).toISOString() : new Date().toISOString(),
      });

      setGiveUnitPrice('');
      setGiveTotal('');
      setGiveAdminCost('');
      setGiveNotes('');
      setShowGiveForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al registrar la entrega a concesión.');
    } finally {
      setSubmittingGive(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setErrorMsg('');
    setSubmittingReq(true);
    try {
      const preset = CONSIGNMENT_PRESETS.find((p) => p.id === reqPresetId) || CONSIGNMENT_PRESETS[4];
      const qtyNum = parseFloat(reqQty) || 1;
      const strainName = strains.find((s) => s.id === reqStrainId)?.name || 'Producto';

      await requestConsignment({
        consignee_id: profile.id,
        consignee_name: profile.name || profile.email,
        strain_id: reqStrainId || null,
        item_label: `${qtyNum} ${preset.unitLabel} · ${strainName}`,
        item_kind: preset.itemKind,
        quantity: qtyNum,
        unit_label: preset.unitLabel,
        total_grams: qtyNum * preset.gramsPerUnit,
        notes: reqNotes.trim() || undefined,
      });

      setReqNotes('');
      setShowRequestForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo enviar el pedido.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent, item: Consignment) => {
    e.preventDefault();
    if (!profile || !isAdmin) return;
    setErrorMsg('');
    const amt = parseFloat(payAmount);
    const remaining = Math.max(0, Number(item.agreed_total) - Number(item.paid_amount));
    if (!Number.isFinite(amt) || amt <= 0) return;
    if (remaining > 0 && amt > remaining + 0.01) {
      setErrorMsg(
        `El abono (${formatMoney(amt)}) supera el saldo pendiente (${formatMoney(remaining)}).`
      );
      return;
    }

    setSubmittingPay(true);
    try {
      await addConsignmentPayment({
        consignment_id: item.id,
        amount: amt,
        note: payNote.trim() || undefined,
        recorded_by: profile.id,
      });
      setPayingId(null);
      setPayAmount('');
      setPayNote('');
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo registrar el abono.');
    } finally {
      setSubmittingPay(false);
    }
  };

  const handleApproveRequest = async (e: React.FormEvent, item: Consignment) => {
    e.preventDefault();
    if (!profile || !isAdmin) return;
    setSubmittingApprove(true);
    try {
      const totalNum = parseFloat(approveTotal) || 0;
      const unitNum =
        parseFloat(approveUnitPrice) ||
        (item.quantity > 0 ? Number((totalNum / item.quantity).toFixed(2)) : 0);

      await approveConsignmentRequest({
        id: item.id,
        lot_id: approveLotId || null,
        unit_sale_price: unitNum,
        agreed_total: totalNum,
        admin_cost_total: parseFloat(approveAdminCost) || null,
        given_by: profile.id,
      });

      setApprovingId(null);
      setApproveUnitPrice('');
      setApproveTotal('');
      setApproveAdminCost('');
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al aprobar el pedido.');
    } finally {
      setSubmittingApprove(false);
    }
  };

  const statusMeta: Record<
    ConsignmentStatus,
    { label: string; badge: string }
  > = {
    requested: {
      label: 'Pedido Pendiente',
      badge: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
    },
    pending: {
      label: 'Por Cobrar',
      badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    },
    partial: {
      label: 'Abono Parcial',
      badge: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
    },
    paid: {
      label: 'Pagado Completo',
      badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    },
  };

  if (loading) return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {t.nav.consignments}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isAdmin
              ? 'Control de entregas a concesión, saldos por cobrar, abonos y pedidos de 50tas.'
              : 'Tu cuenta corriente: lo que llevaste, precio de entrega, abonos y pedidos de stock.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {!isAdmin && (
            <button
              type="button"
              onClick={() => setShowRequestForm((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Pedir 50tas / Material</span>
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setShowGiveForm((v) => !v);
                setShowRequestForm(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dar a Concesión</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{isAdmin ? 'Total Entregado (Venta)' : 'Total Llevado'}</span>
            <HandCoins className="w-4 h-4 text-zinc-300" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-white mt-2">
            {formatMoney(stats.totalAgreed)}
          </div>
        </div>

        <div className="obsidian-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{isAdmin ? 'Total Cobrado (Abonos)' : 'Total Abonado'}</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-emerald-400 mt-2">
            {formatMoney(stats.totalPaid)}
          </div>
        </div>

        <div className="obsidian-card rounded-2xl p-5 !border-amber-500/30">
          <div className="flex items-center justify-between text-xs text-amber-300/90">
            <span>{isAdmin ? 'Por Cobrar (Me Deben)' : 'Saldo que Debo'}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-semibold tabular-nums text-amber-300 mt-2">
            {formatMoney(stats.totalOwed)}
          </div>
        </div>

        {isAdmin ? (
          <div className="obsidian-card rounded-2xl p-5 !border-emerald-500/25">
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <span>Margen Mío (Solo Admin)</span>
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-emerald-300 mt-2">
              {formatMoney(stats.projectedProfit)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 tabular-nums">
              Inversión asignada: {formatMoney(stats.totalAdminCost)}
            </div>
          </div>
        ) : (
          <div className="obsidian-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Pedidos Pendientes</span>
              <PackageCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-semibold tabular-nums text-sky-300 mt-2">
              {stats.pendingRequests}
            </div>
          </div>
        )}
      </div>

      {/* Consignee Request Form ("Pedir 50tas y demás") */}
      {showRequestForm && (
        <form
          onSubmit={handleRequestSubmit}
          className="obsidian-card rounded-2xl p-5 space-y-4 !border-amber-500/30"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Pedir Material (50tas, Kilos, etc.)</h2>
            <button
              type="button"
              onClick={() => setShowRequestForm(false)}
              className="text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              {t.app.close}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {CONSIGNMENT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setReqPresetId(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-colors ${
                  reqPresetId === p.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-zinc-950 border-white/10 text-zinc-300 hover:border-white/25'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Cantidad</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={reqQty}
                onChange={(e) => setReqQty(e.target.value)}
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">{t.inventory.strain}</label>
              <select
                value={reqStrainId}
                onChange={(e) => setReqStrainId(e.target.value)}
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                {strains.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Nota</label>
              <input
                type="text"
                value={reqNotes}
                onChange={(e) => setReqNotes(e.target.value)}
                placeholder="Ej: Para entregar hoy en la noche"
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingReq}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm cursor-pointer disabled:opacity-60"
          >
            {submittingReq ? t.app.loading : 'Enviar Pedido al Admin'}
          </button>
        </form>
      )}

      {/* Admin: Give on Consignment Form */}
      {isAdmin && showGiveForm && (
        <form
          onSubmit={handleGiveSubmit}
          className="obsidian-card rounded-2xl p-5 sm:p-6 space-y-4 !border-emerald-500/30"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Nueva Entrega a Concesión</h2>
            <button
              type="button"
              onClick={() => setShowGiveForm(false)}
              className="text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              {t.app.close}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Cuenta / Usuario</label>
              <select
                value={consigneeId}
                onChange={(e) => {
                  const id = e.target.value;
                  setConsigneeId(id);
                  const found = profiles.find((u) => u.id === id);
                  if (found) setConsigneeName(found.name || found.email);
                }}
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                <option value="">-- Socio sin cuenta / manual --</option>
                {profiles.map((u) => {
                  const roleTag =
                    u.role === 'admin' ? 'Admin' : u.role === 'seller' ? 'Ventas' : 'Almacén';
                  return (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({roleTag})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Nombre de quien lleva</label>
              <input
                type="text"
                required
                value={consigneeName}
                onChange={(e) => setConsigneeName(e.target.value)}
                placeholder="Ej: Almacenista / Socio"
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Fecha y hora de entrega</label>
              <input
                type="datetime-local"
                value={giveDate}
                onChange={(e) => setGiveDate(e.target.value)}
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs text-zinc-400 mb-2">Presentación / Unidad entregada</span>
            <div className="flex flex-wrap gap-2">
              {CONSIGNMENT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setGivePresetId(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-colors ${
                    givePresetId === p.id
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      : 'bg-zinc-950 border-white/10 text-zinc-300 hover:border-white/25'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Lote origen (opcional)</label>
              <select
                value={selectedLotId}
                onChange={(e) => handleLotChange(e.target.value)}
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              >
                <option value="">-- Sin lote específico --</option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.strain?.name || 'Producto'} · {l.supplier}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Cantidad ({activePreset.unitLabel})
              </label>
              <p className="text-[11px] text-zinc-500 mb-1.5">Ej: 4 si son 4 kilos, 10 si son 10 bolsas.</p>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={giveQty}
                onChange={(e) => handleQtyOrUnitPriceChange(e.target.value, giveUnitPrice)}
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                A cuánto se la vendemos (c/u)
              </label>
              <p className="text-[11px] text-zinc-500 mb-1.5">Precio acordado por unidad/kilo (él SÍ lo ve).</p>
              <input
                type="number"
                step="0.01"
                min="0"
                value={giveUnitPrice}
                onChange={(e) => handleQtyOrUnitPriceChange(giveQty, e.target.value)}
                placeholder="Ej: 1150"
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Total que debe pagar</label>
              <p className="text-[11px] text-zinc-500 mb-1.5">Se calcula automático: cantidad × precio.</p>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={giveTotal}
                onChange={(e) => setGiveTotal(e.target.value)}
                placeholder="Ej: 4600"
                className="w-full bg-[#060807] border border-emerald-500/40 rounded-xl px-3 py-2.5 text-sm text-emerald-300 font-semibold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
              <label className="flex items-center gap-1.5 text-xs font-medium text-emerald-300 mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Mi inversión / costo total (Solo Admin, nunca lo ve quien lleva)</span>
              </label>
              <p className="text-[11px] text-emerald-200/60 mb-1.5">
                Cuánto te costó realmente a ti (ej: 3400 si pagaste 850 × 4 kilos).
              </p>
              <input
                type="number"
                step="0.01"
                min="0"
                value={giveAdminCost}
                onChange={(e) => setGiveAdminCost(e.target.value)}
                placeholder="Ej: 3400 (4 kilos x 850)"
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Notas de entrega</label>
              <input
                type="text"
                value={giveNotes}
                onChange={(e) => setGiveNotes(e.target.value)}
                placeholder="Ej: Se llevó los 4 kilos completos a concesión"
                className="w-full bg-[#060807] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingGive}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer disabled:opacity-60"
          >
            {submittingGive ? t.app.loading : 'Registrar Entrega a Concesión'}
          </button>
        </form>
      )}

      {/* Admin: Per-Person Balance Breakdown */}
      {isAdmin && consigneeSummaries.length > 0 && (
        <div className="obsidian-card rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium text-zinc-200">Cuentas por Cobrar por Persona</span>
            {filterPerson !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterPerson('all')}
                className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                Ver todas
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {consigneeSummaries.map((person) => {
              const selected = filterPerson === person.name;
              return (
                <button
                  key={person.name}
                  type="button"
                  onClick={() => setFilterPerson(selected ? 'all' : person.name)}
                  className={`px-3 py-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    selected
                      ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                      : 'bg-white/[0.025] border-white/[0.08] text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <div className="font-medium">{person.name}</div>
                  <div className="tabular-nums mt-0.5">
                    {person.owed > 0 ? (
                      <span className="text-amber-300 font-semibold">
                        Debe {formatMoney(person.owed)}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Saldado</span>
                    )}
                    <span className="text-zinc-500"> / {formatMoney(person.agreed)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'all', label: `Todos (${consignments.length})` },
            {
              key: 'open',
              label: `Por Cobrar (${
                consignments.filter((c) => c.status === 'pending' || c.status === 'partial').length
              })`,
            },
            {
              key: 'paid',
              label: `Pagados (${consignments.filter((c) => c.status === 'paid').length})`,
            },
            { key: 'requested', label: `Pedidos (${stats.pendingRequests})` },
          ] as { key: FilterTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterTab(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border cursor-pointer transition-colors ${
              filterTab === tab.key
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                : 'bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Consignments List */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="obsidian-card rounded-2xl p-8 text-center text-zinc-500 text-sm">
            {t.app.noData}
          </div>
        ) : (
          filteredList.map((item) => {
            const balance = Math.max(0, Number(item.agreed_total) - Number(item.paid_amount));
            const progressPct =
              item.agreed_total > 0
                ? Math.min(100, (Number(item.paid_amount) / Number(item.agreed_total)) * 100)
                : 0;
            const itemPayments = payments.filter((p) => p.consignment_id === item.id);
            const adminCost = isAdmin
              ? adminCosts.find((ac) => ac.consignment_id === item.id)?.admin_cost_total
              : undefined;
            const meta = statusMeta[item.status];
            const isExpanded = expandedId === item.id;

            return (
              <div key={item.id} className="obsidian-card rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white text-base">
                        {item.item_label}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${meta.badge}`}>
                        {meta.label}
                      </span>
                      {item.status !== 'requested' && (
                        isAdmin ? (
                          <select
                            aria-label="Estado de entrega"
                            value={item.delivery_status || 'preparing'}
                            onChange={async (e) => {
                              try {
                                await updateConsignmentDeliveryStatus(
                                  item.id,
                                  e.target.value as ConsignmentDeliveryStatus
                                );
                                await loadData();
                              } catch (err) {
                                console.error(err);
                                setErrorMsg(
                                  'Falta aplicar la migración SQL para estado de entrega.'
                                );
                              }
                            }}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-950 border border-white/15 text-zinc-200 cursor-pointer"
                          >
                            <option value="preparing">Por preparar</option>
                            <option value="dispatched">En camino</option>
                            <option value="delivered">Entregado</option>
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300">
                            <Truck className="w-3 h-3 text-emerald-400" />
                            <span>
                              {item.delivery_status === 'delivered'
                                ? 'Entregado'
                                : item.delivery_status === 'dispatched'
                                ? 'En camino'
                                : 'Por preparar'}
                            </span>
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Lleva: <span className="text-zinc-200 font-medium">{item.consignee_name}</span>{' '}
                      · Entregado: {new Date(item.given_at).toLocaleString()}
                      {item.notes ? ` · ${item.notes}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && item.status === 'requested' && (
                      <button
                        type="button"
                        onClick={() => {
                          setApprovingId(approvingId === item.id ? null : item.id);
                          setApproveUnitPrice('');
                          setApproveTotal('');
                          setApproveAdminCost('');
                          setApproveLotId('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs cursor-pointer"
                      >
                        Aprobar y Poner Precio
                      </button>
                    )}

                    {isAdmin && (item.status === 'pending' || item.status === 'partial') && (
                      <button
                        type="button"
                        onClick={() => {
                          setPayingId(payingId === item.id ? null : item.id);
                          setPayAmount('');
                          setPayNote('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs cursor-pointer"
                      >
                        + Abonar / Cobrar
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm(t.app.confirmDelete)) return;
                          await deleteConsignment(item.id);
                          await loadData();
                        }}
                        aria-label={t.app.delete}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-white/[0.04] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Financials Summary (Consignee sees ONLY their sale price & balance, NEVER Admin's purchase cost) */}
                {item.status !== 'requested' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
                        <div className="text-[11px] text-zinc-500">Precio c/u</div>
                        <div className="text-sm font-semibold tabular-nums text-zinc-200 mt-0.5">
                          {formatMoney(item.unit_sale_price)} / {item.unit_label}
                        </div>
                      </div>
                      <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
                        <div className="text-[11px] text-zinc-500">Total a Pagar</div>
                        <div className="text-sm font-semibold tabular-nums text-white mt-0.5">
                          {formatMoney(item.agreed_total)}
                        </div>
                      </div>
                      <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
                        <div className="text-[11px] text-zinc-500">Abonado</div>
                        <div className="text-sm font-semibold tabular-nums text-emerald-400 mt-0.5">
                          {formatMoney(item.paid_amount)}
                        </div>
                      </div>
                      <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3">
                        <div className="text-[11px] text-zinc-500">Saldo Pendiente</div>
                        <div
                          className={`text-sm font-semibold tabular-nums mt-0.5 ${
                            balance > 0 ? 'text-amber-300' : 'text-emerald-400'
                          }`}
                        >
                          {balance > 0 ? formatMoney(balance) : 'Saldado'}
                        </div>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-white/[0.07] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${progressPct}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      />
                    </div>

                    {isAdmin && adminCost !== undefined && adminCost > 0 && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 tabular-nums">
                        <Lock className="w-3 h-3" />
                        <span>
                          Costo Admin: {formatMoney(adminCost)} · Ganancia:{' '}
                          {formatMoney(Number(item.agreed_total) - Number(adminCost))}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Approve Request Inline Form */}
                {isAdmin && approvingId === item.id && (
                  <form
                    onSubmit={(e) => handleApproveRequest(e, item)}
                    className="p-4 rounded-xl bg-sky-500/[0.07] border border-sky-500/25 space-y-3"
                  >
                    <div className="text-xs font-semibold text-sky-300">
                      Fijar precio de venta al consignatario para aprobar ({item.item_label})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <select
                        value={approveLotId}
                        onChange={(e) => {
                          const lid = e.target.value;
                          setApproveLotId(lid);
                          const lc = lotCosts.find((c) => c.lot_id === lid);
                          if (lc && lc.cost_per_kg > 0) {
                            setApproveAdminCost(
                              ((item.total_grams / 1000) * lc.cost_per_kg).toFixed(2)
                            );
                          }
                        }}
                        className="bg-[#060807] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="">Lote origen (opcional)</option>
                        {lots.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.supplier}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={approveUnitPrice}
                        onChange={(e) => {
                          setApproveUnitPrice(e.target.value);
                          const u = parseFloat(e.target.value);
                          if (Number.isFinite(u)) {
                            setApproveTotal((u * item.quantity).toFixed(2));
                          }
                        }}
                        placeholder={`Precio c/u (${item.unit_label})`}
                        className="bg-[#060807] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={approveTotal}
                        onChange={(e) => setApproveTotal(e.target.value)}
                        placeholder="Total a cobrar"
                        className="bg-[#060807] border border-sky-400/40 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={approveAdminCost}
                        onChange={(e) => setApproveAdminCost(e.target.value)}
                        placeholder="Costo mío (Solo Admin)"
                        className="bg-[#060807] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingApprove}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-semibold text-xs cursor-pointer"
                    >
                      {submittingApprove ? t.app.loading : 'Confirmar Entrega a Concesión'}
                    </button>
                  </form>
                )}

                {/* Admin Record Payment Inline Form */}
                {isAdmin && payingId === item.id && (
                  <form
                    onSubmit={(e) => handleAddPayment(e, item)}
                    className="p-4 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/25 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-emerald-300">
                        Registrar Abono / Pago
                      </span>
                      <button
                        type="button"
                        onClick={() => setPayAmount(balance.toFixed(2))}
                        className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/30 cursor-pointer"
                      >
                        Pagó Completo ({formatMoney(balance)})
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Monto que pasó"
                        className="bg-[#060807] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono"
                      />
                      <input
                        type="text"
                        value={payNote}
                        onChange={(e) => setPayNote(e.target.value)}
                        placeholder="Nota (ej: QR, efectivo, 1er abono)"
                        className="bg-[#060807] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                      />
                      <button
                        type="submit"
                        disabled={submittingPay}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer"
                      >
                        {submittingPay ? t.app.loading : 'Guardar Abono'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Payment History Accordion */}
                {item.status !== 'requested' && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      <span>Historial de abonos ({itemPayments.length})</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 space-y-1.5 pl-2 border-l border-white/10">
                        {itemPayments.length === 0 ? (
                          <p className="text-xs text-zinc-500">Sin abonos registrados todavía.</p>
                        ) : (
                          itemPayments.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between text-xs py-1 text-zinc-300 gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{new Date(p.paid_at).toLocaleString()}</span>
                                {p.note && <span className="text-zinc-500 truncate">· {p.note}</span>}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-semibold tabular-nums text-emerald-400">
                                  +{formatMoney(p.amount)}
                                </span>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    title="Eliminar abono"
                                    onClick={async () => {
                                      if (!confirm('¿Eliminar este abono? Se recalculará el saldo.'))
                                        return;
                                      await deleteConsignmentPayment(p.id, item.id);
                                      await loadData();
                                    }}
                                    className="text-zinc-600 hover:text-rose-400 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

