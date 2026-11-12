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

  const svgSize = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div
        className={`${iconBox} relative flex items-center justify-center bg-gradient-to-br from-emerald-400/20 via-emerald-500/10 to-zinc-900 border border-emerald-400/30 shadow-[0_0_24px_rgba(16,185,129,0.18)]`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`${svgSize} text-emerald-400`}
          aria-hidden="true"
        >
          <path
            d="M12 3V20M7 20H17"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M5 7.5L12 5.5L19 7.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 7.5L2.75 13.25C3.5 14.35 4.95 14.75 6.2 14.2C6.7 13.98 7.05 13.62 7.25 13.25L5 7.5Z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M19 7.5L16.75 13.25C17.5 14.35 18.95 14.75 20.2 14.2C20.7 13.98 21.05 13.62 21.25 13.25L19 7.5Z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-semibold tracking-tight text-white ${
              size === 'lg' ? 'text-xl' : 'text-base'
            }`}
          >
            Green<span className="text-emerald-400">Scale</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
            Control Suite
          </span>
        </div>
      )}
    </div>
  );
}

