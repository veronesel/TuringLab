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

  return (
    <div className="h-12 border-t border-border-main bg-bg-surface flex items-center justify-between px-4 shrink-0 overflow-x-auto min-w-0 no-scrollbar">
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex gap-1 items-center">
          <button
            onClick={resetMachine}
            title="Restart simulation"
            className="p-2 bg-bg-element border border-border-active rounded hover:bg-border-active text-text-secondary transition-colors mr-2"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={undo}
            disabled={historyIndex <= 0 || isRunning}
            title="Undo"
            className={clsx(
              "p-2 border rounded-l transition-colors border-r-0",
              historyIndex <= 0 || isRunning ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed" : "bg-bg-element border-border-active text-text-secondary hover:bg-border-active"
            )}
          >
            <Undo2 size={16} />
          </button>
          
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1 || isRunning}
            title="Redo"
            className={clsx(
              "p-2 border rounded-r transition-colors mr-2",
              historyIndex >= history.length - 1 || isRunning ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed" : "bg-bg-element border-border-active text-text-secondary hover:bg-border-active"
            )}
          >
            <Redo2 size={16} />
          </button>

          <button
            onClick={stepBackward}
            disabled={historyIndex <= 0 || isRunning}
            title="Step backward"
            className={clsx(
              "p-2 border rounded transition-colors",
              historyIndex <= 0 || isRunning ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed" : "bg-bg-element border-border-active text-text-secondary hover:bg-border-active"
            )}
          >
            <SkipBack size={16} />
          </button>
          
          {isRunning ? (
            <button
              onClick={pause}
              title="Pause simulation (running)"
              className="px-6 py-2 bg-primary-dark border border-primary-base text-text-primary rounded shadow-lg shadow-primary-base/20 hover:bg-primary-base mx-1"
            >
              <Pause size={16} />
            </button>
          ) : (
            <button
              onClick={run}
              disabled={isDone && historyIndex === history.length - 1} // Can run if we redo-stepped back
              title={(isDone && historyIndex === history.length - 1) ? "Simulation complete" : "Run continuously"}
              className={clsx(
                "px-6 py-2 border rounded transition-colors shadow-lg mx-1",
                (isDone && historyIndex === history.length - 1) ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed shadow-none" : "bg-primary-dark border-primary-base text-text-primary hover:bg-primary-base shadow-primary-base/20"
              )}
            >
              <Play size={16} />
            </button>
          )}

          <button
            onClick={stepForward}
            disabled={isRunning || (isDone && historyIndex === history.length - 1)}
            title="Step forward"
            className={clsx(
              "p-2 border rounded transition-colors",
              isRunning || (isDone && historyIndex === history.length - 1) ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed" : "bg-bg-element border-border-active text-text-secondary hover:bg-border-active"
            )}
          >
            <SkipForward size={16} />
          </button>
        </div>
        <div className="h-4 w-px bg-[#2D333B]"></div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted font-mono whitespace-nowrap">STEP DELAY</span>
          <input 
            type="range" 
            min="10" 
            max="2000" 
            step="10" 
            value={executionSpeed}
            onChange={(e) => setExecutionSpeed(Number(e.target.value))}
            className="w-16 h-1 bg-bg-element rounded-lg appearance-none cursor-pointer" 
          />
          <div className="flex items-center gap-1">
            <input 
              type="number"
              min="10"
              max="5000"
              step="10"
              value={executionSpeed}
              onChange={(e) => setExecutionSpeed(Number(e.target.value))}
              className="w-12 bg-bg-panel border border-border-main rounded px-1 py-0.5 text-xs font-mono text-text-primary text-center appearance-none outline-none focus:border-primary-base"
            />
            <span className="text-[10px] text-text-muted font-mono">ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
