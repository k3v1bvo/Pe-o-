'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calculator,
  Lock,
  Mail,
  ArrowLeft,
  Shield,
  Warehouse,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Scale,
  Camera,
  ShieldCheck,
  Globe,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/components/providers/app-provider';
import { LOCALE_LABELS, type Locale } from '@/i18n/dictionaries';
import { BrandLogo } from '@/components/ui/brand-logo';

const VAULT_COPY: Record<
  Locale,
  {
    eyebrow: string;
    heroTitle: string;
    heroDesc: string;
    spec1Title: string;
    spec1Sub: string;
    spec2Title: string;
    spec2Sub: string;
    spec3Title: string;
    spec3Sub: string;
    vaultTag: string;
  }
> = {
  es: {
    eyebrow: 'BÓVEDA PRIVADA · INVITE-ONLY',
    heroTitle: 'Control preciso de inventario, grameo y rentabilidad.',
    heroDesc:
      'Operación discreta diseñada para control de lotes, merma automática en báscula y ventas segmentadas por rol.',
    spec1Title: 'Pesaje & Merma Automática',
    spec1Sub: 'Control exacto de kilo, medio, cuarto, octavo y bolsas.',
    spec2Title: 'Evidencia Fotográfica',
    spec2Sub: 'Respaldo privado en la nube por cada lote y gasto.',
    spec3Title: 'Seguridad por Roles',
    spec3Sub: 'Acceso blindado entre administración y almacén.',
    vaultTag: 'Acceso Autorizado',
  },
  en: {
    eyebrow: 'PRIVATE VAULT · INVITE-ONLY',
    heroTitle: 'Precision inventory, grading, and margin control.',
    heroDesc:
      'Discreet operations suite built for batch tracking, automatic scale shrinkage, and role-isolated sales.',
    spec1Title: 'Scale & Auto Shrinkage',
    spec1Sub: 'Exact tracking for kilo, half, quarter, eighth, and bags.',
    spec2Title: 'Photo Verification',
    spec2Sub: 'Private cloud evidence per incoming lot and expense.',
    spec3Title: 'Role-Hardened Access',
    spec3Sub: 'Strict isolation between admin and warehouse staff.',
    vaultTag: 'Authorized Access',
  },
  pt: {
    eyebrow: 'COFRE PRIVADO · INVITE-ONLY',
    heroTitle: 'Controle preciso de estoque, gramatura e margem.',
    heroDesc:
      'Operação discreta feita para controle de lotes, quebra automática na balança e vendas por função.',
    spec1Title: 'Pesagem & Quebra Automática',
    spec1Sub: 'Controle exato de quilo, meio, quarto, oitavo e sacos.',
    spec2Title: 'Evidência Fotográfica',
    spec2Sub: 'Arquivo privado em nuvem para cada lote e despesa.',
    spec3Title: 'Segurança por Função',
    spec3Sub: 'Isolamento rigoroso entre admin e armazém.',
    vaultTag: 'Acesso Autorizado',
  },
  fr: {
    eyebrow: 'COFFRE PRIVÉ · SUR INVITATION',
    heroTitle: 'Contrôle précis des stocks, du pesage et des marges.',
    heroDesc:
      'Suite discrète conçue pour le suivi des lots, la perte automatique et les ventes cloisonnées par rôle.',
    spec1Title: 'Pesée & Perte Automatique',
    spec1Sub: 'Suivi exact au kilo, demi, quart, huitième et sachets.',
    spec2Title: 'Preuve Photographique',
    spec2Sub: 'Archivage cloud privé pour chaque lot et dépense.',
    spec3Title: 'Accès Cloisonné',
    spec3Sub: 'Séparation stricte entre direction et entrepôt.',
    vaultTag: 'Accès Autorisé',
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale, isDemo, setDemoUser, refreshProfile, profile } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState('');
  const [sendingRecovery, setSendingRecovery] = useState(false);

  const hasRecoveryQueryError = useSyncExternalStore(
    () => () => {},
    () => window.location.search.includes('error=recovery'),
    () => false
  );
  const displayError =
    error ||
    (hasRecoveryQueryError && !recoveryMsg
      ? 'El enlace de recuperación expiró o ya fue usado. Solicita uno nuevo abajo.'
      : '');

  useEffect(() => {
    if (profile) {
      const target = profile.role === 'seller' ? '/consignments' : '/dashboard';
      router.replace(target);
    }
  }, [profile, router]);

  const handleForgotPassword = async () => {
    setError('');
    setRecoveryMsg('');
    if (isDemo) {
      setRecoveryMsg('En modo demo usa los botones rápidos de abajo para cambiar de perfil.');
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Escribe tu correo electrónico arriba para enviarte el enlace de recuperación.');
      return;
    }
    setSendingRecovery(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/account?recovery=1`;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });
      if (resetErr) {
        setError(resetErr.message);
        return;
      }
      setRecoveryMsg(
        `Enlace de recuperación enviado a ${cleanEmail}. Revisa tu correo (o spam) y abre el link para elegir nueva contraseña.`
      );
    } catch (err) {
      console.error(err);
      setError('No se pudo enviar el enlace de recuperación.');
    } finally {
      setSendingRecovery(false);
    }
  };

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
    } catch (err) {
      console.error(err);
      setError(t.auth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const copy = VAULT_COPY[locale];

  return (
    <div className="min-h-[100dvh] bg-[#060807] text-zinc-100 relative overflow-hidden flex flex-col lg:grid lg:grid-cols-12">
      {/* Ambient Background Layers */}
      <div className="vault-grid absolute inset-0 opacity-60 pointer-events-none" />
      <div className="absolute -top-40 left-1/4 w-[540px] h-[540px] rounded-full bg-emerald-500/[0.09] blur-[140px] pointer-events-none" />

      {/* Desktop Left Editorial Panel */}
      <section className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 xl:p-16 border-r border-white/[0.06] relative z-10">
        <div className="flex items-center justify-between">
          <BrandLogo size="lg" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.auth.backToCalc}</span>
          </Link>
        </div>

        <div className="max-w-xl my-auto py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-[11px] font-semibold tracking-[0.16em] uppercase mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{copy.eyebrow}</span>
          </div>

          <h1 className="text-4xl xl:text-[42px] font-semibold tracking-tight text-white leading-[1.12]">
            {copy.heroTitle}
          </h1>
          <p className="mt-4 text-base text-zinc-400 leading-relaxed max-w-lg">{copy.heroDesc}</p>

          <div className="mt-10 grid grid-cols-1 gap-3.5">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-100">{copy.spec1Title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{copy.spec1Sub}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 text-teal-300" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-100">{copy.spec2Title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{copy.spec2Sub}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-100">{copy.spec3Title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{copy.spec3Sub}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Supabase RLS · Auth Token Verification</span>
          <span className="font-mono text-zinc-600">v2.0 · Vault</span>
        </div>
      </section>

      {/* Right Sign-In Column (and full mobile view) */}
      <section className="flex-1 lg:col-span-5 flex flex-col justify-center items-center p-5 sm:p-8 lg:p-12 relative z-10">
        {/* Top Utility Strip (Mobile logo + Back + Language) */}
        <div className="w-full max-w-[420px] flex items-center justify-between mb-6">
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.app.publicTitle}</span>
          </Link>

          <div className="hidden lg:block text-xs text-zinc-500 font-medium">{copy.vaultTag}</div>

          <div className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.09] rounded-full px-3 py-1.5">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <select
              aria-label="Language"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="bg-transparent text-xs font-medium text-zinc-200 focus:outline-none cursor-pointer"
            >
              {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
                <option key={code} value={code} className="bg-zinc-900 text-zinc-100">
                  {LOCALE_LABELS[code]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Obsidian Vault Card */}
        <div className="w-full max-w-[420px] obsidian-card rounded-3xl p-6 sm:p-8">
          <div className="lg:hidden mb-6">
            <BrandLogo size="md" />
          </div>

          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-[11px] font-semibold tracking-wider uppercase mb-3">
              <Lock className="w-3 h-3" />
              <span>420 · Vault</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {t.auth.loginTitle}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">{t.auth.loginSubtitle}</p>
          </div>

          {displayError && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          {recoveryMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{recoveryMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-zinc-300 mb-2"
              >
                {t.auth.email}
              </label>
              <div className="relative flex items-center bg-[#060807] border border-white/10 focus-within:border-emerald-400/70 focus-within:ring-2 focus-within:ring-emerald-500/15 rounded-2xl transition-all">
                <Mail className="w-4 h-4 text-zinc-500 ml-3.5 shrink-0" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required={!isDemo}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-zinc-300 mb-2"
              >
                {t.auth.password}
              </label>
              <div className="relative flex items-center bg-[#060807] border border-white/10 focus-within:border-emerald-400/70 focus-within:ring-2 focus-within:ring-emerald-500/15 rounded-2xl transition-all">
                <Lock className="w-4 h-4 text-zinc-500 ml-3.5 shrink-0" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required={!isDemo}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="px-3.5 py-2 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={sendingRecovery}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {sendingRecovery ? 'Enviando enlace...' : '¿Olvidaste tu contraseña? Recuperar por correo'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 disabled:opacity-60 text-[#04120a] font-semibold text-sm shadow-[0_10px_30px_-8px_rgba(16,185,129,0.55)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? t.auth.signingIn : t.auth.signIn}</span>
            </button>
          </form>

          {isDemo && (
            <div className="mt-6 pt-5 border-t border-white/[0.08] space-y-2">
              <p className="text-[11px] text-zinc-400 text-center mb-2">{t.app.demoBanner}</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDemoUser('admin');
                    router.push('/dashboard');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-xs text-emerald-300 font-medium cursor-pointer transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDemoUser('warehouse');
                    router.push('/dashboard');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-xs text-amber-300 font-medium cursor-pointer transition-colors"
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>Almacén</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDemoUser('seller');
                    router.push('/consignments');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/25 text-xs text-teal-300 font-medium cursor-pointer transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Ventas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
