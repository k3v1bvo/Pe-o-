'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/components/providers/app-provider';
import { BrandLogo } from '@/components/ui/brand-logo';
import type { UserRole } from '@/types/database';

interface InviteCheck {
  valid: boolean;
  reason?: string;
  role?: UserRole;
  email?: string | null;
}

function InviteFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { refreshProfile, t } = useApp();

  const [checking, setChecking] = useState(Boolean(token));
  const [inviteInfo, setInviteInfo] = useState<InviteCheck | null>(
    token ? null : { valid: false, reason: 'missing' }
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error: rpcErr } = await supabase.rpc('check_invitation', {
          invite_token: token,
        });
        if (!active) return;
        if (rpcErr || !data) {
          setInviteInfo({ valid: false, reason: 'not_found' });
        } else {
          const parsed = data as InviteCheck;
          setInviteInfo(parsed);
          if (parsed.email) setEmail(parsed.email);
        }
      } finally {
        if (active) setChecking(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            invite_token: token,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        await refreshProfile();
        const target = inviteInfo?.role === 'seller' ? '/consignments' : '/dashboard';
        router.push(target);
      } else {
        setSuccessMsg(
          'Cuenta creada. Revisa tu correo para confirmar o inicia sesión en /login.'
        );
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo completar el registro');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center gap-2.5 text-zinc-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        <span>{t.app.loading}</span>
      </div>
    );
  }

  if (!inviteInfo?.valid) {
    return (
      <div className="w-full max-w-md obsidian-card rounded-3xl p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7 text-rose-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Acceso Solo por Invitación</h1>
          <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
            Este enlace de invitación es inválido, ya fue usado o expiró. Solicita uno nuevo al
            administrador.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-sm font-medium text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] obsidian-card rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <BrandLogo size="sm" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-xs font-medium">
          <UserPlus className="w-3.5 h-3.5" />
          <span>
            {inviteInfo.role === 'admin'
              ? t.auth.roleAdmin
              : inviteInfo.role === 'seller'
              ? t.auth.roleSeller
              : t.auth.roleWarehouse}
          </span>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Activar Cuenta</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Completa tus datos para unirte al espacio privado.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {successMsg ? (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm space-y-4">
          <div className="flex items-start gap-2.5 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
          <Link
            href="/login"
            className="block w-full text-center py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-sm"
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">{t.users.name}</label>
            <div className="flex items-center bg-[#060807] border border-white/10 focus-within:border-emerald-400/70 rounded-2xl transition-colors">
              <User className="w-4 h-4 text-zinc-500 ml-3.5 shrink-0" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">{t.auth.email}</label>
            <div className="flex items-center bg-[#060807] border border-white/10 focus-within:border-emerald-400/70 rounded-2xl transition-colors">
              <Mail className="w-4 h-4 text-zinc-500 ml-3.5 shrink-0" />
              <input
                type="email"
                required
                readOnly={Boolean(inviteInfo.email)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none read-only:opacity-70"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              {t.auth.password}
            </label>
            <div className="flex items-center bg-[#060807] border border-white/10 focus-within:border-emerald-400/70 rounded-2xl transition-colors">
              <Lock className="w-4 h-4 text-zinc-500 ml-3.5 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-3.5 py-2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-[#04120a] font-semibold text-sm shadow-[0_10px_30px_-8px_rgba(16,185,129,0.5)] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? t.app.loading : 'Activar Cuenta'}</span>
          </button>
        </form>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-[100dvh] bg-[#060807] text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="vault-grid absolute inset-0 opacity-60 pointer-events-none" />
      <div className="absolute -top-40 left-1/3 w-[480px] h-[480px] rounded-full bg-emerald-500/[0.08] blur-[140px] pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={<div className="text-zinc-400 text-sm">Cargando...</div>}>
          <InviteFormInner />
        </Suspense>
      </div>
    </div>
  );
}
