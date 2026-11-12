'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Check } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { saveAppSettings } from '@/lib/data-service';
import { CURRENCY_PRESETS } from '@/types/database';
import { LOCALE_LABELS, type Locale } from '@/i18n/dictionaries';

export default function SettingsPage() {
  const { profile, t, currency, setCurrency, locale, setLocale } = useApp();
  const router = useRouter();
  const isAdmin = profile?.role === 'admin';

  const [selectedCode, setSelectedCode] = useState(currency.code);
  const [selectedLang, setSelectedLang] = useState<Locale>(locale);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [profile, isAdmin, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const preset = CURRENCY_PRESETS.find((c) => c.code === selectedCode) || CURRENCY_PRESETS[0];
    setCurrency(preset);
    setLocale(selectedLang);
    await saveAppSettings({
      currency: preset,
      default_language: selectedLang,
      updated_by: profile.id,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          <span>{t.settings.title}</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">{t.settings.subtitle}</p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5"
      >
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t.settings.currency}</label>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
          >
            {CURRENCY_PRESETS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t.settings.language}</label>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as Locale)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white"
          >
            {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm cursor-pointer"
          >
            {t.settings.saveSettings}
          </button>

          {saved && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="w-4 h-4" />
              {t.settings.savedSuccess}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

