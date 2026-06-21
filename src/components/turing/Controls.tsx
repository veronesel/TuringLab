import React, { useEffect } from 'react';
import { useTMStore } from '../../store/tmStore';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { clsx } from 'clsx';

export const Controls: React.FC = () => {
  const { run, pause, stepForward, stepBackward, undo, redo, resetMachine, isRunning, history, historyIndex, status, executionSpeed, setExecutionSpeed } = useTMStore();

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = window.setInterval(() => {
        stepForward();
      }, executionSpeed);
    }
    return () => clearInterval(interval);
  }, [isRunning, stepForward, executionSpeed]);

  const isDone = status === 'accepted' || status === 'rejected' || status === 'error';
  const isIdle = status === 'idle' && !isRunning && historyIndex === 0;

  return (
    <div className="h-12 border-t border-border-main bg-bg-surface flex items-center justify-between px-4 shrink-0 overflow-x-auto min-w-0 no-scrollbar">
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex gap-1 items-center">
          <button
            onClick={resetMachine}
            title="Restart simulation"
            className={clsx(
              "p-2 rounded transition-colors mr-2",
              isIdle ? "bg-bg-element border border-primary-base/50 text-primary-base animate-[pulse_2.5s_ease-in-out_infinite]" : "bg-bg-element border border-border-active hover:bg-border-active text-text-secondary"
            )}
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={() => { if (historyIndex > 0 && !isRunning) undo(); }}
            title="Undo state change (Ctrl+Z)"
            className={clsx(
              "p-2 border rounded-l transition-colors border-r-0",
              historyIndex <= 0 || isRunning ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed opacity-50" : "bg-bg-element border-border-active text-text-secondary hover:bg-border-active cursor-pointer"
            )}
          >
            <Undo2 size={16} />
          </button>
          
          <button
            onClick={() => { if (historyIndex < history.length - 1 && !isRunning) redo(); }}
            title="Redo state change (Ctrl+Y)"
            className={clsx(
              "p-2 border rounded-r transition-colors mr-2",
              historyIndex >= history.length - 1 || isRunning ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed opacity-50" : "bg-bg-element border-border-active text-text-secondary hover:bg-border-active cursor-pointer"
            )}
          >
            <Redo2 size={16} />
          </button>

          <button
            onClick={() => { if (historyIndex > 0 && !isRunning) stepBackward(); }}
            title="Step backward one cycle"
            className={clsx(
              "p-2 border rounded transition-colors",
              historyIndex <= 0 || isRunning ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed opacity-50" : "bg-bg-element border-border-active text-text-secondary hover:bg-border-active cursor-pointer"
            )}
          >
            <SkipBack size={16} />
          </button>
          
          {isRunning ? (
            <button
              onClick={pause}
              title="Pause simulation (Spacebar)"
              className="px-6 py-2 bg-primary-dark border border-primary-base text-text-primary rounded shadow-lg shadow-primary-base/20 hover:bg-primary-base mx-1 cursor-pointer"
            >
              <Pause size={16} />
            </button>
          ) : (
            <button
              onClick={() => { if (!(isDone && historyIndex === history.length - 1)) run(); }}
              title={(isDone && historyIndex === history.length - 1) ? "Simulation complete - reset to run again" : "Run simulation continuously (Spacebar)"}
              className={clsx(
                "px-6 py-2 border rounded transition-colors shadow-lg mx-1",
                (isDone && historyIndex === history.length - 1) 
                  ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed opacity-50" 
                  : isIdle 
                    ? "bg-primary-dark border-primary-base text-text-primary hover:bg-primary-base shadow-primary-base/20 cursor-pointer animate-[pulse_2s_ease-in-out_infinite]"
                    : "bg-primary-dark border-primary-base text-text-primary hover:bg-primary-base shadow-primary-base/20 cursor-pointer"
              )}
            >
              <Play size={16} />
            </button>
          )}

          <button
            onClick={() => { if (!isRunning && !(isDone && historyIndex === history.length - 1)) stepForward(); }}
            title="Step forward one cycle (Right Arrow)"
            className={clsx(
              "p-2 border rounded transition-colors",
              isRunning || (isDone && historyIndex === history.length - 1) ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed opacity-50" : "bg-bg-element border-border-active text-text-secondary hover:bg-border-active cursor-pointer"
            )}
          >
            <SkipForward size={16} />
          </button>
        </div>
        <div className="h-4 w-px bg-[#2D333B]"></div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest whitespace-nowrap">SIM SPEED</span>
          <input 
            type="range" 
            min="1" 
            max="100" 
            step="1" 
            value={Math.round(2000 / executionSpeed)}
            onChange={(e) => {
              const speedVal = Number(e.target.value);
              setExecutionSpeed(Math.max(10, Math.round(2000 / speedVal)));
            }}
            className="w-24 h-1.5 bg-bg-panel border border-border-main rounded appearance-none cursor-pointer accent-primary-base focus:outline-none" 
            title="Adjust Simulation Speed"
          />
          <div className="flex items-center gap-1 w-12 justify-end">
            <span className="text-[10px] text-primary-base font-mono font-bold">{Math.round(2000 / executionSpeed)}x</span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hints */}
      <div className="hidden lg:flex items-center gap-3 shrink-0 text-[10px] text-text-muted font-sans select-none border-l border-border-main pl-4 ml-4">
        <span className="uppercase text-[9px] tracking-widest font-bold opacity-60">Shortcuts:</span>
        <div className="flex items-center gap-1.5 bg-bg-panel/40 px-2 py-1 rounded border border-border-main/40">
          <kbd className="px-1.5 py-0.5 bg-bg-element border border-border-main rounded text-[10px] font-mono font-bold text-text-primary shadow-sm leading-none">Space</kbd>
          <span className="text-text-muted text-[10px] tracking-wide font-medium">{isRunning ? "Pause" : "Play"}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-bg-panel/40 px-2 py-1 rounded border border-border-main/40">
          <kbd className="px-1.5 py-0.5 bg-bg-element border border-border-main rounded text-[10px] font-mono font-bold text-text-primary shadow-sm leading-none">R</kbd>
          <span className="text-text-muted text-[10px] tracking-wide font-medium">Reset</span>
        </div>
        <div className="flex items-center gap-1.5 bg-bg-panel/40 px-2 py-1 rounded border border-border-main/40">
          <kbd className="px-1.5 py-0.5 bg-bg-element border border-border-main rounded text-[10px] font-mono font-bold text-text-primary shadow-sm leading-none">B</kbd>
          <span className="text-text-muted text-[10px] tracking-wide font-medium">Sidebar</span>
        </div>
      </div>
    </div>
  );
};
