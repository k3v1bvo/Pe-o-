'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Copy, Check, Trash2, Link2 } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import {
  createInvitation,
  deleteInvitation,
  getInvitations,
  getProfiles,
  updateProfileRole,
} from '@/lib/data-service';
import type { Invitation, Profile, UserRole } from '@/types/database';

export default function UsersPage() {
  const { profile, t } = useApp();
  const router = useRouter();
  const isAdmin = profile?.role === 'admin';

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('warehouse');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  if (!isAdmin || loading) return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.users.title}</h1>
        <p className="text-sm text-zinc-400 mt-1">{t.users.subtitle}</p>
      </div>

      {/* Invite-Only Generator */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <span>Invitar Nuevo Usuario (Solo por Invitación)</span>
        </div>

        <form onSubmit={handleCreateInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Correo (opcional: dejar vacío para cualquiera)"
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
          >
            <option value="warehouse">{t.auth.roleWarehouse}</option>
            <option value="admin">{t.auth.roleAdmin}</option>
          </select>
          <button
            type="submit"
            disabled={creatingInvite}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer disabled:opacity-60"
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
                        {inv.role === 'admin' ? t.auth.roleAdmin : t.auth.roleWarehouse}
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="py-2 pr-4">{t.users.name}</th>
              <th className="py-2 pr-4">{t.users.email}</th>
              <th className="py-2 pr-4">{t.users.role}</th>
              <th className="py-2 pr-4">{t.users.createdAt}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {profiles.map((u) => (
              <tr key={u.id}>
                <td className="py-3 pr-4 font-medium text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  {u.name}
                </td>
                <td className="py-3 pr-4 text-zinc-300">{u.email}</td>
                <td className="py-3 pr-4">
                  <select
                    value={u.role}
                    onChange={async (e) => {
                      await updateProfileRole(u.id, e.target.value as UserRole);
                      await loadData();
                    }}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200"
                  >
                    <option value="admin">{t.auth.roleAdmin}</option>
                    <option value="warehouse">{t.auth.roleWarehouse}</option>
                  </select>
                </td>
                <td className="py-3 pr-4 text-xs text-zinc-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
