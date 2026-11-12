'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { History, Delete, Globe, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { LOCALE_LABELS, type Locale } from '@/i18n/dictionaries';

type Operator = '+' | '-' | '×' | '÷' | null;

interface HistoryEntry {
  expression: string;
  result: string;
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
  const [unlocked420, setUnlocked420] = useState(false);

  useEffect(() => {
    document.title = t.app.publicTitle;
  }, [t.app.publicTitle]);

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
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2200);
    return () => clearTimeout(timer);
  }, [router]);

  const inputDigit = useCallback(
    (digit: string) => {
      if (unlocked420) return;
      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
      } else {
        setDisplay((prev) => (prev === '0' || prev === t.calc.error ? digit : prev + digit));
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
    } else if (Math.abs(inputValue - 420) < 1e-9 && expressionPreview !== '') {
      triggerUnlock420();
    }
  }, [unlocked420, display, operator, prevValue, expressionPreview, triggerUnlock420, formatResult]);

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
      else if (e.key === '.') inputDecimal();
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

  const btnBase =
    'h-16 sm:h-[70px] rounded-2xl text-xl font-medium transition-all active:scale-95 flex items-center justify-center select-none cursor-pointer';
  const btnNum = `${btnBase} bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-100 border border-zinc-700/40`;
  const btnFunc = `${btnBase} bg-zinc-700/70 hover:bg-zinc-600/80 text-zinc-100 border border-zinc-600/30`;
  const btnOp = `${btnBase} bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-lg shadow-amber-500/15`;

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle neutral backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_55%)] pointer-events-none" />

      {/* Main Calculator Shell */}
      <div className="w-full max-w-sm bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-zinc-800/70">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-200">
              {t.app.publicTitle}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
              {t.calc.standard}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-800/80 rounded-lg px-2 py-1 border border-zinc-700/50">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <select
                aria-label="Language"
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
              >
                {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
                  <option key={code} value={code} className="bg-zinc-900 text-zinc-100">
                    {code.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              title={t.calc.history}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showHistory
                  ? 'bg-zinc-700 text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Drawer */}
        {showHistory && (
          <div className="bg-zinc-950/80 border-b border-zinc-800 px-5 py-3 max-h-44 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">{t.calc.history}</span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  {t.calc.clearHistory}
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">{t.calc.emptyHistory}</p>
            ) : (
              <div className="space-y-1.5">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDisplay(item.result);
                      setShowHistory(false);
                    }}
                    className="w-full text-right px-2 py-1 rounded hover:bg-zinc-800/70 transition-colors cursor-pointer"
                  >
                    <div className="text-[11px] text-zinc-500">{item.expression} =</div>
                    <div className="text-sm font-mono text-zinc-200">{item.result}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Display */}
        <div className="px-6 pt-6 pb-5 text-right min-h-[124px] flex flex-col justify-end">
          <div className="text-sm font-mono text-zinc-500 min-h-[20px] truncate">
            {expressionPreview}
          </div>
          <div
            className="text-5xl font-light tracking-tight font-mono text-zinc-50 truncate mt-1"
            data-testid="calc-display"
          >
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2.5 p-4 pt-2 bg-zinc-900/60">
          <button type="button" onClick={clearAll} className={btnFunc}>
            {display === '0' && prevValue === null ? 'AC' : 'C'}
          </button>
          <button type="button" onClick={toggleSign} className={btnFunc}>
            +/−
          </button>
          <button type="button" onClick={inputPercent} className={btnFunc}>
            %
          </button>
          <button
            type="button"
            onClick={() => handleOperator('÷')}
            className={`${btnOp} ${operator === '÷' && waitingForOperand ? 'ring-2 ring-white/70' : ''}`}
          >
            ÷
          </button>

          <button type="button" onClick={() => inputDigit('7')} className={btnNum}>
            7
          </button>
          <button type="button" onClick={() => inputDigit('8')} className={btnNum}>
            8
          </button>
          <button type="button" onClick={() => inputDigit('9')} className={btnNum}>
            9
          </button>
          <button
            type="button"
            onClick={() => handleOperator('×')}
            className={`${btnOp} ${operator === '×' && waitingForOperand ? 'ring-2 ring-white/70' : ''}`}
          >
            ×
          </button>

          <button type="button" onClick={() => inputDigit('4')} className={btnNum}>
            4
          </button>
          <button type="button" onClick={() => inputDigit('5')} className={btnNum}>
            5
          </button>
          <button type="button" onClick={() => inputDigit('6')} className={btnNum}>
            6
          </button>
          <button
            type="button"
            onClick={() => handleOperator('-')}
            className={`${btnOp} ${operator === '-' && waitingForOperand ? 'ring-2 ring-white/70' : ''}`}
          >
            −
          </button>

          <button type="button" onClick={() => inputDigit('1')} className={btnNum}>
            1
          </button>
          <button type="button" onClick={() => inputDigit('2')} className={btnNum}>
            2
          </button>
          <button type="button" onClick={() => inputDigit('3')} className={btnNum}>
            3
          </button>
          <button
            type="button"
            onClick={() => handleOperator('+')}
            className={`${btnOp} ${operator === '+' && waitingForOperand ? 'ring-2 ring-white/70' : ''}`}
          >
            +
          </button>

          <button type="button" onClick={backspace} className={btnNum} aria-label="Backspace">
            <Delete className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => inputDigit('0')} className={btnNum}>
            0
          </button>
          <button type="button" onClick={inputDecimal} className={btnNum}>
            .
          </button>
          <button type="button" onClick={handleEquals} className={btnOp}>
            =
          </button>
        </div>
      </div>

      {/* Epic 420 Unlock Overlay */}
      {unlocked420 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
          {/* Smoke / Aura Effects */}
          <div className="absolute w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl animate-smoke-1 pointer-events-none" />
          <div className="absolute w-72 h-72 rounded-full bg-teal-400/20 blur-3xl animate-smoke-2 pointer-events-none" />

          <div className="relative z-10 text-center px-6 max-w-md">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              {t.app.unlockTag}
            </div>

            <div className="text-8xl sm:text-9xl font-black tracking-tighter text-emerald-400 font-mono animate-glow-420 select-none">
              420
            </div>

            <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-wide text-white">
              {t.app.unlockTitle}
            </h2>
            <p className="mt-2 text-sm text-emerald-200/80">{t.app.unlockSubtitle}</p>

            <div className="mt-8 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-lime-400 animate-progress-420" />
            </div>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="mt-6 inline-flex items-center gap-2 text-xs text-emerald-300/80 hover:text-emerald-200 transition-colors cursor-pointer"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

