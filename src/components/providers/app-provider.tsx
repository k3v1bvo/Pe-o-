'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured, formatCurrency as fmtCurrency } from '@/lib/utils';
import { dictionaries, type Dictionary, type Locale } from '@/i18n/dictionaries';
import type { CurrencyConfig, Profile, UserRole } from '@/types/database';

interface AppContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: Dictionary;
  currency: CurrencyConfig;
  setCurrency: (cfg: CurrencyConfig) => void;
  formatMoney: (amount: number) => string;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  setDemoUser: (role: UserRole) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'BOB',
  symbol: 'Bs.',
  locale: 'es-BO',
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');
  const [currency, setCurrencyState] = useState<CurrencyConfig>(DEFAULT_CURRENCY);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = !isSupabaseConfigured();

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc);
    if (typeof window !== 'undefined') {
      localStorage.setItem('calc_locale', loc);
      document.documentElement.lang = loc;
    }
  }, []);

  const setCurrency = useCallback((cfg: CurrencyConfig) => {
    setCurrencyState(cfg);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_currency', JSON.stringify(cfg));
    }
  }, []);

  const setDemoUser = useCallback((role: UserRole) => {
    const idMap: Record<UserRole, string> = {
      admin: 'demo-admin-id',
      warehouse: 'demo-warehouse-id',
      consignee: 'demo-consignee-id',
    };
    const emailMap: Record<UserRole, string> = {
      admin: 'admin@local.test',
      warehouse: 'almacen@local.test',
      consignee: 'socio@local.test',
    };
    const nameMap: Record<UserRole, string> = {
      admin: 'Admin (Demo)',
      warehouse: 'Almacenista (Demo)',
      consignee: 'Concesionario (Demo)',
    };
    const demoProfile: Profile = {
      id: idMap[role],
      email: emailMap[role],
      name: nameMap[role],
      role,
      active: true,
      created_at: new Date().toISOString(),
    };
    setProfile(demoProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_profile', JSON.stringify(demoProfile));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemo) {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('demo_profile');
          if (saved) {
            setProfile(JSON.parse(saved));
          } else {
            setProfile(null);
          }
          const savedCurrency = localStorage.getItem('app_currency');
          if (savedCurrency) {
            setCurrencyState(JSON.parse(savedCurrency));
          }
        }
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        const typed = prof as Profile;
        if (typed.active === false) {
          await supabase.auth.signOut();
          setProfile(null);
          return;
        }
        setProfile(typed);
      } else {
        setProfile({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || 'Usuario',
          role: 'consignee',
          active: true,
          created_at: user.created_at,
        });
      }

      const { data: settingsRows } = await supabase.from('app_settings').select('key, value');
      if (settingsRows && settingsRows.length > 0) {
        const map = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
        if (map.currency) {
          setCurrencyState({
            code: map.currency,
            symbol: map.currency_symbol || '$',
            locale: map.currency_locale || 'en-US',
          });
        }
        if (map.default_language && !localStorage.getItem('calc_locale')) {
          const lang = map.default_language as Locale;
          if (dictionaries[lang]) {
            setLocaleState(lang);
          }
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  const signOut = useCallback(async () => {
    if (isDemo) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('demo_profile');
      }
      setProfile(null);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
  }, [isDemo]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (typeof window !== 'undefined') {
        const savedLoc = localStorage.getItem('calc_locale') as Locale | null;
        if (savedLoc && dictionaries[savedLoc]) {
          if (active) setLocaleState(savedLoc);
          document.documentElement.lang = savedLoc;
        } else {
          const navLang = navigator.language.slice(0, 2) as Locale;
          if (dictionaries[navLang]) {
            if (active) setLocaleState(navLang);
            document.documentElement.lang = navLang;
          }
        }
      }
      if (active) {
        await refreshProfile();
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshProfile]);

  const formatMoney = useCallback(
    (amount: number) => fmtCurrency(amount, currency),
    [currency]
  );

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        t: dictionaries[locale],
        currency,
        setCurrency,
        formatMoney,
        profile,
        loading,
        isDemo,
        setDemoUser,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}

