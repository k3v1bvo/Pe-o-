'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/components/providers/app-provider';

interface InviteCheck {
  valid: boolean;
  reason?: string;
  role?: 'admin' | 'warehouse';
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
        router.push('/dashboard');
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
    return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;
  }

  if (!inviteInfo?.valid) {
    return (
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h1 className="text-xl font-bold text-white">Acceso Solo por Invitación</h1>
        <p className="text-sm text-zinc-400">
          Este enlace de invitación es inválido, ya fue usado o expiró. Solicita uno nuevo al
          administrador.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-medium mb-2">
          <UserPlus className="w-3.5 h-3.5" />
          <span>
            Invitación · {inviteInfo.role === 'admin' ? t.auth.roleAdmin : t.auth.roleWarehouse}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Crear Cuenta</h1>
        <p className="text-sm text-zinc-400 mt-1">Completa tus datos para activar tu acceso.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {successMsg ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
          <Link href="/login" className="block text-center underline text-emerald-200">
            Ir a Iniciar Sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t.users.name}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t.auth.email}</label>
            <input
              type="email"
              required
              readOnly={Boolean(inviteInfo.email)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white read-only:opacity-70"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">{t.auth.password}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer disabled:opacity-60"
          >
            {submitting ? t.app.loading : 'Activar Cuenta'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-[#090d0b] text-zinc-100 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-zinc-400 text-sm">Cargando...</div>}>
        <InviteFormInner />
      </Suspense>
    </div>
  );
}
