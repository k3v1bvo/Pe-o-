'use client';

import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/utils';
import type {
  BagType,
  Consignment,
  ConsignmentAdminCost,
  ConsignmentItemKind,
  ConsignmentPayment,
  CurrencyConfig,
  Expense,
  ExpenseCategory,
  GradedBag,
  InventoryLot,
  Invitation,
  LotCost,
  LotPhoto,
  LotStatus,
  PricingBagType,
  PricingRule,
  PricingRuleType,
  Profile,
  Sale,
  SaleType,
  Strain,
  UserRole,
} from '@/types/database';
import type { Locale } from '@/i18n/dictionaries';

const DEMO_STORAGE_KEY = 'greenscale_demo_db_v1';

interface DemoDb {
  strains: Strain[];
  lots: InventoryLot[];
  photos: LotPhoto[];
  bags: GradedBag[];
  sales: Sale[];
  pricingRules: PricingRule[];
  expenses: Expense[];
  profiles: Profile[];
  lotCosts?: LotCost[];
  consignments?: Consignment[];
  consignmentAdminCosts?: ConsignmentAdminCost[];
  consignmentPayments?: ConsignmentPayment[];
}

function getInitialDemoDb(): DemoDb {
  const now = new Date().toISOString();
  const strainId = 'demo-strain-1';
  const lotId = 'demo-lot-1';
  return {
    strains: [
      {
        id: strainId,
        name: 'Producto Principal',
        description: 'Variedad base inicial',
        price_per_gram: 15,
        active: true,
        created_at: now,
      },
    ],
    lots: [
      {
        id: lotId,
        strain_id: strainId,
        supplier: 'Proveedor Central (4 bolsas)',
        declared_weight_g: 4000,
        actual_weight_g: 3960,
        shrinkage_g: 3420,
        status: 'grading',
        received_by: 'demo-warehouse-id',
        received_at: now,
        notes: '4 bolsas de aprox 1kg cada una',
      },
    ],
    photos: [],
    bags: [
      {
        id: 'demo-bag-1',
        lot_id: lotId,
        bag_type: '50',
        weight_g: 27,
        price: 50,
        status: 'available',
        graded_by: 'demo-warehouse-id',
        created_at: now,
      },
      {
        id: 'demo-bag-2',
        lot_id: lotId,
        bag_type: '50',
        weight_g: 27,
        price: 50,
        status: 'available',
        graded_by: 'demo-warehouse-id',
        created_at: now,
      },
      {
        id: 'demo-bag-3',
        lot_id: lotId,
        bag_type: '30',
        weight_g: 15,
        price: 30,
        status: 'available',
        graded_by: 'demo-warehouse-id',
        created_at: now,
      },
    ],
    sales: [],
    pricingRules: [
      {
        id: 'demo-rule-50',
        strain_id: strainId,
        rule_type: 'retail',
        bag_type: '50',
        price: 50,
        weight_g: 27,
        min_quantity: 1,
        description: 'Bolsa estándar de 50 (~27g)',
        active: true,
        created_at: now,
      },
      {
        id: 'demo-rule-30',
        strain_id: strainId,
        rule_type: 'retail',
        bag_type: '30',
        price: 30,
        weight_g: 15,
        min_quantity: 1,
        description: 'Bolsa estándar de 30 (~15g)',
        active: true,
        created_at: now,
      },
      {
        id: 'demo-rule-100',
        strain_id: strainId,
        rule_type: 'retail',
        bag_type: '100',
        price: 100,
        weight_g: 60,
        min_quantity: 1,
        description: 'Bolsa de 100 (~60g)',
        active: true,
        created_at: now,
      },
      {
        id: 'demo-rule-250',
        strain_id: strainId,
        rule_type: 'wholesale',
        bag_type: '250g',
        price: 380,
        weight_g: 250,
        min_quantity: 250,
        description: 'Cuarto (250g) Mayoreo',
        active: true,
        created_at: now,
      },
    ],
    expenses: [],
    profiles: [
      {
        id: 'demo-admin-id',
        email: 'admin@local.test',
        name: 'Admin (Demo)',
        role: 'admin',
        created_at: now,
      },
      {
        id: 'demo-warehouse-id',
        email: 'almacen@local.test',
        name: 'Almacenista (Demo)',
        role: 'warehouse',
        created_at: now,
      },
    ],
    lotCosts: [],
    consignments: [],
    consignmentAdminCosts: [],
    consignmentPayments: [],
  };
}

function readDemoDb(): DemoDb {
  if (typeof window === 'undefined') return getInitialDemoDb();
  const raw = localStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) {
    const init = getInitialDemoDb();
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(init));
    return init;
  }
  const parsed = JSON.parse(raw) as DemoDb;
  return {
    ...parsed,
    lotCosts: parsed.lotCosts ?? [],
    consignments: parsed.consignments ?? [],
    consignmentAdminCosts: parsed.consignmentAdminCosts ?? [],
    consignmentPayments: parsed.consignmentPayments ?? [],
  };
}

function writeDemoDb(db: DemoDb) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db));
  }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ==========================================
// STRAINS
// ==========================================
export async function getStrains(): Promise<Strain[]> {
  if (!isSupabaseConfigured()) {
    return readDemoDb().strains;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('strains')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Strain[];
}

export async function createStrain(input: {
  name: string;
  description?: string;
  price_per_gram: number;
}): Promise<Strain> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const item: Strain = {
      id: uuid(),
      name: input.name,
      description: input.description || null,
      price_per_gram: input.price_per_gram,
      active: true,
      created_at: new Date().toISOString(),
    };
    db.strains.unshift(item);
    writeDemoDb(db);
    return item;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('strains')
    .insert({
      name: input.name,
      description: input.description || null,
      price_per_gram: input.price_per_gram,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Strain;
}

export async function updateStrain(
  id: string,
  updates: Partial<Pick<Strain, 'name' | 'description' | 'price_per_gram' | 'active'>>
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    db.strains = db.strains.map((s) => (s.id === id ? { ...s, ...updates } : s));
    writeDemoDb(db);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from('strains').update(updates).eq('id', id);
  if (error) throw error;
}

// ==========================================
// INVENTORY LOTS & PHOTOS
// ==========================================
export async function getLots(): Promise<InventoryLot[]> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    return db.lots.map((lot) => {
      const strain = db.strains.find((s) => s.id === lot.strain_id);
      const photos = db.photos.filter((p) => p.lot_id === lot.id);
      const gradedTotal = db.bags
        .filter((b) => b.lot_id === lot.id)
        .reduce((acc, b) => acc + Number(b.weight_g), 0);
      return {
        ...lot,
        shrinkage_g: Number(lot.actual_weight_g) - gradedTotal,
        strain,
        photos,
      };
    });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory_lots')
    .select('*, strain:strains(*), photos:lot_photos(*)')
    .order('received_at', { ascending: false });
  if (error) throw error;
  return (data || []) as InventoryLot[];
}

export async function createLot(input: {
  strain_id: string;
  supplier: string;
  declared_weight_g: number;
  actual_weight_g: number;
  received_by: string;
  notes?: string;
}): Promise<InventoryLot> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const item: InventoryLot = {
      id: uuid(),
      strain_id: input.strain_id,
      supplier: input.supplier,
      declared_weight_g: input.declared_weight_g,
      actual_weight_g: input.actual_weight_g,
      shrinkage_g: input.actual_weight_g,
      status: 'received',
      received_by: input.received_by,
      received_at: new Date().toISOString(),
      notes: input.notes || null,
    };
    db.lots.unshift(item);
    writeDemoDb(db);
    return item;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory_lots')
    .insert({
      strain_id: input.strain_id,
      supplier: input.supplier,
      declared_weight_g: input.declared_weight_g,
      actual_weight_g: input.actual_weight_g,
      shrinkage_g: input.actual_weight_g,
      received_by: input.received_by,
      notes: input.notes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as InventoryLot;
}

export async function updateLotStatus(id: string, status: LotStatus): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    db.lots = db.lots.map((l) => (l.id === id ? { ...l, status } : l));
    writeDemoDb(db);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from('inventory_lots').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function getLotPhotos(): Promise<LotPhoto[]> {
  if (!isSupabaseConfigured()) {
    return readDemoDb().photos;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lot_photos')
    .select('*')
    .order('taken_at', { ascending: false });
  if (error) throw error;
  return (data || []) as LotPhoto[];
}

export async function addLotPhoto(input: {
  lot_id: string;
  photo_url: string;
  description?: string;
}): Promise<LotPhoto> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const item: LotPhoto = {
      id: uuid(),
      lot_id: input.lot_id,
      photo_url: input.photo_url,
      description: input.description || null,
      taken_at: new Date().toISOString(),
    };
    db.photos.unshift(item);
    writeDemoDb(db);
    return item;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lot_photos')
    .insert({
      lot_id: input.lot_id,
      photo_url: input.photo_url,
      description: input.description || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as LotPhoto;
}

// ==========================================
// GRADED BAGS (GRAMEO)
// ==========================================
export async function getGradedBags(): Promise<GradedBag[]> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    return db.bags.map((bag) => ({
      ...bag,
      lot: db.lots.find((l) => l.id === bag.lot_id),
    }));
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('graded_bags')
    .select('*, lot:inventory_lots(*, strain:strains(*))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as GradedBag[];
}

export async function createGradedBagsBatch(input: {
  lot_id: string;
  bag_type: BagType;
  weight_g: number;
  price: number;
  quantity: number;
  graded_by: string;
}): Promise<GradedBag[]> {
  const rows = Array.from({ length: input.quantity }, () => ({
    lot_id: input.lot_id,
    bag_type: input.bag_type,
    weight_g: input.weight_g,
    price: input.price,
    status: 'available' as const,
    graded_by: input.graded_by,
  }));

  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const now = new Date().toISOString();
    const created: GradedBag[] = rows.map((r) => ({
      ...r,
      id: uuid(),
      created_at: now,
    }));
    db.bags.unshift(...created);
    db.lots = db.lots.map((l) =>
      l.id === input.lot_id && l.status === 'received' ? { ...l, status: 'grading' } : l
    );
    writeDemoDb(db);
    return created;
  }

  const supabase = createClient();
  const { data, error } = await supabase.from('graded_bags').insert(rows).select();
  if (error) throw error;
  await supabase
    .from('inventory_lots')
    .update({ status: 'grading' })
    .eq('id', input.lot_id)
    .eq('status', 'received');
  return (data || []) as GradedBag[];
}

// ==========================================
// SALES
// ==========================================
export async function getSales(): Promise<Sale[]> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    return db.sales.map((s) => ({
      ...s,
      strain: db.strains.find((st) => st.id === s.strain_id),
    }));
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales')
    .select('*, strain:strains(*)')
    .order('sold_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Sale[];
}

export async function createSale(input: {
  bag_id?: string | null;
  lot_id?: string | null;
  strain_id: string;
  quantity_g: number;
  unit_price: number;
  total_price: number;
  sale_type: SaleType;
  notes?: string;
  sold_by: string;
}): Promise<Sale> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const item: Sale = {
      id: uuid(),
      bag_id: input.bag_id || null,
      lot_id: input.lot_id || null,
      strain_id: input.strain_id,
      quantity_g: input.quantity_g,
      unit_price: input.unit_price,
      total_price: input.total_price,
      sale_type: input.sale_type,
      notes: input.notes || null,
      sold_by: input.sold_by,
      sold_at: new Date().toISOString(),
    };
    db.sales.unshift(item);
    if (input.bag_id) {
      db.bags = db.bags.map((b) => (b.id === input.bag_id ? { ...b, status: 'sold' } : b));
    }
    writeDemoDb(db);
    return item;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales')
    .insert({
      bag_id: input.bag_id || null,
      lot_id: input.lot_id || null,
      strain_id: input.strain_id,
      quantity_g: input.quantity_g,
      unit_price: input.unit_price,
      total_price: input.total_price,
      sale_type: input.sale_type,
      notes: input.notes || null,
      sold_by: input.sold_by,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Sale;
}

// ==========================================
// PRICING RULES
// ==========================================
export async function getPricingRules(): Promise<PricingRule[]> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    return db.pricingRules.map((r) => ({
      ...r,
      strain: db.strains.find((s) => s.id === r.strain_id),
    }));
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pricing_rules')
    .select('*, strain:strains(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as PricingRule[];
}

export async function createPricingRule(input: {
  strain_id: string;
  rule_type: PricingRuleType;
  bag_type: PricingBagType;
  price: number;
  weight_g?: number | null;
  min_quantity?: number | null;
  description?: string;
}): Promise<PricingRule> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const item: PricingRule = {
      id: uuid(),
      strain_id: input.strain_id,
      rule_type: input.rule_type,
      bag_type: input.bag_type,
      price: input.price,
      weight_g: input.weight_g ?? null,
      min_quantity: input.min_quantity ?? null,
      description: input.description || null,
      active: true,
      created_at: new Date().toISOString(),
    };
    db.pricingRules.unshift(item);
    writeDemoDb(db);
    return item;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pricing_rules')
    .insert({
      strain_id: input.strain_id,
      rule_type: input.rule_type,
      bag_type: input.bag_type,
      price: input.price,
      weight_g: input.weight_g ?? null,
      min_quantity: input.min_quantity ?? null,
      description: input.description || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as PricingRule;
}

export async function deletePricingRule(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    db.pricingRules = db.pricingRules.filter((r) => r.id !== id);
    writeDemoDb(db);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from('pricing_rules').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// EXPENSES
// ==========================================
export async function getExpenses(): Promise<Expense[]> {
  if (!isSupabaseConfigured()) {
    return readDemoDb().expenses;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Expense[];
}

export async function createExpense(input: {
  category: ExpenseCategory;
  amount: number;
  description: string;
  receipt_url?: string | null;
  created_by: string;
}): Promise<Expense> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const item: Expense = {
      id: uuid(),
      category: input.category,
      amount: input.amount,
      description: input.description,
      receipt_url: input.receipt_url || null,
      created_by: input.created_by,
      created_at: new Date().toISOString(),
    };
    db.expenses.unshift(item);
    writeDemoDb(db);
    return item;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      category: input.category,
      amount: input.amount,
      description: input.description,
      receipt_url: input.receipt_url || null,
      created_by: input.created_by,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    db.expenses = db.expenses.filter((e) => e.id !== id);
    writeDemoDb(db);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// USERS & SETTINGS
// ==========================================
export async function getProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) {
    return readDemoDb().profiles;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Profile[];
}

export async function updateProfileRole(id: string, role: UserRole): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    db.profiles = db.profiles.map((p) => (p.id === id ? { ...p, role } : p));
    writeDemoDb(db);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
}

// ==========================================
// INVITATIONS (Invite-only user creation)
// ==========================================
export async function getInvitations(): Promise<Invitation[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Invitation[];
}

export async function createInvitation(input: {
  role: UserRole;
  email?: string;
  created_by: string;
}): Promise<Invitation> {
  const token =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()
      : Math.random().toString(36).slice(2, 14).toUpperCase();

  const supabase = createClient();
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      token,
      email: input.email?.trim() || null,
      role: input.role,
      created_by: input.created_by,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Invitation;
}

export async function deleteInvitation(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  const { error } = await supabase.from('invitations').delete().eq('id', id);
  if (error) throw error;
}

export async function saveAppSettings(input: {
  currency: CurrencyConfig;
  default_language: Locale;
  updated_by: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }
  const supabase = createClient();
  const rows = [
    { key: 'currency', value: input.currency.code, updated_by: input.updated_by },
    { key: 'currency_symbol', value: input.currency.symbol, updated_by: input.updated_by },
    { key: 'currency_locale', value: input.currency.locale, updated_by: input.updated_by },
    { key: 'default_language', value: input.default_language, updated_by: input.updated_by },
  ];
  const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
}

// ==========================================
// PHOTO UPLOAD (Cloudinary with local demo fallback)
// ==========================================
export async function uploadImageFile(file: File, folder = 'greenscale/scales'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const json = (await res.json()) as { url: string };
      return json.url;
    }
  } catch {
    // Fall through to local preview fallback when Cloudinary is not configured yet
  }

  // Fallback for local testing before Cloudinary keys are set
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

// ==========================================
// LOT COSTS (Admin-only)
// ==========================================
export async function getLotCosts(): Promise<LotCost[]> {
  if (!isSupabaseConfigured()) {
    return readDemoDb().lotCosts ?? [];
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lot_costs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as LotCost[];
}

export async function upsertLotCost(input: {
  lot_id: string;
  cost_per_kg: number;
  total_cost: number;
  notes?: string;
  created_by: string;
}): Promise<LotCost> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const list = db.lotCosts ?? [];
    const existing = list.find((c) => c.lot_id === input.lot_id);
    if (existing) {
      existing.cost_per_kg = input.cost_per_kg;
      existing.total_cost = input.total_cost;
      existing.notes = input.notes || null;
      writeDemoDb(db);
      return existing;
    }
    const created: LotCost = {
      id: uuid(),
      lot_id: input.lot_id,
      cost_per_kg: input.cost_per_kg,
      total_cost: input.total_cost,
      notes: input.notes || null,
      created_by: input.created_by,
      created_at: new Date().toISOString(),
    };
    db.lotCosts = [created, ...list];
    writeDemoDb(db);
    return created;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('lot_costs')
    .upsert(
      {
        lot_id: input.lot_id,
        cost_per_kg: input.cost_per_kg,
        total_cost: input.total_cost,
        notes: input.notes || null,
        created_by: input.created_by,
      },
      { onConflict: 'lot_id' }
    )
    .select()
    .single();
  if (error) throw error;
  return data as LotCost;
}

// ==========================================
// CONSIGNMENTS (Concesiones, Pedidos & Abonos)
// ==========================================
export async function getConsignments(): Promise<Consignment[]> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    return (db.consignments ?? []).map((c) => ({
      ...c,
      strain: db.strains.find((s) => s.id === c.strain_id),
    }));
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('consignments')
    .select('*, strain:strains(*)')
    .order('given_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Consignment[];
}

export async function getConsignmentAdminCosts(): Promise<ConsignmentAdminCost[]> {
  if (!isSupabaseConfigured()) {
    return readDemoDb().consignmentAdminCosts ?? [];
  }
  const supabase = createClient();
  const { data, error } = await supabase.from('consignment_admin_costs').select('*');
  if (error) throw error;
  return (data || []) as ConsignmentAdminCost[];
}

export async function createConsignment(input: {
  consignee_id: string | null;
  consignee_name: string;
  lot_id?: string | null;
  strain_id?: string | null;
  item_label: string;
  item_kind: ConsignmentItemKind;
  quantity: number;
  unit_label: string;
  total_grams: number;
  unit_sale_price: number;
  agreed_total: number;
  admin_cost_total?: number | null;
  notes?: string;
  given_by: string;
  given_at?: string;
}): Promise<Consignment> {
  const givenAt = input.given_at || new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const item: Consignment = {
      id: uuid(),
      consignee_id: input.consignee_id,
      consignee_name: input.consignee_name,
      lot_id: input.lot_id || null,
      strain_id: input.strain_id || null,
      item_label: input.item_label,
      item_kind: input.item_kind,
      quantity: input.quantity,
      unit_label: input.unit_label,
      total_grams: input.total_grams,
      unit_sale_price: input.unit_sale_price,
      agreed_total: input.agreed_total,
      paid_amount: 0,
      status: 'pending',
      notes: input.notes || null,
      given_by: input.given_by,
      given_at: givenAt,
      created_at: new Date().toISOString(),
    };
    db.consignments = [item, ...(db.consignments ?? [])];
    if (input.admin_cost_total && input.admin_cost_total > 0) {
      db.consignmentAdminCosts = [
        { consignment_id: item.id, admin_cost_total: input.admin_cost_total },
        ...(db.consignmentAdminCosts ?? []),
      ];
    }
    writeDemoDb(db);
    return item;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('consignments')
    .insert({
      consignee_id: input.consignee_id,
      consignee_name: input.consignee_name,
      lot_id: input.lot_id || null,
      strain_id: input.strain_id || null,
      item_label: input.item_label,
      item_kind: input.item_kind,
      quantity: input.quantity,
      unit_label: input.unit_label,
      total_grams: input.total_grams,
      unit_sale_price: input.unit_sale_price,
      agreed_total: input.agreed_total,
      paid_amount: 0,
      status: 'pending',
      notes: input.notes || null,
      given_by: input.given_by,
      given_at: givenAt,
    })
    .select()
    .single();
  if (error) throw error;

  const created = data as Consignment;
  if (input.admin_cost_total && input.admin_cost_total > 0) {
    const { error: costErr } = await supabase.from('consignment_admin_costs').upsert(
      { consignment_id: created.id, admin_cost_total: input.admin_cost_total },
      { onConflict: 'consignment_id' }
    );
    if (costErr) throw costErr;
  }

  return created;
}

export async function requestConsignment(input: {
  consignee_id: string;
  consignee_name: string;
  strain_id?: string | null;
  item_label: string;
  item_kind: ConsignmentItemKind;
  quantity: number;
  unit_label: string;
  total_grams: number;
  notes?: string;
}): Promise<Consignment> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const item: Consignment = {
      id: uuid(),
      consignee_id: input.consignee_id,
      consignee_name: input.consignee_name,
      lot_id: null,
      strain_id: input.strain_id || null,
      item_label: input.item_label,
      item_kind: input.item_kind,
      quantity: input.quantity,
      unit_label: input.unit_label,
      total_grams: input.total_grams,
      unit_sale_price: 0,
      agreed_total: 0,
      paid_amount: 0,
      status: 'requested',
      notes: input.notes || null,
      given_by: null,
      given_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    db.consignments = [item, ...(db.consignments ?? [])];
    writeDemoDb(db);
    return item;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('consignments')
    .insert({
      consignee_id: input.consignee_id,
      consignee_name: input.consignee_name,
      strain_id: input.strain_id || null,
      item_label: input.item_label,
      item_kind: input.item_kind,
      quantity: input.quantity,
      unit_label: input.unit_label,
      total_grams: input.total_grams,
      unit_sale_price: 0,
      agreed_total: 0,
      paid_amount: 0,
      status: 'requested',
      notes: input.notes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Consignment;
}

export async function approveConsignmentRequest(input: {
  id: string;
  lot_id?: string | null;
  unit_sale_price: number;
  agreed_total: number;
  admin_cost_total?: number | null;
  given_by: string;
}): Promise<void> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    db.consignments = (db.consignments ?? []).map((c) =>
      c.id === input.id
        ? {
            ...c,
            lot_id: input.lot_id || c.lot_id,
            unit_sale_price: input.unit_sale_price,
            agreed_total: input.agreed_total,
            status: 'pending',
            given_by: input.given_by,
            given_at: now,
          }
        : c
    );
    if (input.admin_cost_total && input.admin_cost_total > 0) {
      db.consignmentAdminCosts = [
        { consignment_id: input.id, admin_cost_total: input.admin_cost_total },
        ...(db.consignmentAdminCosts ?? []).filter((x) => x.consignment_id !== input.id),
      ];
    }
    writeDemoDb(db);
    return;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('consignments')
    .update({
      lot_id: input.lot_id || null,
      unit_sale_price: input.unit_sale_price,
      agreed_total: input.agreed_total,
      status: 'pending',
      given_by: input.given_by,
      given_at: now,
    })
    .eq('id', input.id);
  if (error) throw error;

  if (input.admin_cost_total && input.admin_cost_total > 0) {
    const { error: costErr } = await supabase.from('consignment_admin_costs').upsert(
      { consignment_id: input.id, admin_cost_total: input.admin_cost_total },
      { onConflict: 'consignment_id' }
    );
    if (costErr) throw costErr;
  }
}

export async function deleteConsignment(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    db.consignments = (db.consignments ?? []).filter((c) => c.id !== id);
    db.consignmentPayments = (db.consignmentPayments ?? []).filter((p) => p.consignment_id !== id);
    db.consignmentAdminCosts = (db.consignmentAdminCosts ?? []).filter(
      (c) => c.consignment_id !== id
    );
    writeDemoDb(db);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from('consignments').delete().eq('id', id);
  if (error) throw error;
}

export async function getConsignmentPayments(): Promise<ConsignmentPayment[]> {
  if (!isSupabaseConfigured()) {
    return readDemoDb().consignmentPayments ?? [];
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('consignment_payments')
    .select('*')
    .order('paid_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ConsignmentPayment[];
}

export async function addConsignmentPayment(input: {
  consignment_id: string;
  amount: number;
  note?: string;
  recorded_by: string;
}): Promise<ConsignmentPayment> {
  if (!isSupabaseConfigured()) {
    const db = readDemoDb();
    const payment: ConsignmentPayment = {
      id: uuid(),
      consignment_id: input.consignment_id,
      amount: input.amount,
      note: input.note || null,
      recorded_by: input.recorded_by,
      paid_at: new Date().toISOString(),
    };
    const nextPayments = [payment, ...(db.consignmentPayments ?? [])];
    db.consignmentPayments = nextPayments;
    const totalPaid = nextPayments
      .filter((p) => p.consignment_id === input.consignment_id)
      .reduce((acc, p) => acc + Number(p.amount), 0);
    db.consignments = (db.consignments ?? []).map((c) => {
      if (c.id !== input.consignment_id) return c;
      const status =
        c.agreed_total > 0 && totalPaid >= c.agreed_total
          ? 'paid'
          : totalPaid > 0
          ? 'partial'
          : 'pending';
      return { ...c, paid_amount: totalPaid, status };
    });
    writeDemoDb(db);
    return payment;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('consignment_payments')
    .insert({
      consignment_id: input.consignment_id,
      amount: input.amount,
      note: input.note || null,
      recorded_by: input.recorded_by,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ConsignmentPayment;
}

