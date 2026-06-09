import React, { useEffect, useRef, useState } from 'react';
import { useTMStore } from '../../store/tmStore';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Undo, Redo, Wand2, X, Palette } from 'lucide-react';
import { PatternGeneratorPanel } from './PatternGeneratorPanel';

type TapeSkin = 'default' | 'typewriter' | 'dots' | 'binary';

export const Tape: React.FC = () => {
  const tape = useTMStore(state => state.tape);
  const headPosition = useTMStore(state => state.headPosition);
  const status = useTMStore(state => state.status);
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
  
  // Bulk Editing State
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const updateTapeSymbol = useTMStore(state => state.updateTapeSymbol);
  
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

  const handleBookmarkToggle = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (bookmarks[index] !== undefined) {
      removeBookmark(index);
    } else {
      const note = window.prompt("Enter a note for this bookmark (or leave empty):", "");
      if (note !== null) {
        addBookmark(index, note.trim());
      }
    }
  };
  const [showPatternDialog, setShowPatternDialog] = useState(false);
  const [customPattern, setCustomPattern] = useState("");
  const [infiniteMode, setInfiniteMode] = useState(true);
  const [tapeSkin, setTapeSkin] = useState<TapeSkin>('default');

  const handleInjectPattern = (pattern: string) => {
    injectTapePattern(pattern);
    setShowPatternDialog(false);
    setCustomPattern("");
  };

  // Generate an array of cells
  const visibleRange = 15; // 15 cells left and right
  const cells = [];
  
  if (infiniteMode) {
    const minCell = headPosition - visibleRange;
    const maxCell = headPosition + visibleRange;
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

    for (let i = startIdx; i <= endIdx; i++) {
       cells.push({ index: i, value: tape[i] || '_' });
    }
  }

  // Auto-scroll effect or layout shifting is handled by the sliding track
  
  return (
    <div className="flex-1 flex flex-col relative select-none overflow-hidden" style={{ backgroundImage: 'radial-gradient(var(--color-border-main) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      <div className="absolute inset-0 bg-bg-base/90"></div>

      <div className="w-full flex justify-between items-center px-4 py-3 relative z-10">
         <div className="flex items-center gap-2">
           <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">History Scrubber</span>
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
         </div>
         <div className="flex items-center gap-3">
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
           <span className="text-[9px] text-primary-base font-mono bg-bg-element px-2 py-1 rounded border border-border-main">STEP {(historyIndex).toString().padStart(4, '0')}</span>
         </div>
      </div>

      <div className="px-4 relative z-10 w-full mb-4 shrink-0">
        <input 
          type="range" 
          min="0" 
          max={Math.max(0, history.length - 1)} 
          value={historyIndex}
          onChange={(e) => jumpToStep(parseInt(e.target.value, 10))}
          disabled={isRunning || history.length <= 1}
          className="w-full h-1 bg-bg-element rounded-lg appearance-none cursor-pointer disabled:opacity-50 accent-primary-base"
          title="Scrub through history"
        />
      </div>

      <AnimatePresence>
        {(status === 'accepted' || status === 'error' || status === 'rejected') && (
          <motion.div
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="absolute left-6 top-12 z-50 pointer-events-none"
          >
             {status === 'accepted' && (
               <div className="bg-green-500/20 border border-green-500/50 text-green-600 dark:text-green-400 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow-lg flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 Simulation Accepted
               </div>
             )}
             {(status === 'rejected' || status === 'error') && (
               <div className="bg-red-500/20 border border-red-500/50 text-red-600 dark:text-red-400 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow-lg flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                 {status === 'rejected' ? 'Simulation Rejected' : 'Simulation Error'}
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tape Track */}
      <div className="w-full flex justify-center items-center flex-1 mt-6 relative z-20">

        {/* Head Indicator Triangle (placed ABOVE the tape, pointing down) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+48px)] z-30 flex flex-col items-center">
          <div className="flex gap-2 items-center mb-1">
            <div className="text-[10px] font-mono font-bold text-bg-base bg-primary-base px-2 py-0.5 rounded shadow-[0_0_10px_var(--color-primary-base)] tracking-widest">HEAD: {headPosition}</div>
            <button
              onClick={() => setShowPatternDialog(true)}
              className="p-1 min-w-[20px] h-[20px] flex items-center justify-center rounded bg-primary-base/20 hover:bg-primary-base/40 text-primary-base transition-colors"
              title="Inject Pattern at Head"
            >
              <Wand2 size={10} />
            </button>
          </div>
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-primary-base -mt-[1px]"></div>
        </div>

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
            animate={{ x: -(headPosition * 56) }} // 52px width + 4px gap = 56px per cell
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
             const bookmarkNote = bookmarks[cell.index];
             
             const isHovered = hoveredCell === cell.index && !isHead && !isRunning;
             const isSelected = selectedIndices.includes(cell.index);

             let skinStyles = "font-mono text-2xl";
             let content: React.ReactNode = cell.value === '_' ? (
               <svg style={{width: '0.8em', height: '0.8em'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M6 18v-6 M18 18v-6 M6 18h12"/>
               </svg>
             ) : cell.value;
             let aliasText = symbolAliases[cell.value === '_' ? '_' : cell.value];
             
             if (tapeSkin === 'typewriter') {
                 skinStyles = "font-serif text-3xl font-black bg-[#fdf6e3] text-[#2c1d11] border-[#d4c5b0] dark:bg-[#1a140b] dark:text-[#d4af37] dark:border-[#4d3a1f] shadow-inner";
                 content = cell.value === '_' ? '-' : cell.value;
             } else if (tapeSkin === 'dots') {
                 skinStyles = "bg-bg-surface border-border-main";
                 content = (
                     <div className={clsx(
                         "rounded-full transition-all duration-300",
                         cell.value === '_' ? "w-2 h-2 opacity-20 border border-current" : 
                         cell.value === '0' ? "w-3 h-3 bg-current" : "w-5 h-5 bg-current shadow-[0_0_8px_currentColor]"
                     )} />
                 );
             } else if (tapeSkin === 'binary') {
                 skinStyles = "font-mono text-[10px] bg-[#0a0f18] border-[#1c2838] text-green-400 font-bold uppercase tracking-widest";
                 content = cell.value === '_' ? 'BLNK' : cell.value.charCodeAt(0).toString(2).padStart(8, '0').slice(-4);
             }

             if (aliasText && tapeSkin === 'default') {
                 skinStyles += " flex-col relative";
                 content = (
                    <>
                       <div className="absolute top-1 text-[8px] uppercase tracking-widest text-text-muted font-sans font-bold opacity-70 group-hover:opacity-100 transition-opacity truncate w-[90%] text-center">
                          {aliasText}
                       </div>
                       <div className="mt-2">{content}</div>
                    </>
                 );
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
                        handleBookmarkToggle(cell.index, e);
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
                    className={twMerge(
                      clsx(
                        "w-full h-full flex items-center justify-center transition-all duration-300 pointer-events-none rounded",
                        {
                          "border-2 border-primary-base text-primary-base shadow-[0_0_25px_var(--color-primary-base)] ring-4 ring-primary-base/20 relative z-20 scale-110 rounded-lg bg-primary-base/10": isHead,
                          "animate-pulse saturate-150": isHead && isRunning,
                          "bg-bg-panel border border-border-main text-text-faint": !isHead && cell.value === '_' && tapeSkin === 'default',
                          "bg-bg-element border border-border-active text-primary-base": !isHead && cell.value !== '_' && tapeSkin === 'default',
                          "opacity-80 ring-2 ring-primary-base/50 shadow-[0_0_15px_var(--color-primary-base)] z-10": isHovered,
                          "ring-2 ring-blue-500 bg-blue-500/20 z-10": isSelected && !isHead
                        },
                        skinStyles
                      )
                    )}
                 >
                   {content}
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
                     className="absolute -bottom-4 w-3 h-3 rotate-45 bg-[#3b82f6] shadow-[0_0_5px_rgba(59,130,246,0.6)] cursor-grab active:cursor-grabbing hover:scale-125 transition-transform" 
                     title={bookmarkNote ? `${bookmarkNote} (Click to jump head, Drag to move)` : 'Bookmarked (Click to jump head, Drag to move)'}
                   />
                 )}
                 {isBookmarked && bookmarkNote && (
                   <div className="absolute top-[calc(100%+8px)] whitespace-nowrap text-[8px] uppercase tracking-widest text-[#3b82f6] font-bold opacity-75 hidden group-hover:block transition-opacity pointer-events-none bg-bg-panel px-1 rounded border border-border-main z-30">
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
    </div>
  );
};
