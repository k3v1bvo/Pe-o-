'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { History, Delete, Globe, ArrowRight, Check } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { LOCALE_LABELS, type Locale } from '@/i18n/dictionaries';

type Operator = '+' | '-' | '×' | '÷' | null;

interface HistoryEntry {
  expression: string;
  result: string;
}

const UNLOCK_QUOTES: Record<Locale, { badge: string; headline: string; sub: string; cta: string }> = {
  es: {
    badge: 'FRECUENCIA 420 · ACCESO CONCEDIDO',
    headline: 'La balanza está lista, jefe.',
    sub: 'Bóveda privada sincronizada · Modo sigilo desactivado',
    cta: 'Entrar al sistema',
  },
  en: {
    badge: '420 SIGNAL · CLEARANCE GRANTED',
    headline: 'Scale calibrated. Welcome back.',
    sub: 'Encrypted vault synced · Stealth cloak lifted',
    cta: 'Enter vault',
  },
  pt: {
    badge: 'SINAL 420 · ACESSO LIBERADO',
    headline: 'Balança calibrada, chefe.',
    sub: 'Cofre privado sincronizado · Modo discreto desativado',
    cta: 'Entrar no sistema',
  },
  fr: {
    badge: 'FRÉQUENCE 420 · ACCÈS ACCORDÉ',
    headline: 'Balance calibrée. Bienvenue.',
    sub: 'Coffre privé synchronisé · Mode furtif levé',
    cta: 'Ouvrir le coffre',
  },
};

const EMBERS = [
  { left: '14%', delay: '0s', size: 'w-1.5 h-1.5' },
  { left: '22%', delay: '0.4s', size: 'w-2 h-2' },
  { left: '31%', delay: '1.1s', size: 'w-1 h-1' },
  { left: '39%', delay: '0.2s', size: 'w-1.5 h-1.5' },
  { left: '47%', delay: '0.9s', size: 'w-2 h-2' },
  { left: '54%', delay: '0.1s', size: 'w-1 h-1' },
  { left: '63%', delay: '0.7s', size: 'w-1.5 h-1.5' },
  { left: '72%', delay: '1.3s', size: 'w-2 h-2' },
  { left: '81%', delay: '0.5s', size: 'w-1.5 h-1.5' },
  { left: '88%', delay: '1.0s', size: 'w-1 h-1' },
];

function formatDisplayText(raw: string, errorLabel: string): string {
  if (raw === errorLabel || raw === 'NaN' || raw === 'Infinity') return errorLabel;
  if (raw === '-') return '-';

  const hasTrailingDot = raw.endsWith('.');
  const [intPart, decPart] = raw.split('.');
  const negative = intPart.startsWith('-');
  const unsigned = negative ? intPart.slice(1) : intPart;

  const grouped = unsigned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const signed = negative ? `-${grouped}` : grouped;

  if (decPart !== undefined) {
    return `${signed}.${decPart}`;
  }
  if (hasTrailingDot) {
    return `${signed}.`;
  }
  return signed;
}

export function CalculatorView() {
  const router = useRouter();
  const { locale, setLocale, t } = useApp();

  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expressionPreview, setExpressionPreview] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [unlocked420, setUnlocked420] = useState(false);

  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = t.app.publicTitle;
  }, [t.app.publicTitle]);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    };
  }, []);

  const compute = (a: number, b: number, op: Operator): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const formatResult = useCallback(
    (num: number): string => {
      if (!Number.isFinite(num)) return t.calc.error;
      const rounded = Math.round(num * 1e10) / 1e10;
      return String(rounded);
    },
    [t.calc.error]
  );

  const triggerUnlock420 = useCallback(() => {
    setUnlocked420(true);
    setShowHistory(false);
    setShowLangMenu(false);
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = setTimeout(() => {
      router.push('/login');
    }, 2350);
  }, [router]);

  const inputDigit = useCallback(
    (digit: string) => {
      if (unlocked420) return;
      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
      } else {
        setDisplay((prev) => {
          if (prev === '0' || prev === t.calc.error) return digit;
          if (prev.replace(/[^0-9]/g, '').length >= 12) return prev;
          return prev + digit;
        });
      }
    },
    [unlocked420, waitingForOperand, t.calc.error]
  );

  const inputDecimal = useCallback(() => {
    if (unlocked420) return;
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    setDisplay((prev) => (prev.includes('.') ? prev : prev + '.'));
  }, [unlocked420, waitingForOperand]);

  const clearAll = useCallback(() => {
    if (unlocked420) return;
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpressionPreview('');
  }, [unlocked420]);

  const backspace = useCallback(() => {
    if (unlocked420 || waitingForOperand) return;
    setDisplay((prev) => {
      if (prev.length <= 1 || prev === t.calc.error) return '0';
      const next = prev.slice(0, -1);
      return next === '-' ? '0' : next;
    });
  }, [unlocked420, waitingForOperand, t.calc.error]);

  const toggleSign = useCallback(() => {
    if (unlocked420) return;
    setDisplay((prev) => {
      const n = parseFloat(prev);
      if (Number.isNaN(n) || n === 0) return prev;
      return String(-n);
    });
  }, [unlocked420]);

  const inputPercent = useCallback(() => {
    if (unlocked420) return;
    const n = parseFloat(display);
    if (Number.isNaN(n)) return;
    setDisplay(formatResult(n / 100));
  }, [unlocked420, display, formatResult]);

  const handleOperator = useCallback(
    (nextOp: Exclude<Operator, null>) => {
      if (unlocked420) return;
      const inputValue = parseFloat(display);
      if (Number.isNaN(inputValue)) return;

      if (prevValue === null) {
        setPrevValue(inputValue);
        setExpressionPreview(`${inputValue} ${nextOp}`);
      } else if (operator && !waitingForOperand) {
        const result = compute(prevValue, inputValue, operator);
        const formatted = formatResult(result);
        setDisplay(formatted);
        setPrevValue(Number.isFinite(result) ? result : null);
        setExpressionPreview(`${formatted} ${nextOp}`);
      } else {
        setExpressionPreview(`${prevValue} ${nextOp}`);
      }

      setOperator(nextOp);
      setWaitingForOperand(true);
    },
    [unlocked420, display, prevValue, operator, waitingForOperand, formatResult]
  );

  const handleEquals = useCallback(() => {
    if (unlocked420) return;
    const inputValue = parseFloat(display);
    if (Number.isNaN(inputValue)) return;

    if (operator && prevValue !== null) {
      const result = compute(prevValue, inputValue, operator);
      const formatted = formatResult(result);
      const expr = `${prevValue} ${operator} ${inputValue}`;

      setHistory((prev) => [{ expression: expr, result: formatted }, ...prev].slice(0, 15));
      setExpressionPreview(`${expr} =`);
      setDisplay(formatted);
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);

      if (Number.isFinite(result) && Math.abs(result - 420) < 1e-9) {
        triggerUnlock420();
      }
    } else if (Math.abs(inputValue - 420) < 1e-9) {
      triggerUnlock420();
    }
  }, [unlocked420, display, operator, prevValue, triggerUnlock420, formatResult]);

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
      else if (e.key === '.' || e.key === ',') inputDecimal();
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('×');
      else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === '%') inputPercent();
      else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') backspace();
      else if (e.key === 'Escape') clearAll();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    inputDigit,
    inputDecimal,
    handleOperator,
    inputPercent,
    handleEquals,
    backspace,
    clearAll,
  ]);

  const formattedDisplay = formatDisplayText(display, t.calc.error);
  const displaySizeClass =
    formattedDisplay.length >= 12
      ? 'text-[36px] sm:text-[38px]'
      : formattedDisplay.length >= 9
      ? 'text-[44px] sm:text-[48px]'
      : formattedDisplay.length >= 7
      ? 'text-[54px] sm:text-[56px]'
      : 'text-[66px] sm:text-[64px]';

  const keyBase =
    'aspect-square w-full rounded-full flex items-center justify-center select-none cursor-pointer transition-all duration-100 active:scale-[0.93] active:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40';
  const keyFunc = `${keyBase} bg-[#a5a5a5] hover:bg-[#b8b8b8] text-[#050505] text-[22px] font-medium`;
  const keyNum = `${keyBase} bg-[#333336] hover:bg-[#444448] text-white text-[28px] font-normal`;
  const keyOp = (op: Exclude<Operator, null>) =>
    `${keyBase} text-[28px] font-medium ${
      operator === op && waitingForOperand
        ? 'bg-white text-[#ff9f0a]'
        : 'bg-[#ff9f0a] hover:bg-[#ffb340] text-white'
    }`;

  const quote = UNLOCK_QUOTES[locale];

  return (
    <div className="min-h-[100dvh] w-full bg-black sm:bg-[#0b0b0d] text-white flex items-stretch sm:items-center justify-center sm:p-6 relative overflow-hidden">
      {/* Calculator Chassis — full-screen native on mobile, precision handset frame on desktop */}
      <div
        className="w-full sm:max-w-[368px] min-h-[100dvh] sm:min-h-[710px] bg-black sm:rounded-[44px] sm:ring-1 sm:ring-white/[0.12] sm:shadow-[0_32px_90px_rgba(0,0,0,0.9)] flex flex-col justify-between px-5 pt-4 pb-6 sm:px-6 sm:pt-5 sm:pb-7 relative z-10"
        onClick={() => {
          if (showLangMenu) setShowLangMenu(false);
        }}
      >
        {/* Minimal Native Top Bar */}
        <div className="flex items-center justify-between h-10 relative">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowHistory((v) => !v);
                setShowLangMenu(false);
              }}
              aria-label={t.calc.history}
              title={t.calc.history}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                showHistory
                  ? 'bg-white/15 text-[#ff9f0a]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <History className="w-[18px] h-[18px]" />
            </button>
            <span className="text-[13px] font-medium tracking-tight text-zinc-400">
              {t.app.publicTitle}
            </span>
          </div>

          {/* Discreet Language Popover Trigger */}
          <div
            className="relative"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              onClick={() => setShowLangMenu((v) => !v)}
              aria-label="Language"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                showLangMenu
                  ? 'bg-white/15 text-white'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/10'
              }`}
            >
              <Globe className="w-[17px] h-[17px]" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1.5 w-40 rounded-2xl bg-[#1c1c1e] border border-white/10 shadow-2xl py-1.5 z-30">
                {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setLocale(code);
                      setShowLangMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs flex items-center justify-between text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span>{LOCALE_LABELS[code]}</span>
                    {locale === code && <Check className="w-3.5 h-3.5 text-[#ff9f0a]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Display / History Container */}
        <div className="flex-1 flex flex-col justify-end relative min-h-[168px] py-4">
          {showHistory ? (
            <div className="absolute inset-0 bg-[#111113]/95 rounded-3xl border border-white/[0.08] p-4 flex flex-col justify-between z-20">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <span className="text-xs font-medium text-zinc-400">{t.calc.history}</span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="text-xs font-medium text-[#ff9f0a] hover:text-[#ffb340] cursor-pointer"
                  >
                    {t.calc.clearHistory}
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-zinc-500">
                  {t.calc.emptyHistory}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto py-2 space-y-1">
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDisplay(item.result);
                        setShowHistory(false);
                      }}
                      className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <div className="text-[11px] text-zinc-500 tabular-nums">
                        {item.expression} =
                      </div>
                      <div className="text-base font-medium text-zinc-100 tabular-nums">
                        {formatDisplayText(item.result, t.calc.error)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="text-right px-1 select-none">
            <div className="text-[17px] text-zinc-500 min-h-[26px] truncate tabular-nums">
              {expressionPreview}
            </div>
            <div
              data-testid="calc-display"
              className={`${displaySizeClass} font-light leading-none tracking-tight text-white tabular-nums truncate mt-1 transition-[font-size] duration-150`}
            >
              {formattedDisplay}
            </div>
          </div>
        </div>

        {/* Authentic 4x5 Tactile Circular Keypad */}
        <div className="grid grid-cols-4 gap-3 pt-2">
          <button type="button" onClick={clearAll} className={keyFunc}>
            {display === '0' && prevValue === null ? 'AC' : 'C'}
          </button>
          <button type="button" onClick={toggleSign} className={keyFunc}>
            +/−
          </button>
          <button type="button" onClick={inputPercent} className={keyFunc}>
            %
          </button>
          <button type="button" onClick={() => handleOperator('÷')} className={keyOp('÷')}>
            ÷
          </button>

          <button type="button" onClick={() => inputDigit('7')} className={keyNum}>
            7
          </button>
          <button type="button" onClick={() => inputDigit('8')} className={keyNum}>
            8
          </button>
          <button type="button" onClick={() => inputDigit('9')} className={keyNum}>
            9
          </button>
          <button type="button" onClick={() => handleOperator('×')} className={keyOp('×')}>
            ×
          </button>

          <button type="button" onClick={() => inputDigit('4')} className={keyNum}>
            4
          </button>
          <button type="button" onClick={() => inputDigit('5')} className={keyNum}>
            5
          </button>
          <button type="button" onClick={() => inputDigit('6')} className={keyNum}>
            6
          </button>
          <button type="button" onClick={() => handleOperator('-')} className={keyOp('-')}>
            −
          </button>

          <button type="button" onClick={() => inputDigit('1')} className={keyNum}>
            1
          </button>
          <button type="button" onClick={() => inputDigit('2')} className={keyNum}>
            2
          </button>
          <button type="button" onClick={() => inputDigit('3')} className={keyNum}>
            3
          </button>
          <button type="button" onClick={() => handleOperator('+')} className={keyOp('+')}>
            +
          </button>

          <button type="button" onClick={backspace} className={keyNum} aria-label="Backspace">
            <Delete className="w-6 h-6" />
          </button>
          <button type="button" onClick={() => inputDigit('0')} className={keyNum}>
            0
          </button>
          <button type="button" onClick={inputDecimal} className={keyNum}>
            .
          </button>
          <button
            type="button"
            onClick={handleEquals}
            className={`${keyBase} bg-[#ff9f0a] hover:bg-[#ffb340] text-white text-[30px] font-medium`}
          >
            =
          </button>
        </div>
      </div>

      {/* Epic 420 Portal Animation */}
      {unlocked420 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030705]/95 backdrop-blur-2xl overflow-hidden">
          <div className="vault-grid absolute inset-0 opacity-40 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.22),_transparent_58%)] pointer-events-none" />

          {/* Expanding Concentric Sonar Rings */}
          <div className="absolute w-64 h-64 rounded-full border border-emerald-400/40 animate-ring-1 pointer-events-none" />
          <div className="absolute w-64 h-64 rounded-full border border-teal-300/30 animate-ring-2 pointer-events-none" />
          <div className="absolute w-64 h-64 rounded-full border border-lime-300/25 animate-ring-3 pointer-events-none" />

          {/* Rising Floating Emerald Embers */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none">
            {EMBERS.map((ember, idx) => (
              <span
                key={idx}
                style={{ left: ember.left, animationDelay: ember.delay }}
                className={`absolute bottom-10 ${ember.size} rounded-full bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-ember`}
              />
            ))}
          </div>

          <div className="relative z-10 text-center px-6 max-w-md w-full animate-portal-reveal">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold tracking-[0.18em] uppercase mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{quote.badge}</span>
            </div>

            <div className="text-[104px] sm:text-[128px] leading-none font-black tracking-tighter font-mono tabular-nums bg-gradient-to-b from-emerald-200 via-emerald-400 to-teal-500 bg-clip-text text-transparent animate-glow-420 select-none">
              420
            </div>

            <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {quote.headline}
            </h2>
            <p className="mt-2 text-sm text-emerald-200/75">{quote.sub}</p>

            <div className="mt-8 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-300 to-lime-400 animate-progress-420" />
            </div>

            <button
              type="button"
              onClick={() => {
                if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
                router.push('/login');
              }}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-emerald-200 transition-colors cursor-pointer"
            >
              <span>{quote.cta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
