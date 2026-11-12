'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useApp } from '@/components/providers/app-provider';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, t } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) {
      router.replace('/login');
    }
  }, [loading, profile, router]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#090d0b] text-zinc-400 flex items-center justify-center">
        <div className="animate-pulse text-sm">{t.app.loading}</div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

