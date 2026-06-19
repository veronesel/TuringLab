import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTMStore } from '../../store/tmStore';
import { useThemeStore } from '../../store/themeStore';
import { playSubtleClick } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Undo, Redo, Wand2, X, Palette, MapPin, Settings, Trash2, ChevronDown, ChevronUp, Plus, Eraser, Target, Film } from 'lucide-react';
import { PatternGeneratorPanel } from './PatternGeneratorPanel';

type TapeSkin = 'default' | 'typewriter' | 'dots' | 'binary' | 'focus';

const BorderPresets = [
  { name: 'Default Theme', value: 'default', colorCode: '#3b82f6' },
  { name: 'Red', value: 'border-red-500', colorCode: '#ef4444' },
  { name: 'Orange', value: 'border-orange-500', colorCode: '#f97316' },
  { name: 'Amber/Yellow', value: 'border-amber-400', colorCode: '#fbbf24' },
  { name: 'Emerald Green', value: 'border-emerald-500', colorCode: '#10b981' },
  { name: 'Teal/Cyan', value: 'border-cyan-400', colorCode: '#22d3ee' },
  { name: 'Blue', value: 'border-blue-500', colorCode: '#3b82f6' },
  { name: 'Purple', value: 'border-purple-500', colorCode: '#a855f7' },
  { name: 'Pink', value: 'border-pink-500', colorCode: '#ec4899' },
  { name: 'White', value: 'border-white', colorCode: '#ffffff' },
];

const TextPresets = [
  { name: 'Default Theme', value: 'default', colorCode: '#3b82f6' },
  { name: 'Red', value: 'text-red-400', colorCode: '#f87171' },
  { name: 'Orange', value: 'text-orange-400', colorCode: '#fb923c' },
  { name: 'Amber/Yellow', value: 'text-amber-300', colorCode: '#fcd34d' },
  { name: 'Emerald Green', value: 'text-emerald-400', colorCode: '#34d399' },
  { name: 'Teal/Cyan', value: 'text-cyan-300', colorCode: '#67e8f9' },
  { name: 'Blue', value: 'text-blue-400', colorCode: '#60a5fa' },
  { name: 'Purple', value: 'text-purple-400', colorCode: '#c084fc' },
  { name: 'Pink', value: 'text-pink-400', colorCode: '#f472b6' },
  { name: 'White', value: 'text-white', colorCode: '#ffffff' },
];

const getCellBgClass = (borderColorValue: string): string => {
  switch (borderColorValue) {
    case 'border-red-500': return 'bg-red-500/20';
    case 'border-orange-500': return 'bg-orange-500/20';
    case 'border-amber-400': return 'bg-amber-400/20';
    case 'border-emerald-500': return 'bg-emerald-500/20';
    case 'border-cyan-400': return 'bg-cyan-400/20';
    case 'border-blue-500': return 'bg-blue-500/20';
    case 'border-purple-500': return 'bg-purple-500/20';
    case 'border-pink-500': return 'bg-pink-500/20';
    case 'border-white': return 'bg-white/10';
    default: return 'bg-primary-base/20';
  }
};

const getTapeSkinStyles = (
  tapeSkin: TapeSkin,
  cellValue: string,
  isHead: boolean,
  headPosition: number,
  cellIndex: number,
  aliasText?: string
): { skinStyles: string; content: React.ReactNode } => {
  let skinStyles = "";
  let content: React.ReactNode = cellValue === '_' ? (
    <svg style={{width: '0.8em', height: '0.8em'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18v-6 M18 18v-6 M6 18h12"/>
    </svg>
  ) : cellValue;

  if (tapeSkin === 'default') {
      skinStyles = "font-mono text-2xl";
      if (aliasText) {
          skinStyles += " flex-col relative";
          content = (
             <>
                <div className="absolute top-1 text-[8px] uppercase tracking-widest text-[#94a3b8] font-sans font-bold transition-opacity truncate w-[90%] text-center">
                   {aliasText}
                </div>
                <div className="mt-2">{content}</div>
             </>
          );
      }
  } else if (tapeSkin === 'typewriter') {
      const typewriterBase = "font-serif text-3xl font-black bg-[#fdf6e3] text-[#2c1d11] border-2 border-[#d4c5b0] dark:bg-[#1a140b] dark:text-[#d4af37] dark:border-[#4d3a1f] shadow-inner rounded-md";
      if (isHead) {
          skinStyles = `${typewriterBase} ring-2 ring-[#2c1d11] dark:ring-[#d4af37] scale-110 relative z-20`;
      } else {
          skinStyles = `${typewriterBase} opacity-85`;
      }
      content = cellValue === '_' ? '-' : cellValue;
  } else if (tapeSkin === 'dots') {
      const isBlnk = cellValue === '_';
      const dotStyle = twMerge(
          "rounded-full transition-all duration-300 pointer-events-none",
          isBlnk ? "w-2.5 h-2.5 opacity-25 border-2 border-text-muted" :
          cellValue === '0' ? "w-3.5 h-3.5 bg-primary-base shadow-sm" :
          cellValue === '1' ? "w-5.5 h-5.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
          "w-5 h-5 bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
      );
      skinStyles = twMerge(
          "bg-bg-surface border border-border-main/70 flex items-center justify-center rounded-full transition-transform duration-300",
          isHead ? "border-primary-base border-2 scale-110 relative z-20 shadow-[0_0_10px_rgba(255,255,255,0.15)] bg-bg-panel" : ""
      );
      content = <div className={dotStyle} />;
  } else if (tapeSkin === 'binary') {
      const binStr = cellValue === '_' ? '00000000' : cellValue.charCodeAt(0).toString(2).padStart(8, '0');
      const baseColors = "font-mono text-[9px] bg-[#070b12] border-2 border-[#14233c] text-emerald-400 font-bold uppercase tracking-wider rounded-md";
      if (isHead) {
          skinStyles = `${baseColors} border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-115 relative z-20 text-emerald-300`;
      } else {
          skinStyles = `${baseColors} opacity-75`;
      }
      content = (
          <div className="flex flex-col items-center justify-center gap-0.5 leading-none pointer-events-none">
              <span className="text-[6.5px] text-emerald-600/60 font-sans tracking-wide">BYTE</span>
              <span className="font-mono text-[8px] tracking-tight">{binStr}</span>
          </div>
      );
  } else if (tapeSkin === 'focus') {
      const dist = Math.abs(cellIndex - headPosition);
      if (dist === 0) {
          skinStyles = "font-mono text-3xl font-black bg-primary-base/20 border-2 border-primary-base text-primary-base scale-125 z-40 shadow-[0_0_24px_rgba(59,130,246,0.6)] rounded-lg";
      } else if (dist === 1) {
          skinStyles = "font-mono text-xl font-bold bg-bg-panel border border-border-main/80 text-text-primary scale-102 z-30 opacity-85 rounded-lg";
      } else {
          skinStyles = "font-mono text-sm bg-bg-element/40 border border-border-main/30 text-text-faint scale-90 opacity-25 grayscale hover:opacity-50 transition-all duration-300 rounded-lg";
      }
  }

  return { skinStyles, content };
};

interface MarkerData {
  note: string;
  icon?: string;
  color?: string;
}

const MarkerIcons = ['📍', '⭐', '🚩', '🎯', '⚠️', '✅', '🔍', '💡', '⚓', '🔑'];

const MarkerColors = [
  { name: 'Blue', value: 'blue', bg: '#1e3a8a', border: '#3b82f6', text: '#eff6ff', shadow: 'rgba(59, 130, 246, 0.4)' },
  { name: 'Red', value: 'red', bg: '#7f1d1d', border: '#ef4444', text: '#fef2f2', shadow: 'rgba(239, 68, 68, 0.4)' },
  { name: 'Orange', value: 'orange', bg: '#7c2d12', border: '#f97316', text: '#fff7ed', shadow: 'rgba(249, 115, 22, 0.4)' },
  { name: 'Amber', value: 'amber', bg: '#78350f', border: '#fbbf24', text: '#fef3c7', shadow: 'rgba(245, 158, 11, 0.4)' },
  { name: 'Green', value: 'emerald', bg: '#064e3b', border: '#10b981', text: '#ecfdf5', shadow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Teal', value: 'cyan', bg: '#164e63', border: '#22d3ee', text: '#ecfeff', shadow: 'rgba(6, 182, 212, 0.4)' },
  { name: 'Purple', value: 'purple', bg: '#581c87', border: '#a855f7', text: '#f5f3ff', shadow: 'rgba(168, 85, 247, 0.4)' },
  { name: 'Pink', value: 'pink', bg: '#831843', border: '#ec4899', text: '#fdf2f8', shadow: 'rgba(236, 72, 153, 0.4)' },
  { name: 'White', value: 'white', bg: '#1e293b', border: '#ffffff', text: '#ffffff', shadow: 'rgba(255, 255, 255, 0.25)' },
];

const parseBookmark = (raw: string | undefined): MarkerData => {
  if (!raw) return { note: '', icon: '📍', color: 'blue' };
  try {
    if (raw.startsWith('{') && raw.endsWith('}')) {
      const parsed = JSON.parse(raw);
      return {
        note: parsed.note || '',
        icon: parsed.icon || '📍',
        color: parsed.color || 'blue'
      };
    }
  } catch (e) {
    // ignores
  }
  return {
    note: raw,
    icon: '📍',
    color: 'blue'
  };
};

const serializeBookmark = (note: string, icon: string, color: string): string => {
  return JSON.stringify({ note, icon, color });
};

export const Tape: React.FC = () => {
  const tape = useTMStore(state => state.tape);
  const headPosition = useTMStore(state => state.headPosition);
  const status = useTMStore(state => state.status);
  const stepCount = useTMStore(state => state.stepCount);
  const history = useTMStore(state => state.history);
  const historyIndex = useTMStore(state => state.historyIndex);
  const jumpToStep = useTMStore(state => state.jumpToStep);
  const isRunning = useTMStore(state => state.isRunning);
  const undo = useTMStore(state => state.undo);
  const redo = useTMStore(state => state.redo);
  const injectTapePattern = useTMStore(state => state.injectTapePattern);
  const bookmarks = useTMStore(state => state.bookmarks);
  const addBookmark = useTMStore(state => state.addBookmark);
  const removeBookmark = useTMStore(state => state.removeBookmark);
  const symbolAliases = useTMStore(state => state.symbolAliases);
  const updateHeadPosition = useTMStore(state => state.updateHeadPosition);
  const clearTapeAndResetHead = useTMStore(state => state.clearTapeAndResetHead);
  const activeScenario = useTMStore(state => state.activeScenario);
  const showExpectedOutcome = useThemeStore(state => state.showExpectedOutcome);
  const showExecutionTimeline = useThemeStore(state => state.showExecutionTimeline);

  // We load or save historical max steps to localStorage to provide empirical data
  const [historicalSteps, setHistoricalSteps] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('turing-historical-steps');
    const defaults: Record<string, number> = {
      'binary-palindrome': 32,
      'unary-addition': 15,
      'binary-increment': 8,
      'binary-decrement': 7,
      'bit-inverter': 9,
      'copy-unary': 45,
      'binary-gt': 5,
      'busy-beaver-2': 6,
      'odd-length-abc': 6,
      'trim-spaces': 12,
      'match-parentheses': 18,
      'rotate-left': 5,
      'binary-checker': 9,
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  });

  const activeScenarioId = activeScenario?.id;
  const currentScenarioKey = activeScenarioId || 'default';
  const baselineSteps = historicalSteps[currentScenarioKey] || 25;
  const targetSteps = Math.max(baselineSteps, stepCount);

  // Update localStorage when running completes, or when stepCount exceeds baseline
  useEffect(() => {
    if (status === 'accepted' || status === 'rejected') {
      if (stepCount > 0 && stepCount !== baselineSteps) {
        setHistoricalSteps(prev => {
          const updated = { ...prev, [currentScenarioKey]: stepCount };
          localStorage.setItem('turing-historical-steps', JSON.stringify(updated));
          return updated;
        });
      }
    }
  }, [status, stepCount, currentScenarioKey, baselineSteps]);

  const progressPercent = status === 'accepted' 
    ? 100 
    : targetSteps > 0 
      ? Math.min(100, Math.round((stepCount / targetSteps) * 100)) 
      : 0;

  const expectedOutcomeText = useMemo(() => {
    if (!activeScenario?.description) return '';
    const parts = activeScenario.description.split(/Expected Outcome:\s*/i);
    if (parts.length > 1) {
      return parts[1];
    }
    return '';
  }, [activeScenario]);
  
  // Bulk Editing State
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const updateTapeSymbol = useTMStore(state => state.updateTapeSymbol);

  // Bookmark Shelf & Dialog State
  const [isShelfExpanded, setIsShelfExpanded] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<{
    index: number;
    note: string;
    symbol: string;
    isMarker: boolean;
    icon: string;
    color: string;
  } | null>(null);
  
  const selectedIndices = (() => {
      if (selectionStart === null || selectionEnd === null) return [];
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      const indices = [];
      for(let i=start; i<=end; i++) indices.push(i);
      return indices;
  })();

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click
    setSelectionStart(index);
    setSelectionEnd(index);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerEnter = (index: number) => {
    setHoveredCell(index);
    if (selectionStart !== null) {
      setSelectionEnd(index);
    }
  };

  const handlePointerUp = () => {
    if (selectionStart !== null && selectionEnd !== null && selectionStart === selectionEnd) {
      // Single click - clear selection so it doesn't stay blue, bookmark will be handled by onClick
      clearSelection();
    }
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      // If we want to catch mouse up outside
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  const handleBulkInvert = () => {
     let tempTape = { ...tape };
     for(const idx of selectedIndices) {
         let val = tempTape[idx] || '_';
         if (val === '0') updateTapeSymbol(idx, '1');
         else if (val === '1') updateTapeSymbol(idx, '0');
     }
     clearSelection();
  };

  const handleBulkFill = () => {
     const val = window.prompt("Fill with symbol (max 1 char):", "0");
     if (val !== null && val.length <= 1) {
         for(const idx of selectedIndices) {
            updateTapeSymbol(idx, val || '_');
         }
     }
     clearSelection();
  };

  const clearSelection = () => {
     setSelectionStart(null);
     setSelectionEnd(null);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const [showPatternDialog, setShowPatternDialog] = useState(false);
  const [customPattern, setCustomPattern] = useState("");
  const [infiniteMode, setInfiniteMode] = useState(true);
  const [tapeSkin, setTapeSkin] = useState<TapeSkin>('default');
  const [scrollOffset, setScrollOffset] = useState(0);

  const tapeTrackRef = useRef<HTMLDivElement>(null);

  // Auto-recenter on isRunning change
  useEffect(() => {
    if (isRunning) {
      setScrollOffset(0);
    }
  }, [isRunning]);

  // Smoothly scroll the Tape track into view whenever the head moves
  useEffect(() => {
    if (headPosition !== undefined && tapeTrackRef.current) {
      tapeTrackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [headPosition]);

  const [customBorderColor, setCustomBorderColor] = useState<string>(() => {
    return localStorage.getItem('tm-tape-border-color') || 'default';
  });
  const [customTextColor, setCustomTextColor] = useState<string>(() => {
    return localStorage.getItem('tm-tape-text-color') || 'default';
  });
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('tm-tape-border-color', customBorderColor);
  }, [customBorderColor]);

  useEffect(() => {
    localStorage.setItem('tm-tape-text-color', customTextColor);
  }, [customTextColor]);

  const activeBorderPreset = BorderPresets.find(p => p.value === customBorderColor) || BorderPresets[0];
  const activeTextColorPreset = TextPresets.find(p => p.value === customTextColor) || TextPresets[0];

  const handleInjectPattern = (pattern: string) => {
    injectTapePattern(pattern);
    setShowPatternDialog(false);
    setCustomPattern("");
  };

  // Generate an array of cells
  // Virtual center shifted by scroll offset (56px per cell: 52px width + 4px gap)
  const scrolledCenterIndex = headPosition + Math.round(-scrollOffset / 56);
  const visibleRange = 25; // Constant buffer window centered on virtual scrolling viewpoint
  const cells = [];
  
  if (infiniteMode) {
    const minCell = scrolledCenterIndex - visibleRange;
    const maxCell = scrolledCenterIndex + visibleRange;
    for (let i = minCell; i <= maxCell; i++) {
      cells.push({ index: i, value: tape[i] || '_' });
    }
  } else {
    // Fixed tape mode: show from min bounded key to max bounded key or visible range
    const keys = Object.keys(tape).map(Number).filter(n => !isNaN(n));
    let startIdx = keys.length ? Math.min(...keys) : 0;
    let endIdx = keys.length ? Math.max(...keys) : 0;
    
    // Ensure head is included
    startIdx = Math.min(startIdx, headPosition);
    endIdx = Math.max(endIdx, headPosition);
    
    // Ensure we show at least 10 cells even if fixed tape is small
    const size = endIdx - startIdx + 1;
    if (size < 10) {
      endIdx = startIdx + 9;
    }

    // Expand render bounds dynamically with scroll position to cover the viewport
    const minRender = Math.min(startIdx, scrolledCenterIndex - visibleRange);
    const maxRender = Math.max(endIdx, scrolledCenterIndex + visibleRange);

    for (let i = minRender; i <= maxRender; i++) {
       cells.push({ index: i, value: tape[i] || '_' });
    }
  }

  return (
    <div className="flex-1 flex flex-col relative select-none overflow-y-auto overflow-x-hidden border-2 border-primary-base/20 rounded-xl bg-bg-panel shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-primary-base/40 transition-all duration-500">
      {/* Background radial grid, color-mixed to support any active theme */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(color-mix(in srgb, var(--color-primary-base) 25%, transparent) 1px, transparent 1px)', 
          backgroundSize: '24px 24px' 
        }} 
      />

      <div className="w-full flex shrink-0 justify-between items-center px-4 py-3 relative z-30 flex-nowrap gap-x-4">
         <div className="flex items-center gap-2 flex-nowrap overflow-hidden shrink-0">
           <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest hidden">History Scrubber</span>
           <button onClick={undo} disabled={historyIndex <= 0 || isRunning} className="p-1 rounded bg-bg-element hover:bg-border-active disabled:opacity-50 transition-colors" title="Undo Step">
             <Undo size={12} className="text-text-primary" />
           </button>
           <button onClick={redo} disabled={historyIndex >= history.length - 1 || isRunning} className="p-1 rounded bg-bg-element hover:bg-border-active disabled:opacity-50 transition-colors" title="Redo Step">
             <Redo size={12} className="text-text-primary" />
           </button>
           
           <div className="w-[1px] h-4 bg-border-main mx-1"></div>
           <button 
             onClick={() => setInfiniteMode(!infiniteMode)} 
             className={clsx("px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors border", infiniteMode ? "bg-primary-base/10 text-primary-base border-primary-base/30" : "bg-bg-element text-text-muted border-border-main")}
           >
             {infiniteMode ? 'Infinite Mode' : 'Fixed Tape'}
           </button>
           <button 
             onClick={clearTapeAndResetHead}
             className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase border bg-red-950/20 hover:bg-red-900/35 border-red-500/20 text-red-400 transition-colors cursor-pointer"
             title="Clear entire tape and reset head position to 0"
           >
             <Eraser size={11} className="shrink-0 text-red-400" />
             <span>Clear Tape</span>
           </button>
           <button 
             onClick={() => setScrollOffset(0)}
             className={clsx(
               "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase transition-all border cursor-pointer",
               scrollOffset === 0 
                 ? "bg-primary-base/5 text-primary-base/50 border-primary-base/15 opacity-70 cursor-default select-none pointer-events-none" 
                 : "bg-primary-base/20 hover:bg-primary-base/30 border-primary-base/40 text-primary-base shadow-[0_0_8px_rgba(var(--color-primary-base),0.25)]"
             )}
             title="Automatically snap and center the viewport on the current tape head position"
           >
             <Target size={11} className={clsx("shrink-0", scrollOffset !== 0 && "animate-pulse")} />
             <span>Snap to Head</span>
           </button>
         </div>
         <div className="flex items-center gap-3 ml-auto shrink-0 flex-nowrap">
           <div className="flex items-center gap-1 bg-bg-element rounded px-2 py-1 border border-border-main">
              <Palette size={10} className="text-text-muted" />
              <select 
                value={tapeSkin} 
                onChange={(e) => setTapeSkin(e.target.value as TapeSkin)}
                className="bg-transparent text-[9px] uppercase font-bold text-text-primary outline-none cursor-pointer appearance-none px-1"
              >
                <option value="default" className="bg-bg-panel">Standard</option>
                <option value="typewriter" className="bg-bg-panel">Typewriter</option>
                <option value="dots" className="bg-bg-panel">Dots</option>
                <option value="binary" className="bg-bg-panel">Binary</option>
                
              </select>
           </div>

           {tapeSkin === 'default' && (
             <div className="relative">
               <button
                 onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                 className={clsx(
                   "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase border transition-all cursor-pointer",
                   isColorPickerOpen 
                     ? "bg-primary-base/20 text-primary-base border-primary-base/40 shadow-[0_0_10px_rgba(var(--color-primary-base),0.2)]" 
                     : (customBorderColor !== 'default' || customTextColor !== 'default')
                       ? "bg-primary-base/10 text-primary-base border-primary-base/25 hover:bg-primary-base/20"
                       : "bg-bg-element text-text-muted border-border-main hover:text-text-primary hover:border-border-active"
                 )}
                 title="Customize Cell Visuals"
               >
                 <Palette size={10} className={clsx(
                   "transition-transform",
                   (customBorderColor !== 'default' || customTextColor !== 'default') && "animate-pulse text-primary-base"
                 )} />
                 <span>Colors</span>
               </button>

               {isColorPickerOpen && (
                 <>
                   {/* Backdrop to close listbox/popover */}
                   <div className="fixed inset-0 z-40" onClick={() => setIsColorPickerOpen(false)} />
                   
                   <div className="absolute right-0 mt-1.5 w-64 bg-bg-panel border border-border-main/80 rounded-lg shadow-2xl p-3.5 flex flex-col gap-4 z-50 font-sans">
                     <div className="flex justify-between items-center border-b border-border-main/40 pb-2">
                       <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-muted">Cell Design Picker</span>
                       <button 
                         onClick={() => {
                           setCustomBorderColor('default');
                           setCustomTextColor('default');
                         }}
                         className="text-[9px] font-bold uppercase tracking-widest bg-bg-element hover:bg-border-active text-text-faint hover:text-text-primary px-2 py-0.5 rounded transition-colors"
                       >
                         Reset
                       </button>
                     </div>

                     {/* Border Color Pick */}
                     <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-extrabold uppercase tracking-wide text-text-muted flex justify-between">
                         <span>Cell Border</span>
                         <span className="text-[8px] text-text-faint normal-case">Predefined sets</span>
                       </span>
                       <div className="grid grid-cols-5 gap-2">
                         {BorderPresets.map(preset => (
                           <button
                             key={preset.value}
                             onClick={() => setCustomBorderColor(preset.value)}
                             className={clsx(
                               "h-6 w-full rounded border flex items-center justify-center transition-all relative hover:scale-110",
                               customBorderColor === preset.value ? "border-white ring-2 ring-primary-base" : "border-border-main/50"
                             )}
                             style={{ backgroundColor: '#0B0F17' }}
                             title={preset.name}
                           >
                             <div 
                               className="w-2.5 h-2.5 rounded-full" 
                               style={{ 
                                 backgroundColor: preset.colorCode === '#ffffff' ? '#ffffff' : preset.colorCode,
                                 boxShadow: `0 0 6px ${preset.colorCode}` 
                                }} 
                             />
                           </button>
                         ))}
                       </div>
                     </div>

                     {/* Text Color Pick */}
                     <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-extrabold uppercase tracking-wide text-text-muted flex justify-between">
                         <span>Cell Text</span>
                         <span className="text-[8px] text-text-faint normal-case">Predefined sets</span>
                       </span>
                       <div className="grid grid-cols-5 gap-2">
                         {TextPresets.map(preset => (
                           <button
                             key={preset.value}
                             onClick={() => setCustomTextColor(preset.value)}
                             className={clsx(
                               "h-6 w-full rounded border flex items-center justify-center transition-all relative hover:scale-110",
                               customTextColor === preset.value ? "border-white ring-2 ring-primary-base" : "border-border-main/50"
                             )}
                             style={{ backgroundColor: '#0B0F17' }}
                             title={preset.name}
                           >
                             <span className="text-xs font-black shadow-sm" style={{ color: preset.colorCode }}>
                               A
                             </span>
                           </button>
                         ))}
                       </div>
                     </div>
                   </div>
                 </>
               )}
             </div>
           )}

           <span className="text-[9px] text-primary-base font-mono bg-bg-element px-2 py-1 rounded border border-border-main">STEP {(historyIndex).toString().padStart(4, '0')}</span>
         </div>
      </div>



      {/* Target Progress HUD */}
      {showExpectedOutcome && (
        <div className="px-4 mb-2 mt-1 relative z-10 w-full shrink-0">
          <div className="bg-bg-element/40 border border-border-main/50 rounded-lg p-2.5 flex flex-col gap-1.5 transition-all">
            <div className="flex justify-between items-center text-[10px] font-sans">
              <div className="flex items-center gap-1.5 font-bold tracking-wide text-text-muted">
                <Target size={12} className={clsx("animate-pulse", status === 'accepted' ? "text-green-400 animate-none" : "text-primary-base")} />
                <span className="uppercase text-[9px] tracking-widest text-text-muted">Expected Outcome Calibration</span>
              </div>
              <div className="font-mono text-text-primary text-[10px] bg-bg-surface px-1.5 py-0.5 rounded border border-border-main/50">
                {progressPercent}% <span className="text-text-muted">({stepCount} / {targetSteps} steps)</span>
              </div>
            </div>
            
            <div className="w-full bg-bg-surface border border-border-main/40 h-2 rounded-full overflow-hidden relative">
              <motion.div 
                className={clsx(
                  "h-full rounded-full transition-all duration-300",
                  status === 'accepted' 
                    ? "bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_8px_#10b981]" 
                    : status === 'rejected'
                      ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_8px_#f97316]"
                      : "bg-gradient-to-r from-primary-base to-cyan-400 shadow-[0_0_8px_var(--color-primary-base)]"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ ease: "easeOut", duration: 0.3 }}
              />
            </div>

            {activeScenario && (
              <div className="flex items-center justify-between text-[9px] font-sans text-text-muted gap-2">
                <div className="truncate max-w-[85%]">
                  <span className="font-bold text-text-primary uppercase mr-1">Outcome Target:</span>
                  <span className="italic">{expectedOutcomeText || activeScenario.description}</span>
                </div>
                <div className="text-[8px] font-mono text-text-faint uppercase font-bold text-right shrink-0">
                   Calibrated Baseline: {baselineSteps} steps
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      
      {/* Tape Track */}
      <div 
        ref={tapeTrackRef}
        className="w-full flex justify-center items-center flex-1 shrink-0 mt-6 relative z-20 cursor-all-scroll min-h-[140px]"
        onWheel={(e) => {
          if (isRunning) return;
          // Capture scroll inputs across both mouse-wheel orientations
          const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
          setScrollOffset(prev => prev - delta);
        }}
      >

        {/* Horizontal feed ribbon backdrop to emphasize tape path */}
        <div 
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[76px] border-y-2 bg-bg-surface/80 pointer-events-none z-10" 
          style={{ 
            borderColor: customBorderColor !== 'default' 
              ? `color-mix(in srgb, ${activeBorderPreset.colorCode} 25%, transparent)` 
              : 'color-mix(in srgb, var(--color-primary-base) 15%, transparent)' 
          }}
        />

        {/* Central Scan Cohort Highlight Focus Aperture */}
        <motion.div 
          key={`aperture-${headPosition}`}
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 450, damping: 20 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[80px] border-2 rounded-lg z-30 pointer-events-none"
          style={{ 
            borderColor: customBorderColor !== 'default' ? activeBorderPreset.colorCode : 'var(--color-primary-base)',
            boxShadow: customBorderColor !== 'default' 
              ? `0 0 20px color-mix(in srgb, ${activeBorderPreset.colorCode} 40%, transparent)` 
              : '0 0 20px color-mix(in srgb, var(--color-primary-base) 40%, transparent)',
            backgroundColor: customBorderColor !== 'default' 
              ? `color-mix(in srgb, ${activeBorderPreset.colorCode} 5%, transparent)` 
              : 'color-mix(in srgb, var(--color-primary-base) 5%, transparent)'
          }}
        />

        {/* Head Indicator Triangle (placed ABOVE the tape, pointing down) */}
        <motion.div 
          key={`pointer-${headPosition}`}
          initial={{ y: -6, opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+48px)] z-30 flex flex-col items-center"
        >
          <div className="flex gap-2 items-center mb-1">
            <button 
              onClick={() => setScrollOffset(0)}
              disabled={scrollOffset === 0}
              className={twMerge(
                clsx(
                  "text-[10px] font-mono font-bold text-bg-base px-2 py-[3px] rounded tracking-widest transition-all duration-300 select-none flex items-center gap-1.5",
                  scrollOffset !== 0 ? "hover:scale-105 cursor-pointer active:scale-95 shadow-md opacity-100 animate-pulse" : "opacity-95 cursor-default"
                )
              )}
              style={{
                backgroundColor: customBorderColor !== 'default' ? activeBorderPreset.colorCode : 'var(--color-primary-base)',
                boxShadow: customBorderColor !== 'default' ? `0 0 10px ${activeBorderPreset.colorCode}` : '0 0 10px var(--color-primary-base)'
              }}
              title={scrollOffset !== 0 ? "Click to recenter tape on the head pointer" : undefined}
            >
              HEAD: {headPosition}
              {scrollOffset !== 0 && (
                <span className="text-[8px] bg-bg-panel text-text-primary px-1 rounded-sm font-sans font-extrabold uppercase pointer-events-none">
                  Recenter
                </span>
              )}
            </button>
            <button
              onClick={() => setShowPatternDialog(true)}
              className="p-1 min-w-[20px] h-[20px] flex items-center justify-center rounded transition-colors"
              style={{
                color: customBorderColor !== 'default' ? activeBorderPreset.colorCode : 'var(--color-primary-base)',
                backgroundColor: customBorderColor !== 'default' 
                  ? `color-mix(in srgb, ${activeBorderPreset.colorCode} 20%, transparent)` 
                  : 'color-mix(in srgb, var(--color-primary-base) 20%, transparent)'
              }}
              title="Inject Pattern at Head"
            >
              <Wand2 size={10} />
            </button>
          </div>
          <div 
            className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] -mt-[1px]"
            style={{
              borderTopColor: customBorderColor !== 'default' ? activeBorderPreset.colorCode : 'var(--color-primary-base)'
            }}
          ></div>
        </motion.div>

        {/* Pattern Generator Panel */}
        <PatternGeneratorPanel isOpen={showPatternDialog} onClose={() => setShowPatternDialog(false)} />

        {/* Bulk Edit Toolbar */}
        <AnimatePresence>
          {selectedIndices.length > 1 && (
             <motion.div
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 10, scale: 0.95 }}
               className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-bg-panel border border-[#3b82f6] rounded shadow-[0_0_20px_rgba(59,130,246,0.3)] p-2 flex items-center gap-3"
             >
               <span className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest px-2 border-r border-border-main">
                 {selectedIndices.length} CELLS
               </span>
               <button 
                 onClick={handleBulkInvert}
                 className="px-2 py-1 bg-bg-element hover:bg-border-active transition-colors text-[10px] font-bold text-text-primary rounded border border-border-main"
               >
                 INVERT BITS
               </button>
               <button 
                 onClick={handleBulkFill}
                 className="px-2 py-1 bg-bg-element hover:bg-border-active transition-colors text-[10px] font-bold text-text-primary rounded border border-border-main"
               >
                 FILL WITH...
               </button>
               <button 
                 onClick={clearSelection}
                 className="p-1 hover:text-red-400 text-text-muted transition-colors ml-1"
                 title="Cancel Selection"
               >
                 <X size={14} />
               </button>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Sliding Cells Container */}
        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-0 h-16 pointer-events-none">
          <motion.div 
            className="absolute top-0 pointer-events-auto"
            animate={{ x: -(headPosition * 56) + scrollOffset }} // 52px width + 4px gap = 56px per cell + horizontal user scroll offset
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
           {/* Ghost Head Indicator */}
           {hoveredCell !== null && hoveredCell !== headPosition && !isRunning && (
             <div 
               className="absolute top-[-30px] z-20 flex flex-col items-center pointer-events-none opacity-50 transition-all duration-75 -translate-x-1/2"
               style={{ left: hoveredCell * 56 }}
             >
               <div className="text-[8px] font-mono font-bold text-text-muted mb-1 tracking-widest">EDIT</div>
               <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-text-muted"></div>
             </div>
           )}

           {cells.map(cell => {
             const isHead = cell.index === headPosition;
             const isBookmarked = bookmarks[cell.index] !== undefined;
             const bookmarkNoteRaw = bookmarks[cell.index];
              const parsedBm = parseBookmark(bookmarkNoteRaw);
              const bookmarkNote = parsedBm.note;
              const bookmarkIcon = parsedBm.icon || '📍';
              const bookmarkColor = parsedBm.color || 'blue';
              const colorConfig = MarkerColors.find(c => c.value === bookmarkColor) || MarkerColors[0];
             
             const isHovered = hoveredCell === cell.index && !isHead && !isRunning;
             const isSelected = selectedIndices.includes(cell.index);

             const aliasText = symbolAliases[cell.value === '_' ? '_' : cell.value];
             const { skinStyles, content } = getTapeSkinStyles(tapeSkin, cell.value, isHead, headPosition, cell.index, aliasText);

             const cellBorderClass = (tapeSkin === 'default')
               ? (isHead 
                   ? (customBorderColor !== 'default' ? customBorderColor : 'border-primary-base')
                   : (cell.value !== '_' ? (customBorderColor !== 'default' ? customBorderColor : 'border-primary-base') : '')
                 )
               : '';

             const cellTextClass = (tapeSkin === 'default')
               ? (isHead 
                   ? (customTextColor !== 'default' ? customTextColor : 'text-primary-base')
                   : (cell.value !== '_' ? (customTextColor !== 'default' ? customTextColor : 'text-primary-base') : '')
                 )
               : '';

             const cellBgClass = (tapeSkin === 'default')
               ? (isHead
                   ? (customBorderColor !== 'default' ? getCellBgClass(customBorderColor) : 'bg-primary-base/30')
                   : (cell.value !== '_' ? getCellBgClass(customBorderColor) : '')
                 )
               : '';

             const cellStyle: React.CSSProperties = {};
             if (isHead) {
               const activeColor = customBorderColor !== 'default' ? activeBorderPreset.colorCode : 'var(--color-primary-base)';
               cellStyle.boxShadow = `0 0 20px color-mix(in srgb, ${activeColor} 45%, transparent), 0 0 0 4px color-mix(in srgb, ${activeColor} 20%, transparent)`;
             } else if (isHovered) {
               const activeColor = customBorderColor !== 'default' ? activeBorderPreset.colorCode : 'var(--color-primary-base)';
               cellStyle.boxShadow = `0 0 12px color-mix(in srgb, ${activeColor} 25%, transparent)`;
             }

             return (
               <div
                  key={cell.index}
                  style={{ position: 'absolute', left: cell.index * 56 - 26, top: 0 }}
                  className="w-[52px] h-16 flex items-center justify-center relative cursor-pointer group"
                  onPointerDown={(e) => handlePointerDown(cell.index, e)}
                  onPointerEnter={() => handlePointerEnter(cell.index)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={() => setHoveredCell(null)}
                  onClick={(e) => {
                     if (selectedIndices.length <= 1) {
                        e.stopPropagation();
                        const parsed = parseBookmark(bookmarks[cell.index]);
                        setEditingBookmark({
                          index: cell.index,
                          note: parsed.note,
                          symbol: tape[cell.index] || '_',
                          isMarker: bookmarks[cell.index] !== undefined,
                          icon: parsed.icon || '📍',
                          color: parsed.color || 'blue'
                        });
                     }
                  }}
                  onDragOver={(e) => {
                     e.preventDefault();
                  }}
                  onDrop={(e) => {
                     const srcIdx = e.dataTransfer.getData('bookmarkCell');
                     if (srcIdx) {
                        const src = parseInt(srcIdx, 10);
                        if (!isNaN(src) && src !== cell.index) {
                           const note = bookmarks[src] || "";
                           removeBookmark(src);
                           addBookmark(cell.index, note);
                        }
                     }
                  }}
               >
                 <div
                    style={cellStyle}
                    className={twMerge(
                      clsx(
                        "w-full h-full flex items-center justify-center transition-all duration-300 pointer-events-none rounded",
                        {
                          "bg-bg-panel border-2 relative z-20 scale-110 rounded-lg": isHead,
                          "animate-pulse saturate-150": isHead && isRunning,
                          "bg-bg-panel border border-border-main/90 text-text-muted font-medium shadow-sm": !isHead && cell.value === '_' && tapeSkin === 'default',
                          "bg-bg-panel font-black border-2 shadow-md": !isHead && cell.value !== '_' && tapeSkin === 'default',
                          "ring-2 ring-primary-base/50 z-10": isHovered,
                          "ring-2 ring-blue-500 bg-blue-500/20 z-10": isSelected && !isHead
                        },
                        skinStyles,
                        cellBorderClass,
                        cellTextClass,
                        cellBgClass
                      )
                    )}
                 >
                   <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div
                        key={cell.value}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="flex items-center justify-center w-full h-full relative"
                      >
                        {content}
                        {isHead && isRunning && (
                          <motion.div 
                            key={`ping-${stepCount}`}
                            initial={{ opacity: 0.8, scale: 0.8 }}
                            animate={{ opacity: 0, scale: 1.6 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute inset-0 rounded pointer-events-none z-10"
                            style={{
                              boxShadow: `0 0 20px ${customBorderColor !== 'default' ? activeBorderPreset.colorCode : 'var(--color-primary-base)'}`,
                              border: `2px solid ${customBorderColor !== 'default' ? activeBorderPreset.colorCode : 'var(--color-primary-base)'}`
                            }}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                 </div>
                 
                 {/* Bookmark Indicator */}
                 {isBookmarked && (
                   <div 
                     draggable
                     onDragStart={(e) => {
                        e.dataTransfer.setData('bookmarkCell', cell.index.toString());
                        e.stopPropagation();
                     }}
                     onClick={(e) => {
                        e.stopPropagation();
                        // Jump head to this bookmark
                        updateHeadPosition(cell.index);
                     }}
                     style={{
                        backgroundColor: colorConfig.bg,
                        borderColor: colorConfig.border,
                        color: colorConfig.text,
                        boxShadow: `0 0 6px ${colorConfig.shadow}`
                      }}
                      className={clsx(
                        "absolute -bottom-5 left-1/2 -translate-x-1/2 z-30 select-none",
                        "flex items-center gap-0.5 px-1 pb-[1.5px] pt-[0.5px] rounded border text-[9px] font-bold shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-all w-max max-w-[50px] overflow-hidden"
                      )}
                     title={bookmarkNote ? `${bookmarkIcon} ${bookmarkNote} (Click to jump, Drag to move)` : `${bookmarkIcon} Bookmarked (Click to jump, Drag to move)`}
                    >
                      <span className="shrink-0 text-[10px] leading-none mb-[1.5px]">{bookmarkIcon}</span>
                      {bookmarkNote && (
                        <span className="truncate font-sans text-[7.5px] tracking-tight shrink leading-none mb-[1.5px] max-w-[28px]">
                          {bookmarkNote}
                        </span>
                      )}
                    </div>
                  )}
                  {isBookmarked && bookmarkNote && (
                   <div className="absolute top-[calc(100%+8px)] whitespace-nowrap text-[8px] uppercase tracking-widest text-[#3b82f6] font-bold hidden group-hover:block transition-opacity pointer-events-none bg-bg-panel px-1 rounded border border-border-main z-30">
                     {bookmarkNote}
                   </div>
                 )}
                 {!isBookmarked && (
                   <div className="absolute -bottom-4 w-2 h-2 rotate-45 bg-text-faint opacity-0 group-hover:opacity-100 transition-opacity" title="Click to bookmark" />
                 )}
               </div>
             );
          })}
          </motion.div>
        </div>
      </div>

      {/* Visual Timeline History Scrubber Panel */}
      {showExecutionTimeline && (
        <div className="px-4 py-3 border-t border-border-main/50 bg-bg-surface/50 w-full shrink-0 relative z-30 select-none font-sans">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <Film size={12} className={clsx("text-primary-base", isRunning && "animate-[spin_4s_linear_infinite]")} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Execution Spectrum Timeline</span>
              <span className="text-[10px] text-text-faint">•</span>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
                <span>Step</span>
                <span className="px-1.5 py-0.5 rounded bg-bg-element tracking-wider border border-border-main/60 font-bold text-text-primary">
                  {historyIndex}
                </span>
                <span>/</span>
                <span className="text-text-faint">{Math.max(0, history.length - 1)}</span>
              </div>
            </div>

            {/* Current Frame Status Indicator */}
            <div className="flex items-center gap-2 text-[10px]">
              {history[historyIndex] && (
                <div className="flex items-center gap-1.5 bg-bg-element/40 border border-border-main/40 px-2 py-0.5 rounded-md">
                  <span className="text-text-muted text-[9px] uppercase tracking-wider font-extrabold mr-0.5">Machine State:</span>
                  <span 
                    className="w-2 h-2 rounded-full border border-black/30 shadow-inner" 
                    style={{ backgroundColor: activeScenario?.stateColors?.[history[historyIndex].currentState] || '#3b82f6' }}
                  />
                  <code className="font-mono font-bold text-primary-base">{history[historyIndex].currentState}</code>
                </div>
              )}
              
              {history[historyIndex]?.lastRuleId ? (
                <div className="hidden sm:flex items-center gap-1 bg-[#1c2128] border border-border-main px-2 py-0.5 rounded text-[8px] text-text-faint font-mono">
                  <span className="font-bold text-text-faint uppercase font-sans">Last Rule ID:</span>
                  <span className="text-primary-base font-bold">{history[historyIndex].lastRuleId?.slice(0, 8)}...</span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1 bg-[#1c2128]/50 border border-border-main/40 px-2 py-0.5 rounded text-[8px] text-text-faint italic font-mono">
                  Initial Config
                </div>
              )}
            </div>
          </div>

          {/* Timeline Spectrum Ribbon Track container */}
          <div className="relative w-full h-8 flex items-center group/timeline rounded-lg overflow-hidden bg-bg-element border border-border-main/60 shadow-inner">
            
            {/* Dynamic Spectrum background bars (representing states over time) */}
            <div className="absolute inset-0 flex w-full h-full pointer-events-none opacity-45 group-hover/timeline:opacity-65 transition-opacity">
              {history.map((histEntry, idx) => {
                const stateColor = activeScenario?.stateColors?.[histEntry.currentState] || '#3b82f6';
                const isCurrent = idx === historyIndex;
                return (
                  <div 
                    key={idx} 
                    className="h-full flex-1 border-r border-[#000]/10 last:border-r-0 relative transition-all"
                    style={{ 
                      backgroundColor: stateColor,
                      boxShadow: isCurrent ? `inset 0 0 10px rgba(255,255,255,0.4)` : undefined
                    }} 
                  />
                );
              })}
            </div>

            {/* Timeline Keyframe Dot Markers (e.g., changes or bookmarks) */}
            <div className="absolute inset-x-0 bottom-1 flex w-full pointer-events-none px-1">
              {history.map((histEntry, idx) => {
                const hasBookmarkAtHead = bookmarks[histEntry.headPosition] !== undefined;
                if (!hasBookmarkAtHead) return <div key={idx} className="flex-1 h-1" />;
                
                return (
                  <div key={idx} className="flex-1 flex justify-center items-center h-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 border border-black/40 shadow-sm animate-pulse" title={`Marker at Step ${idx}`} />
                  </div>
                );
              })}
            </div>

            {/* Transparent Input Range Overlay to handle scrubbing gestures seamlessly */}
            <input 
              type="range" 
              min="0" 
              max={Math.max(0, history.length - 1)} 
              value={historyIndex}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                jumpToStep(val);
                if (useThemeStore.getState().soundEnabled) {
                  playSubtleClick();
                }
              }}
              disabled={history.length <= 1}
              className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer select-none outline-none z-10 opacity-100 accent-white active:scale-[0.99] transition-transform"
              style={{
                WebkitAppearance: 'none',
              }}
              title="Scrub Execution History"
            />

            {/* Glowing cursor tracking thumb (visual only, overlaying input tracker for high fidelity styling) */}
            {history.length > 1 && (
              <div 
                className="absolute h-full w-1 bg-white shadow-[0_0_8px_4px_rgba(255,255,255,0.4)] pointer-events-none z-20 border-x border-[#000]/30"
                style={{
                  left: `${(historyIndex / (history.length - 1)) * 100}%`,
                  transform: 'translateX(-50%)',
                  transition: isRunning ? 'left 0.1s linear' : 'left 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
              />
            )}
          </div>

          {/* Playback Progress Timecode / Ticks Bar */}
          <div className="flex justify-between items-center mt-1.5 text-[8.5px] text-text-faint font-mono uppercase tracking-wide px-1">
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => {
                  jumpToStep(0);
                  if (useThemeStore.getState().soundEnabled) {
                    playSubtleClick();
                  }
                }}
                disabled={historyIndex === 0}
                className="hover:text-primary-base transition-colors font-bold disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                ⏪ Start (0)
              </button>
              <span className="select-none">│</span>
              <span className="font-bold">Speed: {Math.round(2000 / useTMStore.getState().executionSpeed)}x</span>
            </div>

            <div className="flex gap-1 items-center bg-bg-element/30 px-2 py-0.5 rounded border border-border-main/30">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-base mr-1 pointer-events-none"></div>
              <span>Current Head:</span>
              <span className="font-bold text-text-muted">{headPosition}</span>
            </div>

            <div className="flex gap-4">
              <span className="select-none">│</span>
              <button 
                type="button"
                onClick={() => {
                  jumpToStep(history.length - 1);
                  if (useThemeStore.getState().soundEnabled) {
                    playSubtleClick();
                  }
                }}
                disabled={historyIndex === history.length - 1}
                className="hover:text-primary-base transition-colors font-bold disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Latest ({Math.max(0, history.length - 1)}) ⏩
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookmarks Manager Footer Panel */}
      <div className="w-full bg-bg-panel border-t border-border-main shrink-0 mt-auto relative z-30 select-none">
         <div 
           onClick={() => setIsShelfExpanded(!isShelfExpanded)}
           className="px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-bg-panel/60 transition-colors"
         >
           <div className="flex items-center gap-2">
             <MapPin size={12} className={clsx("transition-transform duration-300", Object.keys(bookmarks).length > 0 ? "text-primary-base animate-pulse" : "text-text-muted")} />
             <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">
               Visual Markers & Bookmarks Map ({Object.keys(bookmarks).length})
             </span>
           </div>

           <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
             {/* Quick Actions inside title bar */}
             <button
               onClick={() => {
                 setEditingBookmark({
                   index: headPosition,
                   note: parseBookmark(bookmarks[headPosition]).note, icon: parseBookmark(bookmarks[headPosition]).icon || '📍', color: parseBookmark(bookmarks[headPosition]).color || 'blue',
                   symbol: tape[headPosition] || '_',
                   isMarker: true
                 });
               }}
               className="px-2 py-0.5 bg-primary-base/10 hover:bg-primary-base/20 border border-primary-base/30 text-primary-base text-[9px] font-bold uppercase rounded transition-colors"
               title="Bookmark Head Position"
             >
               + Marker at Head
             </button>

             {Object.keys(bookmarks).length > 0 && (
               <button
                 onClick={() => {
                   if (window.confirm("Are you sure you want to clear all visual markers?")) {
                     Object.keys(bookmarks).forEach(idxStr => {
                       removeBookmark(parseInt(idxStr, 10));
                     });
                   }
                 }}
                 className="px-2 py-0.5 bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase rounded transition-colors"
                 title="Clear All Markers"
               >
                 Clear All
               </button>
             )}

             <button 
               onClick={() => setIsShelfExpanded(!isShelfExpanded)}
               className="text-text-muted hover:text-text-primary transition-colors h-5 w-5 flex items-center justify-center rounded"
             >
               {isShelfExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
             </button>
           </div>
         </div>

         <AnimatePresence initial={false}>
            {isShelfExpanded && (
               <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: "auto", opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden border-t border-[#161B22]/50 font-sans"
               >
                 <div className="px-4 py-3 bg-bg-panel flex flex-col gap-2 max-h-[140px] overflow-y-auto">
                   {Object.keys(bookmarks).length === 0 ? (
                     <div className="text-center py-4 text-xs text-text-faint italic flex flex-col items-center gap-1 font-sans">
                       <span>No visual markers added to the tape yet.</span>
                       <span className="text-[10px] text-text-muted">
                         Click on any cell of the tape or use the "+ Marker at Head" button to add landmarks.
                       </span>
                     </div>
                   ) : (
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 font-sans">
                       {Object.keys(bookmarks)
                         .map(Number)
                         .sort((a, b) => a - b)
                         .map(idx => {
                           const raw = bookmarks[idx];
                            const parsed = parseBookmark(raw);
                            const note = parsed.note;
                            const icon = parsed.icon || '📍';
                            const color = parsed.color || 'blue';
                            const colorConfig = MarkerColors.find(c => c.value === color) || MarkerColors[0];
                           const isAtHead = idx === headPosition;
                           const symbolVal = tape[idx] || '_';
                           
                           return (
                             <div 
                               key={idx}
                               className={clsx(
                                 "flex items-center justify-between p-1.5 rounded border text-xs transition-all",
                                 isAtHead 
                                   ? "bg-primary-base/5 border-primary-base shadow-[0_0_8px_rgba(var(--color-primary-base),0.1)]" 
                                   : "bg-bg-panel/60 border-border-main hover:border-border-active"
                               )}
                             >
                               {/* Jump Left Click */}
                               <div 
                                 onClick={() => {
                                   updateHeadPosition(idx);
                                 }}
                                 className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                 title="Click to jump Head here"
                               >
                                 <div className={clsx(
                                   "w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold shrink-0",
                                   isAtHead ? "bg-primary-base text-bg-base" : "bg-bg-element text-text-primary"
                                 )}>
                                   {idx}
                                 </div>
                                 
                                 <div className="flex flex-col min-w-0">
                                   <div className="flex items-center gap-1.5">
                                      <span className="px-1 bg-border-main text-[9px] font-mono rounded text-text-faint shrink-0 leading-none py-0.5">
                                        {symbolVal === '_' ? '空' : symbolVal}
                                      </span>
                                      {isAtHead && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-base animate-pulse shrink-0" title="Active Head is here" />
                                      )}
                                   </div>
                                   <p className="text-[10px] text-text-primary truncate font-medium mt-0.5" title={note || `Cell #${idx}`}>
                                     {note || <span className="text-text-faint italic font-normal">No Label</span>}
                                   </p>
                                 </div>
                               </div>

                               {/* Action Items */}
                               <div className="flex items-center gap-1 pl-1 shrink-0 font-sans">
                                 <button
                                   onClick={() => {
                                     setEditingBookmark({
                                       index: idx,
                                       note: parseBookmark(bookmarks[idx]).note, icon: parseBookmark(bookmarks[idx]).icon || '📍', color: parseBookmark(bookmarks[idx]).color || 'blue',
                                       symbol: tape[idx] || '_',
                                       isMarker: true
                                     });
                                   }}
                                   className="p-1 hover:text-primary-base text-text-faint transition-colors"
                                   title="Edit cell & marker"
                                 >
                                   <Settings size={10} />
                                 </button>
                                 <button
                                   onClick={() => removeBookmark(idx)}
                                   className="p-1 hover:text-red-400 text-text-faint transition-colors"
                                   title="Remove marker"
                                 >
                                   <Trash2 size={10} />
                                 </button>
                               </div>
                             </div>
                           );
                         })}
                     </div>
                   )}
                 </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* Bookmark / Cell Configuration Modal */}
      <AnimatePresence>
        {editingBookmark && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-base/70 backdrop-blur-sm font-sans">
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="w-[320px] bg-bg-panel border border-border-main rounded-lg shadow-2xl p-4 flex flex-col gap-4 font-sans"
             >
               <div className="flex justify-between items-center border-b border-border-main pb-2">
                 <div className="flex items-center gap-2">
                   <MapPin size={14} className="text-primary-base" />
                   <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Configure Cell #{editingBookmark.index}</span>
                 </div>
                 <button 
                   onClick={() => setEditingBookmark(null)}
                   className="text-text-muted hover:text-text-primary transition-colors hover:scale-110 duration-100 h-5 w-5 flex items-center justify-center rounded"
                 >
                   <X size={14} />
                 </button>
               </div>

               <div className="flex flex-col gap-3">
                 {/* Symbol edit */}
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Cell Symbol</label>
                   <div className="flex gap-2">
                     <input 
                       type="text"
                       maxLength={1}
                       value={editingBookmark.symbol === '_' ? '' : editingBookmark.symbol}
                       onChange={(e) => {
                         const val = e.target.value || '_';
                         setEditingBookmark({
                           ...editingBookmark,
                           symbol: val
                         });
                       }}
                       placeholder="Blank (_)"
                       className="w-16 px-2 py-1 bg-bg-element border border-border-main rounded text-center text-sm font-mono text-text-primary outline-none focus:border-primary-base"
                     />
                     <span className="text-[10px] text-text-faint self-center">Single character (or blank)</span>
                   </div>
                 </div>

                 {/* Bookmark toggle and note */}
                 <div className="flex flex-col gap-2 mt-1">
                   <div className="flex items-center gap-2">
                     <input 
                       type="checkbox"
                       id="is-marker-cb"
                       checked={editingBookmark.isMarker}
                       onChange={(e) => {
                         setEditingBookmark({
                           ...editingBookmark,
                           isMarker: e.target.checked
                         });
                       }}
                       className="rounded border-border-main bg-bg-element text-primary-base focus:ring-primary-base cursor-pointer"
                     />
                     <label htmlFor="is-marker-cb" className="text-[10px] font-bold uppercase tracking-wider text-text-muted cursor-pointer select-none">
                       Place Visual Marker / Bookmark
                     </label>
                   </div>

                   {editingBookmark.isMarker && (
                     <div className="flex flex-col gap-1 pl-5">
                       <label className="text-[9px] font-semibold text-text-faint">Marker Label/Note (Optional)</label>
                       <input 
                         type="text"
                         value={editingBookmark.note}
                         onChange={(e) => {
                           setEditingBookmark({
                             ...editingBookmark,
                             note: e.target.value
                           });
                         }}
                         placeholder="e.g. Array Start, Pointer A..."
                         className="px-2 py-1 bg-bg-element border border-border-main rounded text-xs text-text-primary outline-none focus:border-primary-base w-full"
                        />

                        {/* Distinct Icon Picker */}
                        <div className="flex flex-col gap-1 mt-3">
                          <label className="text-[9px] font-semibold text-text-faint">Select Marker Icon</label>
                          <div className="flex flex-wrap gap-1">
                            {MarkerIcons.map(iconSymbol => (
                              <button
                                key={iconSymbol}
                                type="button"
                                onClick={() => {
                                  setEditingBookmark({
                                    ...editingBookmark,
                                    icon: iconSymbol
                                  });
                                }}
                                className={clsx(
                                  "w-6 h-6 flex items-center justify-center rounded text-sm hover:scale-115 active:scale-95 transition-all",
                                  editingBookmark.icon === iconSymbol ? "bg-primary-base/20 border border-primary-base" : "bg-bg-element border border-border-main/40"
                                )}
                              >
                                {iconSymbol}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Distinct Color Picker */}
                        <div className="flex flex-col gap-1 mt-3">
                          <label className="text-[9px] font-semibold text-text-faint">Select Badge Color</label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {MarkerColors.map(col => (
                              <button
                                key={col.value}
                                type="button"
                                onClick={() => {
                                  setEditingBookmark({
                                    ...editingBookmark,
                                    color: col.value
                                  });
                                }}
                                className={clsx(
                                  "h-5 rounded text-[8px] font-bold uppercase transition-all flex items-center justify-center border text-center font-sans",
                                  editingBookmark.color === col.value ? "ring-2 ring-primary-base border-white" : "border-transparent"
                                )}
                                style={{
                                  backgroundColor: col.bg,
                                  color: col.text
                                }}
                                title={col.name}
                              >
                                {col.name.slice(0, 3)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                   )}
                 </div>
               </div>

               <div className="flex gap-2 mt-2 pt-2 border-t border-border-main justify-end">
                 <button 
                   onClick={() => setEditingBookmark(null)}
                   className="px-3 py-1 bg-bg-element hover:bg-border-active transition-colors text-[10px] font-bold text-text-muted rounded border border-border-main uppercase tracking-wider font-sans"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => {
                     // Save Symbol
                     updateTapeSymbol(editingBookmark.index, editingBookmark.symbol);
                     
                     // Save Bookmark
                     if (editingBookmark.isMarker) {
                       addBookmark(editingBookmark.index, serializeBookmark(editingBookmark.note, editingBookmark.icon || '📍', editingBookmark.color || 'blue'));
                     } else {
                       removeBookmark(editingBookmark.index);
                     }
                     
                     setEditingBookmark(null);
                   }}
                   className="px-3 py-1 bg-primary-base hover:bg-opacity-90 transition-all text-bg-base font-bold text-[10px] rounded uppercase tracking-wider font-sans"
                 >
                   Save Changes
                 </button>
               </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};
