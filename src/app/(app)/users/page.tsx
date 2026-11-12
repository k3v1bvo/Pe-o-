'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Info } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { getProfiles, updateProfileRole } from '@/lib/data-service';
import type { Profile, UserRole } from '@/types/database';

export default function UsersPage() {
  const { profile, t } = useApp();
  const router = useRouter();
  const isAdmin = profile?.role === 'admin';

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [profile, isAdmin, router]);

  const loadData = useCallback(async () => {
    try {
      const data = await getProfiles();
      setProfiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getProfiles()
      .then((data) => {
        if (active) setProfiles(data);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!isAdmin || loading) return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.users.title}</h1>
        <p className="text-sm text-zinc-400 mt-1">{t.users.subtitle}</p>
      </div>

      <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-sm flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{t.users.howToAdd}</span>
      </div>

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

