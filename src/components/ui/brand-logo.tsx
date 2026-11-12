import React from 'react';

interface BrandLogoProps {
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ compact = false, size = 'md' }: BrandLogoProps) {
  const iconBox =
    size === 'lg'
      ? 'w-11 h-11 rounded-2xl'
      : size === 'sm'
      ? 'w-8 h-8 rounded-xl'
      : 'w-9 h-9 rounded-xl';

  const svgSize = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

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
