import React, { useEffect, useRef, useState } from 'react';
import { useTMStore } from '../../store/tmStore';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Undo, Redo, Wand2, X, Palette } from 'lucide-react';

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
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleBookmarkToggle = (index: number) => {
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
  const [tapeSkin, setTapeSkin] = useState<TapeSkin>('default');

  const handleInjectPattern = (pattern: string) => {
    injectTapePattern(pattern);
    setShowPatternDialog(false);
    setCustomPattern("");
  };

  // Generate an array of cells around the head position
  const visibleRange = 15; // 15 cells left and right
  const minCell = headPosition - visibleRange;
  const maxCell = headPosition + visibleRange;
  
  const cells = [];
  for (let i = minCell; i <= maxCell; i++) {
    cells.push({ index: i, value: tape[i] || '_' });
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

        {/* Pattern Injection Dialog */}
        <AnimatePresence>
          {showPatternDialog && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-bg-panel border border-border-active rounded-lg shadow-2xl p-4 w-[280px]"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary-base">Inject Pattern</h3>
                <button onClick={() => setShowPatternDialog(false)} className="text-text-muted hover:text-text-primary transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2 mb-4">
                <button onClick={() => handleInjectPattern("01010101")} className="w-full text-left px-3 py-2 bg-bg-element hover:bg-border-active text-text-primary text-xs rounded border border-border-main hover:border-text-muted transition-colors font-mono">
                  01010101 (Alternating)
                </button>
                <button onClick={() => handleInjectPattern("11111111")} className="w-full text-left px-3 py-2 bg-bg-element hover:bg-border-active text-text-primary text-xs rounded border border-border-main hover:border-text-muted transition-colors font-mono">
                  11111111 (All 1s)
                </button>
                <button onClick={() => handleInjectPattern("00000000")} className="w-full text-left px-3 py-2 bg-bg-element hover:bg-border-active text-text-primary text-xs rounded border border-border-main hover:border-text-muted transition-colors font-mono">
                  00000000 (All 0s)
                </button>
                <button onClick={() => {
                  const noise = Array.from({length: 8}, () => Math.random() > 0.5 ? '1' : '0').join('');
                  handleInjectPattern(noise);
                }} className="w-full text-left px-3 py-2 bg-bg-element hover:bg-border-active text-text-primary text-xs rounded border border-border-main hover:border-text-muted transition-colors font-mono">
                  Random Binary Noise
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPattern}
                  onChange={(e) => setCustomPattern(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customPattern.trim()) {
                      handleInjectPattern(customPattern);
                    }
                  }}
                  className="flex-1 bg-bg-surface border border-border-main rounded px-2 py-1.5 text-xs outline-none focus:border-primary-base text-text-primary font-mono placeholder:font-sans"
                  placeholder="Custom..."
                />
                <button 
                  onClick={() => customPattern.trim() && handleInjectPattern(customPattern)}
                  className="px-3 py-1.5 bg-primary-base hover:bg-primary-hover text-bg-base text-xs font-bold rounded transition-colors"
                >
                  Inject
                </button>
              </div>
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
           {cells.map(cell => {
             const isHead = cell.index === headPosition;
             const isBookmarked = bookmarks[cell.index] !== undefined;
             const bookmarkNote = bookmarks[cell.index];
             
             let skinStyles = "font-mono text-2xl";
             let content: React.ReactNode = cell.value === '_' ? 'B' : cell.value;
             
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

             return (
               <div
                  key={cell.index}
                  style={{ position: 'absolute', left: cell.index * 56 - 26, top: 0 }}
                  className="w-[52px] h-16 flex items-center justify-center relative cursor-pointer group"
                  onClick={() => handleBookmarkToggle(cell.index)}
               >
                 <div
                    className={twMerge(
                      clsx(
                        "w-full h-full flex items-center justify-center transition-all duration-300 pointer-events-none rounded",
                        {
                          "border-2 border-primary-base text-primary-base shadow-[0_0_25px_var(--color-primary-base)] ring-4 ring-primary-base/20 relative z-20 scale-110 rounded-lg": isHead,
                          "animate-pulse": isHead && isRunning,
                          "bg-bg-panel border border-border-main text-text-faint": !isHead && cell.value === '_' && tapeSkin === 'default',
                          "bg-bg-element border border-border-active text-primary-base": !isHead && cell.value !== '_' && tapeSkin === 'default'
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
                     className="absolute -bottom-4 w-2 h-2 rotate-45 bg-[#3b82f6] shadow-[0_0_5px_rgba(59,130,246,0.6)]" 
                     title={bookmarkNote || 'Bookmarked'}
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
