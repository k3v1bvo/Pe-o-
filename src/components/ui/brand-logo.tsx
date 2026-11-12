import React from 'react';

interface BrandLogoProps {
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'vault' | 'stealth';
}

export function BrandLogo({ compact = false, size = 'md', variant = 'vault' }: BrandLogoProps) {
  const iconBox =
    size === 'lg'
      ? 'w-11 h-11 rounded-2xl'
      : size === 'sm'
      ? 'w-8 h-8 rounded-xl'
      : 'w-9 h-9 rounded-xl';

  const svgSize = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  if (variant === 'stealth') {
    return (
      <div className="inline-flex items-center gap-3 select-none">
        <div
          className={`${iconBox} relative flex items-center justify-center bg-[#14161C] border border-white/10 shadow-[0_6px_20px_rgba(0,0,0,0.45)] overflow-hidden`}
        >
          <svg viewBox="0 0 64 64" fill="none" className={svgSize} aria-hidden="true">
            <rect
              x="10"
              y="7"
              width="44"
              height="50"
              rx="7"
              fill="#1D2028"
              stroke="#3E4454"
              strokeWidth="1.8"
            />
            <rect x="14.5" y="11.5" width="35" height="10" rx="2.5" fill="#0D0F14" />
            <rect x="18" y="15.3" width="5" height="2.4" rx="1.2" fill="#FF9F0A" />
            <rect x="33" y="15.3" width="13" height="2.4" rx="1.2" fill="#E4E8F0" />
            <rect x="14.5" y="24.5" width="10" height="8" rx="2.4" fill="#383D4A" />
            <rect x="27" y="24.5" width="10" height="8" rx="2.4" fill="#383D4A" />
            <rect x="39.5" y="24.5" width="10" height="8" rx="2.4" fill="#383D4A" />
            <rect x="14.5" y="34.5" width="10" height="8" rx="2.4" fill="#2C303A" />
            <rect x="27" y="34.5" width="10" height="8" rx="2.4" fill="#2C303A" />
            <rect x="14.5" y="44.5" width="10" height="8" rx="2.4" fill="#2C303A" />
            <rect x="27" y="44.5" width="10" height="8" rx="2.4" fill="#2C303A" />
            <rect x="39.5" y="34.5" width="10" height="18" rx="2.4" fill="#FF9F0A" />
            <rect x="42" y="40.8" width="5" height="1.7" rx="0.85" fill="#14120E" />
            <rect x="42" y="44.5" width="5" height="1.7" rx="0.85" fill="#14120E" />
          </svg>
        </div>
        {!compact && (
          <div className="flex flex-col leading-none">
            <span
              className={`font-semibold tracking-tight text-white ${
                size === 'lg' ? 'text-xl' : 'text-base'
              }`}
            >
              Calcu<span className="text-[#ff9f0a]">ladora</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
              Calc Pro
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div
        className={`${iconBox} relative flex items-center justify-center bg-gradient-to-br from-emerald-500/20 via-[#0E1613] to-[#090D0B] border border-emerald-500/35 shadow-[0_6px_20px_rgba(16,185,129,0.18)] overflow-hidden`}
      >
        <svg viewBox="0 0 64 64" fill="none" className={svgSize} aria-hidden="true">
          <path
            d="M32 8L52 17V31C52 44.5 43.2 53.8 32 57C20.8 53.8 12 44.5 12 31V17L32 8Z"
            fill="#0A1410"
            stroke="#10B981"
            strokeWidth="2.4"
          />
          <path
            d="M21 27H43M32 20V44"
            stroke="#34D399"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M21 27L17.5 36.5C17.5 38.8 19.5 40.5 21.8 40.5C24.1 40.5 26 38.8 26 36.5L22.5 27"
            stroke="#FBBF24"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M41.5 27L38 36.5C38 38.8 39.9 40.5 42.2 40.5C44.5 40.5 46.5 38.8 46.5 36.5L43 27"
            stroke="#FBBF24"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M26 44H38" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-semibold tracking-tight text-white ${
              size === 'lg' ? 'text-xl' : 'text-base'
            }`}
          >
            Pagos <span className="text-emerald-400">&amp;</span>{' '}
            <span className="text-amber-400">Pesos</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
            Control Privado
          </span>
        </div>
      )}
    </div>
  );
}
