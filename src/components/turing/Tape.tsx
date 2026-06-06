import React, { useEffect, useRef } from 'react';
import { useTMStore } from '../../store/tmStore';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Tape: React.FC = () => {
  const tape = useTMStore(state => state.tape);
  const headPosition = useTMStore(state => state.headPosition);
  const status = useTMStore(state => state.status);
  const history = useTMStore(state => state.history);
  const jumpToStep = useTMStore(state => state.jumpToStep);
  const isRunning = useTMStore(state => state.isRunning);
  
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="flex-1 flex flex-col relative select-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="absolute inset-0 bg-bg-base/90"></div>

      <div className="w-full flex justify-between items-center px-4 py-3 relative z-10">
         <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">History Scrubber</span>
         <span className="text-[9px] text-primary-base font-mono">STEP {(history.length > 0 ? history.length - 1 : 0).toString().padStart(4, '0')}</span>
      </div>

      <div className="px-4 relative z-10 w-full mb-4 shrink-0">
        <input 
          type="range" 
          min="0" 
          max={Math.max(0, history.length - 1)} 
          value={history.length > 0 ? history.length - 1 : 0}
          onChange={(e) => jumpToStep(parseInt(e.target.value, 10))}
          disabled={isRunning || history.length <= 1}
          className="w-full h-1 bg-bg-element rounded-lg appearance-none cursor-pointer disabled:opacity-50 accent-primary-base"
          title="Scrub through history"
        />
      </div>
      
      {/* Tape Track */}
      <div className="w-full flex justify-center items-center flex-1 mt-6 relative z-20">

        {/* Head Indicator Triangle (placed ABOVE the tape, pointing down) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+48px)] z-30 flex flex-col items-center">
          <div className="text-[10px] font-mono font-bold text-bg-base bg-primary-base px-2 py-0.5 rounded shadow-[0_0_10px_var(--color-primary-base)] mb-1 tracking-widest">HEAD: 0x{(headPosition).toString(16).padStart(2, '0').toUpperCase()}</div>
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-primary-base -mt-[1px]"></div>
        </div>

        {/* Sliding Cells Container */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[10000px] h-16 flex items-center justify-center pointer-events-none">
          <motion.div 
            className="flex items-center gap-1 absolute pointer-events-auto"
            animate={{ x: -(headPosition * 56) }} // 52px width + 4px gap = 56px per cell
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
          {cells.map(cell => {
             const isHead = cell.index === headPosition;
             return (
               <div
                  key={cell.index}
                  className={twMerge(
                    clsx(
                      "w-[52px] h-16 flex items-center justify-center font-mono text-2xl transition-all duration-300",
                      {
                        "bg-bg-element border-2 border-primary-base text-primary-base shadow-[0_0_25px_var(--color-primary-base)] ring-4 ring-primary-base/20 relative z-20 scale-110 rounded-lg": isHead,
                        "bg-bg-panel border border-border-main text-text-faint rounded": !isHead && cell.value === '_',
                        "bg-bg-element border border-border-active text-primary-base rounded": !isHead && cell.value !== '_'
                      }
                    )
                  )}
               >
                 {cell.value === '_' ? 'B' : cell.value}
               </div>
             );
          })}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
