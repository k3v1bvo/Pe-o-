'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calculator, Lock, Mail, ArrowLeft, Shield, Warehouse, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/components/providers/app-provider';
import { LOCALE_LABELS, type Locale } from '@/i18n/dictionaries';

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale, isDemo, setDemoUser, refreshProfile, profile } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      router.replace('/dashboard');
    }
  }, [profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isDemo) {
        setDemoUser('admin');
        router.push('/dashboard');
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || t.auth.invalidCredentials);
        return;
      }

      await refreshProfile();
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError(t.auth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d0b] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_55%)] pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <Calculator className="w-3.5 h-3.5" />
            <span>{t.auth.backToCalc}</span>
          </Link>

          <select
            aria-label="Language"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none"
          >
            {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>420 · Control</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{t.auth.loginTitle}</h1>
          <p className="text-sm text-zinc-400 mt-1">{t.auth.loginSubtitle}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              {t.auth.email}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required={!isDemo}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              {t.auth.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required={!isDemo}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-zinc-950 font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            {loading ? t.auth.signingIn : t.auth.signIn}
          </button>
        </form>

        {isDemo && (
          <div className="mt-6 pt-5 border-t border-zinc-800 space-y-2">
            <p className="text-xs text-zinc-400 text-center mb-2">{t.app.demoBanner}</p>
            <button
              type="button"
              onClick={() => {
                setDemoUser('admin');
                router.push('/dashboard');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-emerald-300 font-medium cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              {t.auth.demoAdminBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                setDemoUser('warehouse');
                router.push('/dashboard');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-amber-300 font-medium cursor-pointer"
            >
              <Warehouse className="w-4 h-4" />
              {t.auth.demoWarehouseBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

