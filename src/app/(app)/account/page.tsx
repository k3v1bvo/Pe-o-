'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { KeyRound, ShieldCheck, User, Check, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { createClient } from '@/lib/supabase/client';
import { updateOwnProfileName } from '@/lib/data-service';

export default function AccountPage() {
  const { profile, refreshProfile, isDemo, t } = useApp();

  const [displayName, setDisplayName] = useState(profile?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [recoveryEvent, setRecoveryEvent] = useState(false);
  const hasRecoveryQuery = useSyncExternalStore(
    () => () => {},
    () => window.location.search.includes('recovery=1'),
    () => false
  );
  const recoveryMode = recoveryEvent || hasRecoveryQuery;

  useEffect(() => {
    if (isDemo) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryEvent(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [isDemo]);

  const roleLabel =
    profile?.role === 'admin'
      ? t.auth.roleAdmin
      : profile?.role === 'seller'
      ? t.auth.roleSeller
      : t.auth.roleWarehouse;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameMsg('');
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      await updateOwnProfileName(displayName.trim());
      await refreshProfile();
      setNameMsg('Nombre actualizado');
    } catch (err) {
      console.error(err);
      setNameMsg('No se pudo actualizar el nombre (verifica la migración en Supabase).');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 6) {
      setPassError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Las contraseñas no coinciden.');
      return;
    }
    if (isDemo) {
      setPassError('En modo demo local no hay contraseña real; inicia con Supabase.');
      return;
    }

    setSavingPass(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPassError(error.message);
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      setPassSuccess('Contraseña actualizada correctamente. Ya puedes entrar con la nueva.');
    } catch (err) {
      console.error(err);
      setPassError('No se pudo actualizar la contraseña.');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <KeyRound className="w-6 h-6 text-emerald-400" />
          <span>{t.nav.account}</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Administra tu nombre visible y cambia tu contraseña de acceso de forma segura.
        </p>
      </div>

      {recoveryMode && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/35 text-amber-200 text-xs sm:text-sm leading-relaxed">
          <strong className="text-amber-100">Recuperación de contraseña activada:</strong> ya
          entraste con tu enlace seguro. Escribe y confirma tu nueva contraseña abajo para recuperar
          tu cuenta.
        </div>
      )}

      {/* Identity Card */}
      <div className="obsidian-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-zinc-400">Sesión actual</div>
          <div className="text-base font-semibold text-white">{profile?.email}</div>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{roleLabel}</span>
        </span>
      </div>

      {/* Display Name */}
      <form onSubmit={handleSaveName} className="obsidian-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <User className="w-4 h-4 text-emerald-400" />
          <span>Nombre visible</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={profile?.name || 'Tu nombre'}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
          />
          <button
            type="submit"
            disabled={savingName}
            className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-sm font-medium text-white cursor-pointer disabled:opacity-60"
          >
            {savingName ? 'Guardando...' : 'Guardar Nombre'}
          </button>
        </div>
        {nameMsg && <p className="text-xs text-emerald-300">{nameMsg}</p>}
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="obsidian-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Cambiar mi Contraseña</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Cada usuario elige su propia contraseña al aceptar su invitación y puede cambiarla aquí en
          cualquier momento sin intervención del administrador.
        </p>

        {passError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{passError}</span>
          </div>
        )}
        {passSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{passSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Nueva contraseña</label>
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl">
              <input
                type={showPass ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="px-3 text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Confirmar contraseña</label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPass}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer disabled:opacity-60"
        >
          {savingPass ? 'Actualizando...' : 'Actualizar Contraseña'}
        </button>
      </form>
    </div>
  );
}

