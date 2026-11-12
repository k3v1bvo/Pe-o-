'use client';

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  History,
  Delete,
  Globe,
  ArrowRight,
  Check,
  Copy,
  FlaskConical,
  Calculator as CalcIcon,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { useApp } from '@/components/providers/app-provider';
import { LOCALE_LABELS, type Locale } from '@/i18n/dictionaries';

type Operator = '+' | '-' | '×' | '÷' | 'xʸ' | 'ʸ√x' | null;

interface HistoryEntry {
  expression: string;
  result: string;
}

interface StackFrame {
  prevValue: number | null;
  operator: Operator;
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

const subscribeLandscape = (cb: () => void) => {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(orientation: landscape) and (max-height: 560px)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

const getLandscapeSnapshot = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(orientation: landscape) and (max-height: 560px)').matches;

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function formatDisplayText(raw: string, errorLabel: string): string {
  if (raw === errorLabel || raw === 'NaN' || raw === 'Infinity' || raw === '-Infinity') {
    return errorLabel;
  }
  if (raw === '-') return '-';
  if (raw.includes('e') || raw.includes('E')) return raw;

  const hasTrailingDot = raw.endsWith('.');
  const [intPart, decPart] = raw.split('.');
  const negative = intPart.startsWith('-');
  const unsigned = negative ? intPart.slice(1) : intPart;

  const grouped = unsigned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const signed = negative ? `-${grouped}` : grouped;

  if (decPart !== undefined) return `${signed}.${decPart}`;
  if (hasTrailingDot) return `${signed}.`;
  return signed;
}

export function CalculatorView() {
  const router = useRouter();
  const { locale, setLocale, t } = useApp();

  const isLandscapeAuto = useSyncExternalStore(
    subscribeLandscape,
    getLandscapeSnapshot,
    () => false
  );
  const [sciOverride, setSciOverride] = useState<'auto' | 'on' | 'off'>('auto');
  const isScientific =
    sciOverride === 'on' ? true : sciOverride === 'off' ? false : isLandscapeAuto;

  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expressionPreview, setExpressionPreview] = useState('');
  const [parenStack, setParenStack] = useState<StackFrame[]>([]);

  const [memory, setMemory] = useState(0);
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [isSecond, setIsSecond] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const compute = useCallback((a: number, b: number, op: Operator): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? NaN : a / b;
      case 'xʸ':
        return Math.pow(a, b);
      case 'ʸ√x':
        return b === 0 ? NaN : Math.pow(a, 1 / b);
      default:
        return b;
    }
  }, []);

  const formatResult = useCallback(
    (num: number): string => {
      if (!Number.isFinite(num)) return t.calc.error;
      if (Math.abs(num) >= 1e12 || (num !== 0 && Math.abs(num) < 1e-9)) {
        return num.toExponential(6).replace(/\.?0+e/, 'e');
      }
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
          if (prev.replace(/[^0-9]/g, '').length >= 14) return prev;
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
    setDisplay((prev) => (prev.includes('.') || prev.includes('e') ? prev : prev + '.'));
  }, [unlocked420, waitingForOperand]);

  const inputExponent = useCallback(() => {
    if (unlocked420) return;
    if (waitingForOperand) {
      setDisplay('1e');
      setWaitingForOperand(false);
      return;
    }
    setDisplay((prev) => (prev.includes('e') || prev === t.calc.error ? prev : prev + 'e'));
  }, [unlocked420, waitingForOperand, t.calc.error]);

  const inputConstant = useCallback(
    (val: number) => {
      if (unlocked420) return;
      setDisplay(formatResult(val));
      setWaitingForOperand(false);
    },
    [unlocked420, formatResult]
  );

  const clearAll = useCallback(() => {
    if (unlocked420) return;
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpressionPreview('');
    setParenStack([]);
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
      if (prev.endsWith('e')) return prev;
      const n = parseFloat(prev);
      if (Number.isNaN(n) || n === 0) return prev;
      return formatResult(-n);
    });
  }, [unlocked420, formatResult]);

  const inputPercent = useCallback(() => {
    if (unlocked420) return;
    const n = parseFloat(display);
    if (Number.isNaN(n)) return;
    setDisplay(formatResult(n / 100));
  }, [unlocked420, display, formatResult]);

  const applyUnary = useCallback(
    (label: string, fn: (x: number) => number) => {
      if (unlocked420) return;
      const n = parseFloat(display);
      if (Number.isNaN(n)) return;
      const result = fn(n);
      const formatted = formatResult(result);
      setExpressionPreview(`${label}(${display})`);
      setDisplay(formatted);
      setWaitingForOperand(true);
    },
    [unlocked420, display, formatResult]
  );

  const toRad = useCallback(
    (x: number) => (angleMode === 'DEG' ? (x * Math.PI) / 180 : x),
    [angleMode]
  );
  const fromRad = useCallback(
    (x: number) => (angleMode === 'DEG' ? (x * 180) / Math.PI : x),
    [angleMode]
  );

  const handleOperator = useCallback(
    (nextOp: Exclude<Operator, null>) => {
      if (unlocked420) return;
      const inputValue = parseFloat(display);
      if (Number.isNaN(inputValue)) return;

      const opLabel = nextOp === 'xʸ' ? '^' : nextOp === 'ʸ√x' ? 'ʸ√' : nextOp;

      if (prevValue === null) {
        setPrevValue(inputValue);
        setExpressionPreview(`${inputValue} ${opLabel}`);
      } else if (operator && !waitingForOperand) {
        const result = compute(prevValue, inputValue, operator);
        const formatted = formatResult(result);
        setDisplay(formatted);
        setPrevValue(Number.isFinite(result) ? result : null);
        setExpressionPreview(`${formatted} ${opLabel}`);
      } else {
        setExpressionPreview(`${prevValue} ${opLabel}`);
      }

      setOperator(nextOp);
      setWaitingForOperand(true);
    },
    [unlocked420, display, prevValue, operator, waitingForOperand, compute, formatResult]
  );

  const openParen = useCallback(() => {
    if (unlocked420) return;
    setParenStack((prev) => [...prev, { prevValue, operator }]);
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
    setExpressionPreview((prev) => (prev ? `${prev} (` : '('));
  }, [unlocked420, prevValue, operator]);

  const closeParen = useCallback(() => {
    if (unlocked420 || parenStack.length === 0) return;
    const inputValue = parseFloat(display);
    if (Number.isNaN(inputValue)) return;

    const innerResult =
      operator && prevValue !== null ? compute(prevValue, inputValue, operator) : inputValue;

    const frame = parenStack[parenStack.length - 1];
    setParenStack((prev) => prev.slice(0, -1));
    setPrevValue(frame.prevValue);
    setOperator(frame.operator);
    setDisplay(formatResult(innerResult));
    setWaitingForOperand(false);
    setExpressionPreview((prev) => `${prev} ${inputValue} )`);
  }, [unlocked420, parenStack, display, operator, prevValue, compute, formatResult]);

  const handleEquals = useCallback(() => {
    if (unlocked420) return;
    const inputValue = parseFloat(display);
    if (Number.isNaN(inputValue)) return;

    let result = inputValue;
    let expr = String(inputValue);

    if (operator && prevValue !== null) {
      result = compute(prevValue, inputValue, operator);
      const opLabel = operator === 'xʸ' ? '^' : operator === 'ʸ√x' ? 'ʸ√' : operator;
      expr = `${prevValue} ${opLabel} ${inputValue}`;
    }

    // Collapse any unclosed parentheses cleanly
    let stack = [...parenStack];
    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      stack = stack.slice(0, -1);
      if (frame.operator && frame.prevValue !== null) {
        result = compute(frame.prevValue, result, frame.operator);
        const opLabel =
          frame.operator === 'xʸ' ? '^' : frame.operator === 'ʸ√x' ? 'ʸ√' : frame.operator;
        expr = `${frame.prevValue} ${opLabel} (${expr})`;
      }
    }
    setParenStack([]);

    if (operator && prevValue !== null) {
      const formatted = formatResult(result);
      setHistory((prev) => [{ expression: expr, result: formatted }, ...prev].slice(0, 20));
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
  }, [unlocked420, display, operator, prevValue, parenStack, compute, triggerUnlock420, formatResult]);

  const handleCopyDisplay = async () => {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
      else if (e.key === '.' || e.key === ',') inputDecimal();
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('×');
      else if (e.key === '^') handleOperator('xʸ');
      else if (e.key === '(') openParen();
      else if (e.key === ')') closeParen();
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
    openParen,
    closeParen,
    inputPercent,
    handleEquals,
    backspace,
    clearAll,
  ]);

  const formattedDisplay = formatDisplayText(display, t.calc.error);
  const displaySizeClass = isLandscapeAuto
    ? 'text-[28px] sm:text-[34px]'
    : formattedDisplay.length >= 12
    ? 'text-[34px] sm:text-[38px]'
    : formattedDisplay.length >= 9
    ? 'text-[42px] sm:text-[46px]'
    : formattedDisplay.length >= 7
    ? 'text-[52px] sm:text-[54px]'
    : 'text-[60px] sm:text-[62px]';

  const keyBase = isScientific
    ? 'w-full h-9 sm:h-11 rounded-full flex items-center justify-center select-none cursor-pointer transition-all duration-100 active:scale-[0.93] active:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
    : 'aspect-square w-full rounded-full flex items-center justify-center select-none cursor-pointer transition-all duration-100 active:scale-[0.93] active:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40';

  const keySci = `${keyBase} bg-[#212226] hover:bg-[#2f3036] text-zinc-200 text-[11px] sm:text-xs font-medium`;
  const keyFunc = `${keyBase} bg-[#a5a5a5] hover:bg-[#b8b8b8] text-[#050505] ${
    isScientific ? 'text-sm sm:text-base' : 'text-[clamp(18px,4.8vw,22px)]'
  } font-medium`;
  const keyNum = `${keyBase} bg-[#333336] hover:bg-[#444448] text-white ${
    isScientific ? 'text-base sm:text-lg' : 'text-[clamp(22px,6.5vw,28px)]'
  } font-normal`;
  const keyOp = (op: Exclude<Operator, null>) =>
    `${keyBase} ${
      isScientific ? 'text-base sm:text-lg' : 'text-[clamp(24px,6.5vw,28px)]'
    } font-medium ${
      operator === op && waitingForOperand
        ? 'bg-white text-[#ff9f0a]'
        : 'bg-[#ff9f0a] hover:bg-[#ffb340] text-white'
    }`;

  const quote = UNLOCK_QUOTES[locale];

  const renderHistoryItems = (closeDrawer: boolean) =>
    history.length === 0 ? (
      <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 text-center px-4">
        {t.calc.emptyHistory}
      </div>
    ) : (
      <div className="flex-1 overflow-y-auto py-2 space-y-1.5 pr-1">
        {history.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setDisplay(item.result);
              if (closeDrawer) setShowHistory(false);
            }}
            className="w-full text-right px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.07] border border-transparent hover:border-white/[0.08] transition-colors cursor-pointer"
          >
            <div className="text-[11px] text-zinc-500 tabular-nums">{item.expression} =</div>
            <div className="text-base font-medium text-zinc-100 tabular-nums">
              {formatDisplayText(item.result, t.calc.error)}
            </div>
          </button>
        ))}
      </div>
    );

  const scientificRows: React.ReactNode[] = [
    // Row 1 (6 sci + 4 std)
    <button key="lp" type="button" onClick={openParen} className={keySci}>(</button>,
    <button key="rp" type="button" onClick={closeParen} className={keySci}>)</button>,
    <button key="mc" type="button" onClick={() => setMemory(0)} className={keySci}>mc</button>,
    <button key="mp" type="button" onClick={() => setMemory((m) => m + (parseFloat(display) || 0))} className={keySci}>m+</button>,
    <button key="mm" type="button" onClick={() => setMemory((m) => m - (parseFloat(display) || 0))} className={keySci}>m−</button>,
    <button key="mr" type="button" onClick={() => { setDisplay(formatResult(memory)); setWaitingForOperand(false); }} className={keySci}>mr</button>,
    <button key="ac" type="button" onClick={clearAll} className={keyFunc}>{display === '0' && prevValue === null ? 'AC' : 'C'}</button>,
    <button key="sgn" type="button" onClick={toggleSign} className={keyFunc}>+/−</button>,
    <button key="pct" type="button" onClick={inputPercent} className={keyFunc}>%</button>,
    <button key="div" type="button" onClick={() => handleOperator('÷')} className={keyOp('÷')}>÷</button>,

    // Row 2
    <button key="2nd" type="button" onClick={() => setIsSecond((v) => !v)} className={`${keySci} ${isSecond ? '!bg-white !text-black font-semibold' : ''}`}>2ⁿᵈ</button>,
    <button key="sq" type="button" onClick={() => applyUnary('x²', (x) => x * x)} className={keySci}>x²</button>,
    <button key="cb" type="button" onClick={() => applyUnary('x³', (x) => x * x * x)} className={keySci}>x³</button>,
    <button key="pow" type="button" onClick={() => handleOperator(isSecond ? 'ʸ√x' : 'xʸ')} className={keyOp(isSecond ? 'ʸ√x' : 'xʸ').replace('bg-[#ff9f0a] hover:bg-[#ffb340] text-white', 'bg-[#212226] hover:bg-[#2f3036] text-zinc-200 text-[11px] sm:text-xs')}>{isSecond ? 'ʸ√x' : 'xʸ'}</button>,
    <button key="exp" type="button" onClick={() => applyUnary(isSecond ? '2ˣ' : 'eˣ', (x) => (isSecond ? Math.pow(2, x) : Math.exp(x)))} className={keySci}>{isSecond ? '2ˣ' : 'eˣ'}</button>,
    <button key="ten" type="button" onClick={() => applyUnary(isSecond ? 'log₂' : '10ˣ', (x) => (isSecond ? Math.log2(x) : Math.pow(10, x)))} className={keySci}>{isSecond ? 'log₂' : '10ˣ'}</button>,
    <button key="7" type="button" onClick={() => inputDigit('7')} className={keyNum}>7</button>,
    <button key="8" type="button" onClick={() => inputDigit('8')} className={keyNum}>8</button>,
    <button key="9" type="button" onClick={() => inputDigit('9')} className={keyNum}>9</button>,
    <button key="mul" type="button" onClick={() => handleOperator('×')} className={keyOp('×')}>×</button>,

    // Row 3
    <button key="inv" type="button" onClick={() => applyUnary('1/x', (x) => (x === 0 ? NaN : 1 / x))} className={keySci}>¹/ₓ</button>,
    <button key="sqrt" type="button" onClick={() => applyUnary('√', (x) => Math.sqrt(x))} className={keySci}>²√x</button>,
    <button key="cbrt" type="button" onClick={() => applyUnary('³√', (x) => Math.cbrt(x))} className={keySci}>³√x</button>,
    <button key="yrt" type="button" onClick={() => handleOperator('ʸ√x')} className={keySci}>ʸ√x</button>,
    <button key="ln" type="button" onClick={() => applyUnary('ln', (x) => Math.log(x))} className={keySci}>ln</button>,
    <button key="log10" type="button" onClick={() => applyUnary('log₁₀', (x) => Math.log10(x))} className={keySci}>log₁₀</button>,
    <button key="4" type="button" onClick={() => inputDigit('4')} className={keyNum}>4</button>,
    <button key="5" type="button" onClick={() => inputDigit('5')} className={keyNum}>5</button>,
    <button key="6" type="button" onClick={() => inputDigit('6')} className={keyNum}>6</button>,
    <button key="sub" type="button" onClick={() => handleOperator('-')} className={keyOp('-')}>−</button>,

    // Row 4
    <button key="fact" type="button" onClick={() => applyUnary('fact', factorial)} className={keySci}>x!</button>,
    <button key="sin" type="button" onClick={() => applyUnary(isSecond ? 'sin⁻¹' : 'sin', (x) => (isSecond ? fromRad(Math.asin(x)) : Math.sin(toRad(x))))} className={keySci}>{isSecond ? 'sin⁻¹' : 'sin'}</button>,
    <button key="cos" type="button" onClick={() => applyUnary(isSecond ? 'cos⁻¹' : 'cos', (x) => (isSecond ? fromRad(Math.acos(x)) : Math.cos(toRad(x))))} className={keySci}>{isSecond ? 'cos⁻¹' : 'cos'}</button>,
    <button key="tan" type="button" onClick={() => applyUnary(isSecond ? 'tan⁻¹' : 'tan', (x) => (isSecond ? fromRad(Math.atan(x)) : Math.tan(toRad(x))))} className={keySci}>{isSecond ? 'tan⁻¹' : 'tan'}</button>,
    <button key="e" type="button" onClick={() => inputConstant(Math.E)} className={keySci}>e</button>,
    <button key="ee" type="button" onClick={inputExponent} className={keySci}>EE</button>,
    <button key="1" type="button" onClick={() => inputDigit('1')} className={keyNum}>1</button>,
    <button key="2" type="button" onClick={() => inputDigit('2')} className={keyNum}>2</button>,
    <button key="3" type="button" onClick={() => inputDigit('3')} className={keyNum}>3</button>,
    <button key="add" type="button" onClick={() => handleOperator('+')} className={keyOp('+')}>+</button>,

    // Row 5
    <button key="deg" type="button" onClick={() => setAngleMode((m) => (m === 'DEG' ? 'RAD' : 'DEG'))} className={`${keySci} text-[#ff9f0a]`}>{angleMode === 'DEG' ? 'Rad' : 'Deg'}</button>,
    <button key="sinh" type="button" onClick={() => applyUnary(isSecond ? 'sinh⁻¹' : 'sinh', (x) => (isSecond ? Math.asinh(x) : Math.sinh(x)))} className={keySci}>{isSecond ? 'sinh⁻¹' : 'sinh'}</button>,
    <button key="cosh" type="button" onClick={() => applyUnary(isSecond ? 'cosh⁻¹' : 'cosh', (x) => (isSecond ? Math.acosh(x) : Math.cosh(x)))} className={keySci}>{isSecond ? 'cosh⁻¹' : 'cosh'}</button>,
    <button key="tanh" type="button" onClick={() => applyUnary(isSecond ? 'tanh⁻¹' : 'tanh', (x) => (isSecond ? Math.atanh(x) : Math.tanh(x)))} className={keySci}>{isSecond ? 'tanh⁻¹' : 'tanh'}</button>,
    <button key="pi" type="button" onClick={() => inputConstant(Math.PI)} className={keySci}>π</button>,
    <button key="rand" type="button" onClick={() => inputConstant(Math.random())} className={keySci}>Rand</button>,
    <button key="bs" type="button" onClick={backspace} className={keyNum} aria-label="Backspace"><Delete className="w-4 h-4 sm:w-5 sm:h-5" /></button>,
    <button key="0" type="button" onClick={() => inputDigit('0')} className={keyNum}>0</button>,
    <button key="dot" type="button" onClick={inputDecimal} className={keyNum}>.</button>,
    <button key="eq" type="button" onClick={handleEquals} className={`${keyBase} bg-[#ff9f0a] hover:bg-[#ffb340] text-white text-lg sm:text-xl font-medium`}>=</button>,
  ];

  return (
    <div
      className="min-h-[100dvh] w-full bg-black sm:bg-[#0b0c0e] text-white flex flex-col justify-between relative overflow-hidden"
      onClick={() => {
        if (showLangMenu) setShowLangMenu(false);
      }}
    >
      {/* Subtle neutral web studio backdrop (desktop/tablet only) */}
      <div className="hidden sm:block absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.045),_transparent_55%)] pointer-events-none" />

      {/* Clean Web Top Navigation Bar (Desktop & Tablet) */}
      <header className="hidden sm:flex items-center justify-between w-full max-w-5xl mx-auto px-6 pt-4 pb-1 relative z-20">
        <div className="flex items-center gap-2.5">
          <BrandLogo variant="stealth" compact size="sm" />
          <div>
            <div className="text-sm font-semibold tracking-tight text-zinc-100">
              {t.app.publicTitle}
            </div>
            <div className="text-[11px] text-zinc-500">
              {isScientific ? 'Científica · Mem · Deg/Rad' : t.calc.standard}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSciOverride(() => (isScientific ? 'off' : 'on'))}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
              isScientific
                ? 'bg-[#ff9f0a]/15 border-[#ff9f0a]/40 text-[#ffb340]'
                : 'bg-zinc-900/90 hover:bg-zinc-800 border-white/10 text-zinc-200'
            }`}
          >
            {isScientific ? <CalcIcon className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
            <span>{isScientific ? 'Estándar' : 'Científica'}</span>
          </button>

          <div
            className="relative"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              onClick={() => setShowLangMenu((v) => !v)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>{LOCALE_LABELS[locale]}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-[#1c1c1e] border border-white/10 shadow-2xl py-1.5 z-30">
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
      </header>

      {/* Main Responsive Calculator Stage */}
      <main className="flex-1 flex items-stretch sm:items-center justify-center sm:px-6 sm:py-3 relative z-10">
        <div className="w-full sm:w-auto flex flex-col lg:flex-row items-stretch justify-center gap-5">
          {/* Calculator Instrument */}
          <div
            className={`w-full mx-auto h-[100dvh] sm:h-auto sm:max-h-[88dvh] bg-black sm:bg-[#111215] sm:rounded-[32px] sm:ring-1 sm:ring-white/[0.1] sm:shadow-[0_28px_80px_rgba(0,0,0,0.75)] flex flex-col justify-between px-3 sm:px-5 relative transition-[width,max-width] duration-200 ${
              isScientific
                ? 'max-w-full sm:w-[680px] pt-2 pb-2 sm:py-4'
                : 'max-w-[400px] sm:w-[360px] pt-3 pb-4 sm:p-5'
            }`}
          >
            {/* Mobile-only Top Utility Strip */}
            <div className="flex sm:hidden items-center justify-between h-9 relative">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowHistory((v) => !v);
                    setShowLangMenu(false);
                  }}
                  aria-label={t.calc.history}
                  title={t.calc.history}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    showHistory
                      ? 'bg-white/15 text-[#ff9f0a]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSciOverride(() => (isScientific ? 'off' : 'on'))}
                  aria-label="Scientific mode"
                  title={isScientific ? 'Estándar' : 'Científica'}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                    isScientific
                      ? 'bg-[#ff9f0a]/15 border-[#ff9f0a]/40 text-[#ffb340]'
                      : 'bg-white/[0.04] border-white/10 text-zinc-400'
                  }`}
                >
                  {isScientific ? (
                    <CalcIcon className="w-3 h-3" />
                  ) : (
                    <FlaskConical className="w-3 h-3" />
                  )}
                  <span>{isScientific ? 'Estándar' : 'Científica'}</span>
                </button>
              </div>

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
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    showLangMenu
                      ? 'bg-white/15 text-white'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/10'
                  }`}
                >
                  <Globe className="w-4 h-4" />
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

            {/* Tablet-only quick history toggle */}
            <div className="hidden sm:flex lg:hidden items-center justify-between mb-1">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                  showHistory
                    ? 'bg-white/10 text-[#ff9f0a]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{t.calc.history}</span>
              </button>
            </div>

            {/* Display / Mobile & Tablet History Drawer */}
            <div
              className={`flex flex-col justify-end relative ${
                isLandscapeAuto ? 'py-1 min-h-[60px]' : 'flex-1 min-h-[100px] sm:min-h-[120px] py-2 sm:py-2.5'
              }`}
            >
              {showHistory ? (
                <div className="lg:hidden absolute inset-0 bg-[#16171b]/95 rounded-2xl border border-white/[0.08] p-4 flex flex-col justify-between z-20">
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
                  {renderHistoryItems(true)}
                </div>
              ) : null}

              <div className="px-2 py-1.5 sm:px-3 sm:py-2 sm:bg-black/40 sm:rounded-2xl sm:border sm:border-white/[0.05] select-none">
                <div className="flex items-center justify-between gap-2 min-h-[20px]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    {isScientific && (
                      <span className="px-1.5 py-0.5 rounded bg-white/[0.07] text-[#ff9f0a]">
                        {angleMode}
                      </span>
                    )}
                    {memory !== 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-white/[0.07] text-emerald-400">
                        M
                      </span>
                    )}
                    {parenStack.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-white/[0.07] text-zinc-300">
                        ({parenStack.length})
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyDisplay}
                      title="Copiar"
                      className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-zinc-500 truncate tabular-nums text-right">
                    {expressionPreview}
                  </div>
                </div>
                <div
                  data-testid="calc-display"
                  className={`${displaySizeClass} text-right font-light leading-none tracking-tight text-white tabular-nums truncate mt-1 transition-[font-size] duration-150`}
                >
                  {formattedDisplay}
                </div>
              </div>
            </div>

            {/* Keypad: 10x5 Scientific (Landscape / Toggle) OR 4x5 Standard (Portrait) */}
            {isScientific ? (
              <div className="w-full overflow-x-auto pt-1">
                <div className="min-w-[540px] sm:min-w-0 grid grid-cols-10 gap-1.5 sm:gap-2">
                  {scientificRows}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[min(100%,calc((100dvh-190px)*0.78))] sm:max-w-full mx-auto grid grid-cols-4 gap-2.5 sm:gap-3 pt-2">
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
            )}
          </div>

          {/* Desktop Side Tape / History Panel */}
          <aside className="hidden lg:flex lg:w-[270px] max-h-[88dvh] bg-[#111215]/90 rounded-[32px] ring-1 ring-white/[0.08] p-5 flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                <History className="w-3.5 h-3.5 text-[#ff9f0a]" />
                <span>{t.calc.history}</span>
              </div>
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

            {renderHistoryItems(false)}

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-500">
              <span>Esc · AC</span>
              <span>Backspace · ⌫</span>
              <span>Enter · =</span>
            </div>
          </aside>
        </div>
      </main>

      <div className="hidden sm:block h-4" />

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
