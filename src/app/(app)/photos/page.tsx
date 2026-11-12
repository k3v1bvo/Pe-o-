'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { getLotPhotos, getLots } from '@/lib/data-service';
import type { InventoryLot, LotPhoto } from '@/types/database';

export default function PhotosPage() {
  const { t } = useApp();
  const [photos, setPhotos] = useState<LotPhoto[]>([]);
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [selectedLot, setSelectedLot] = useState('all');
  const [zoom, setZoom] = useState<LotPhoto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, l] = await Promise.all([getLotPhotos(), getLots()]);
        setPhotos(p);
        setLots(l);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (selectedLot === 'all') return photos;
    return photos.filter((p) => p.lot_id === selectedLot);
  }, [photos, selectedLot]);

  if (loading) return <div className="text-zinc-400 text-sm">{t.app.loading}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.photos.title}</h1>
          <p className="text-sm text-zinc-400 mt-1">{t.photos.subtitle}</p>
        </div>
        <select
          value={selectedLot}
          onChange={(e) => setSelectedLot(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white"
        >
          <option value="all">{t.photos.allLots}</option>
          {lots.map((l) => (
            <option key={l.id} value={l.id}>
              {l.strain?.name || 'Producto'} — {l.supplier}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-500 text-sm flex flex-col items-center gap-2">
          <Camera className="w-8 h-8 text-zinc-600" />
          <span>{t.photos.noPhotos}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((photo) => {
            const lot = lots.find((l) => l.id === photo.lot_id);
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setZoom(photo)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden text-left hover:border-emerald-500/40 transition-colors cursor-pointer"
              >
                <Image
                  src={photo.photo_url}
                  alt={photo.description || 'Scale photo'}
                  width={400}
                  height={176}
                  unoptimized
                  className="w-full h-44 object-cover"
                />
                <div className="p-3">
                  <div className="text-xs font-medium text-white truncate">
                    {lot?.supplier || 'Lote'}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {photo.description || new Date(photo.taken_at).toLocaleDateString()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setZoom(null)}
        >
          <button
            type="button"
            onClick={() => setZoom(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-3xl text-center">
            <Image
              src={zoom.photo_url}
              alt={zoom.description || 'Scale'}
              width={1024}
              height={1024}
              unoptimized
              className="max-h-[82vh] w-auto max-w-full rounded-2xl border border-zinc-700 mx-auto"
            />
            {zoom.description && (
              <p className="mt-3 text-sm text-zinc-300">{zoom.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

