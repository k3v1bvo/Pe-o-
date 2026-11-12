import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CurrencyConfig } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: CurrencyConfig = { code: "BOB", symbol: "Bs.", locale: "es-BO" }
): string {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency.symbol} ${value.toFixed(2)}`;
  }
}

export function formatWeight(grams: number): string {
  const g = Number.isFinite(grams) ? grams : 0;
  if (Math.abs(g) >= 1000) {
    return `${(g / 1000).toFixed(2)} kg (${g.toFixed(1)} g)`;
  }
  return `${g.toFixed(1)} g`;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith("http"));
}
