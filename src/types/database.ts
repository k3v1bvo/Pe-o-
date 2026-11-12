export type UserRole = 'admin' | 'warehouse';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  created_at: string;
}

export interface Strain {
  id: string;
  name: string;
  description: string | null;
  price_per_gram: number;
  active: boolean;
  created_at: string;
}

export type LotStatus = 'received' | 'grading' | 'graded' | 'sold_out';

export interface InventoryLot {
  id: string;
  strain_id: string;
  supplier: string;
  declared_weight_g: number;
  actual_weight_g: number;
  shrinkage_g: number;
  status: LotStatus;
  received_by: string | null;
  received_at: string;
  notes: string | null;
  strain?: Strain;
  photos?: LotPhoto[];
}

export interface LotPhoto {
  id: string;
  lot_id: string;
  photo_url: string;
  description: string | null;
  taken_at: string;
}

export type BagType = '50' | '30' | '100' | 'custom';
export type BagStatus = 'available' | 'sold' | 'reserved';

export interface GradedBag {
  id: string;
  lot_id: string;
  bag_type: BagType;
  weight_g: number;
  price: number;
  status: BagStatus;
  graded_by: string | null;
  created_at: string;
  lot?: InventoryLot;
}

export type SaleType = 'retail' | 'wholesale';

export interface Sale {
  id: string;
  bag_id: string | null;
  lot_id: string | null;
  strain_id: string;
  quantity_g: number;
  unit_price: number;
  total_price: number;
  sale_type: SaleType;
  notes: string | null;
  sold_by: string | null;
  sold_at: string;
  strain?: Strain;
}

export type PricingRuleType = 'retail' | 'wholesale' | 'special';
export type PricingBagType = '50' | '30' | '100' | '125g' | '250g' | '500g' | '1000g' | 'custom';

export interface PricingRule {
  id: string;
  strain_id: string;
  rule_type: PricingRuleType;
  bag_type: PricingBagType;
  price: number;
  weight_g: number | null;
  min_quantity: number | null;
  description: string | null;
  active: boolean;
  created_at: string;
  strain?: Strain;
}

export type ExpenseCategory = 'taxi' | 'food' | 'bags' | 'supplies' | 'trips' | 'taxes' | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receipt_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
}

export const CURRENCY_PRESETS: CurrencyConfig[] = [
  { code: 'BOB', symbol: 'Bs.', locale: 'es-BO' },
  { code: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'MXN', symbol: 'MX$', locale: 'es-MX' },
  { code: 'EUR', symbol: '€', locale: 'es-ES' },
  { code: 'COP', symbol: 'COP$', locale: 'es-CO' },
  { code: 'PEN', symbol: 'S/', locale: 'es-PE' },
];

export const INVENTORY_UNITS = [
  { key: 'kilo', labelKey: 'units.kilo', grams: 1000 },
  { key: 'half', labelKey: 'units.half', grams: 500 },
  { key: 'quarter', labelKey: 'units.quarter', grams: 250 },
  { key: 'eighth', labelKey: 'units.eighth', grams: 125 },
] as const;

export const DEFAULT_BAG_PRESETS: { type: BagType; defaultWeightG: number; defaultPrice: number }[] = [
  { type: '50', defaultWeightG: 27, defaultPrice: 50 },
  { type: '30', defaultWeightG: 15, defaultPrice: 30 },
  { type: '100', defaultWeightG: 60, defaultPrice: 100 },
];

