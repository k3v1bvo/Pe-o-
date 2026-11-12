'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Link2,
  ShieldAlert,
  Ban,
  CheckCircle2,
  KeyRound,
  Search,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { createClient } from '@/lib/supabase/client';
import {
  createInvitation,
  deleteInvitation,
  getInvitations,
  getProfiles,
  updateProfileActive,
  updateProfileRole,
} from '@/lib/data-service';
import type { Invitation, Profile, UserRole } from '@/types/database';

export default function UsersPage() {
  const { profile, t, isDemo } = useApp();
  const router = useRouter();
  const isAdmin = profile?.role === 'admin';

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('seller');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [profile, isAdmin, router]);

  const loadData = useCallback(async () => {
    try {
      const [p, inv] = await Promise.all([getProfiles(), getInvitations()]);
      setProfiles(p);
      setInvitations(inv);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getProfiles(), getInvitations()])
      .then(([p, inv]) => {
        if (!active) return;
        setProfiles(p);
        setInvitations(inv);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setActionError('');
    setCreatingInvite(true);
    try {
      await createInvitation({
        role: inviteRole,
        email: inviteEmail.trim() || undefined,
        created_by: profile.id,
      });
      setInviteEmail('');
      await loadData();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'No se pudo generar la invitación.';
      setActionError(
        msg.includes('invitations_role_check')
          ? 'Falta aplicar la migración SQL de Supabase para validar los 3 perfiles (ver supabase/migrations/20261112_three_roles_cleanup.sql).'
          : msg
      );
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyInviteLink = async (inv: Invitation) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/invite?token=${inv.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendPasswordReset = async (u: Profile) => {
    setActionError('');
    setActionSuccess('');
    if (isDemo) {
      setActionError('En modo demo local no se envían correos reales; prueba con Supabase.');
      return;
    }
    if (!u.email) {
      setActionError('Este usuario no tiene un correo registrado.');
      return;
    }
    setResettingUserId(u.id);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/account?recovery=1`;
      const { error } = await supabase.auth.resetPasswordForEmail(u.email, {
        redirectTo,
      });
      if (error) {
        setActionError(error.message);
        return;
      }
      setActionSuccess(
        `Correo de reseteo enviado a ${u.email}. Al abrir el link entrará directo a poner nueva contraseña.`
      );
    } catch (err) {
      console.error(err);
      setActionError('No se pudo enviar el enlace de recuperación.');
    } finally {
      setResettingUserId(null);
    }
  };

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  if (!isAdmin || loading) return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.users.title}</h1>
        <p className="text-sm text-zinc-400 mt-1">{t.users.subtitle}</p>
      </div>

      {/* Role Guide (3 Roles Only) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            title: t.auth.roleSeller,
            tag: 'Concesión, Ventas y 50tas',
            desc: 'Ve lo que llevó, fecha/hora, precio de venta acordado, abonos, saldo, registra ventas y pide 50tas. Nunca ve costos reales ni proveedores.',
            tone: 'border-teal-500/25 bg-teal-500/[0.05] text-teal-300',
          },
          {
            title: t.auth.roleWarehouse,
            tag: 'Bodega y Pesaje',
            desc: 'Pesa lotes, sube fotos, arma bolsas (50/30/100) y registra gastos operativos sin ver costos ni ganancias.',
            tone: 'border-amber-500/25 bg-amber-500/[0.05] text-amber-300',
          },
          {
            title: t.auth.roleAdmin,
            tag: 'Dueño / Total',
            desc: 'Control total: costos reales (ej. 850/kg), margen neto, flujo de caja, concesiones, entregas, usuarios y ajustes.',
            tone: 'border-emerald-500/25 bg-emerald-500/[0.05] text-emerald-300',
          },
        ].map((card) => (
          <div key={card.title} className={`rounded-2xl border p-4 space-y-1.5 ${card.tone}`}>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{card.tag}</div>
            <div className="text-sm font-semibold text-white">{card.title}</div>
            <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Invite-Only Generator */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <span>Invitar Nuevo Usuario (Solo por Invitación)</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">Cómo invitar:</strong> 1) Elige el perfil (y opcional el
          correo) · 2) Dale a <strong className="text-zinc-200">Generar Link</strong> y copia el
          enlace · 3) Pásaselo por WhatsApp; al abrirlo él mismo pone su nombre y{' '}
          <strong className="text-zinc-200">crea su propia contraseña</strong> (tú nunca la ves).
        </p>

        {actionError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        <form onSubmit={handleCreateInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Correo del invitado (opcional)
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Ej: juan@correo.com (o dejar vacío)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Perfil asignado <span className="text-rose-400">*</span>
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
            >
              <option value="seller">{t.auth.roleSeller} (Concesiones, ventas y pedir 50tas)</option>
              <option value="warehouse">{t.auth.roleWarehouse} (Bodega y pesaje sin costos)</option>
              <option value="admin">{t.auth.roleAdmin} (Control total y costos)</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={creatingInvite}
            className="h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer disabled:opacity-60"
          >
            <Link2 className="w-4 h-4" />
            <span>Generar Link de Invitación</span>
          </button>
        </form>

        {invitations.length > 0 && (
          <div className="divide-y divide-zinc-800 pt-2">
            {invitations.map((inv) => {
              const used = Boolean(inv.used_at);
              return (
                <div
                  key={inv.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400">
                        {inv.token}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                        {inv.role === 'admin'
                          ? t.auth.roleAdmin
                          : inv.role === 'seller'
                          ? t.auth.roleSeller
                          : t.auth.roleWarehouse}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          used
                            ? 'bg-zinc-800 text-zinc-500'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {used ? 'Usada' : 'Disponible'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {inv.email ? `Solo para: ${inv.email}` : 'Cualquier correo'} · Expira:{' '}
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!used && (
                      <button
                        type="button"
                        onClick={() => copyInviteLink(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer"
                      >
                        {copiedId === inv.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteInvitation(inv.id);
                        await loadData();
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Existing Users */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Cuentas Registradas ({profiles.length})</h2>
            <p className="text-xs text-zinc-400">
              Cambia el perfil, suspende cuentas o envía un enlace de reseteo si olvidaron su contraseña.
            </p>
          </div>
          <div className="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="py-2 pr-4">{t.users.name}</th>
              <th className="py-2 pr-4">{t.users.email}</th>
              <th className="py-2 pr-4">{t.users.role}</th>
              <th className="py-2 pr-4">Estado</th>
              <th className="py-2 pr-4">Contraseña</th>
              <th className="py-2 pr-4">{t.users.createdAt}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {filteredProfiles.map((u) => {
              const isActive = u.active !== false;
              const isResetting = resettingUserId === u.id;
              return (
                <tr key={u.id}>
                  <td className="py-3 pr-4 font-medium text-white">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-zinc-300">{u.email}</td>
                  <td className="py-3 pr-4">
                    <select
                      value={u.role}
                      onChange={async (e) => {
                        setActionError('');
                        try {
                          await updateProfileRole(u.id, e.target.value as UserRole);
                          await loadData();
                        } catch (err) {
                          setActionError(
                            err instanceof Error ? err.message : 'Error actualizando rol.'
                          );
                        }
                      }}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200"
                    >
                      <option value="seller">{t.auth.roleSeller}</option>
                      <option value="warehouse">{t.auth.roleWarehouse}</option>
                      <option value="admin">{t.auth.roleAdmin}</option>
                    </select>
                  </td>
                  <td className="py-3 pr-4">
                    {u.id === profile?.id ? (
                      <span className="text-xs text-emerald-400">Activo (tú)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          setActionError('');
                          try {
                            await updateProfileActive(u.id, !isActive);
                            await loadData();
                          } catch (err) {
                            setActionError(
                              err instanceof Error
                                ? err.message
                                : 'Falta aplicar la migración SQL para suspender usuarios.'
                            );
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-300'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-emerald-500/15 hover:border-emerald-500/30 hover:text-emerald-300'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3" />
                            <span>Suspendido</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={() => handleSendPasswordReset(u)}
                      title="Enviar enlace por correo para crear nueva contraseña"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-xs text-amber-300 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>{isResetting ? 'Enviando...' : 'Resetear Clave'}</span>
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-xs text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
