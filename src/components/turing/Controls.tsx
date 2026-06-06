import React, { useEffect } from 'react';
import { useTMStore } from '../../store/tmStore';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

export const Controls: React.FC = () => {
  const { run, pause, stepForward, stepBackward, resetMachine, isRunning, history, status } = useTMStore();

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = window.setInterval(() => {
        stepForward();
      }, 500); // 500ms per step
    }
    return () => clearInterval(interval);
  }, [isRunning, stepForward]);

  const isDone = status === 'accepted' || status === 'rejected' || status === 'error';

  return (
    <div className="h-12 border-t border-border-main bg-bg-surface flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          <button
            onClick={resetMachine}
            title="Restart simulation"
            className="p-2 bg-bg-element border border-border-active rounded hover:bg-border-active text-text-secondary transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={stepBackward}
            disabled={history.length <= 1 || isRunning}
            title="Step backward"
            className={clsx(
              "p-2 border rounded transition-colors",
              history.length <= 1 || isRunning ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed" : "bg-bg-element border-border-active text-text-secondary hover:bg-border-active"
            )}
          >
            <SkipBack size={16} />
          </button>
          
          {isRunning ? (
            <button
              onClick={pause}
              title="Pause simulation (running)"
              className="px-6 py-2 bg-primary-dark border border-primary-base text-text-primary rounded shadow-lg shadow-primary-base/20 hover:bg-primary-base"
            >
              <Pause size={16} />
            </button>
          ) : (
            <button
              onClick={run}
              disabled={isDone}
              title={isDone ? "Simulation complete" : "Run continuously"}
              className={clsx(
                "px-6 py-2 border rounded transition-colors shadow-lg",
                isDone ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed shadow-none" : "bg-primary-dark border-primary-base text-text-primary hover:bg-primary-base shadow-primary-base/20"
              )}
            >
              <Play size={16} />
            </button>
          )}

          <button
            onClick={stepForward}
            disabled={isRunning || isDone}
            title="Step forward"
            className={clsx(
              "p-2 border rounded transition-colors",
              isRunning || isDone ? "bg-bg-panel border-border-main text-text-faint cursor-not-allowed" : "bg-bg-element border-border-active text-text-secondary hover:bg-border-active"
            )}
          >
            <SkipForward size={16} />
          </button>
        </div>
        <div className="h-4 w-px bg-[#2D333B]"></div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted font-mono">SPEED</span>
          <input type="range" className="w-24 h-1 bg-bg-element rounded-lg appearance-none cursor-pointer" />
        </div>
      </div>
    </div>
  );
};
