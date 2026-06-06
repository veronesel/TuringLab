import React, { useState, useEffect } from 'react';
import { useTMStore } from '../../store/tmStore';

export const Statistics: React.FC = () => {
  const statistics = useTMStore(state => state.statistics);
  const status = useTMStore(state => state.status);
  const tape = useTMStore(state => state.tape);
  
  const [sps, setSps] = useState(0);

  useEffect(() => {
    let lastSteps = useTMStore.getState().statistics.stepsExecuted;
    const interval = setInterval(() => {
      const currentSteps = useTMStore.getState().statistics.stepsExecuted;
      setSps(currentSteps - lastSteps);
      lastSteps = currentSteps;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const memoryUsage = Object.keys(tape).length;

  return (
    <div className="border-t border-border-main bg-bg-panel p-3 overflow-hidden flex flex-col font-sans shrink-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-text-muted uppercase">Real-time Stats</span>
        <span className={`text-[10px] uppercase font-bold ${status === 'running' ? 'text-primary-base' : status === 'accepted' ? 'text-green-400' : status === 'error' || status === 'rejected' ? 'text-red-400' : 'text-text-secondary'}`}>{status}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bg-surface p-2 rounded border border-border-active">
          <div className="text-[9px] text-text-muted">Steps / Hz</div>
          <div className="text-sm font-mono font-bold text-text-secondary mt-0.5">{statistics.stepsExecuted} / {sps}</div>
        </div>
        <div className="bg-bg-surface p-2 rounded border border-border-active">
          <div className="text-[9px] text-text-muted">Memory (Cells)</div>
          <div className="text-sm font-mono font-bold text-text-secondary mt-0.5">{memoryUsage}</div>
        </div>
        <div className="bg-bg-surface p-2 rounded border border-border-active">
          <div className="text-[9px] text-text-muted">Symbols Built</div>
          <div className="text-lg font-mono font-bold text-text-secondary">{statistics.symbolsWritten}</div>
        </div>
        <div className="bg-bg-surface p-2 rounded border border-border-active">
          <div className="text-[9px] text-text-muted">Unique States</div>
          <div className="text-lg font-mono font-bold text-text-secondary">{statistics.uniqueStatesVisited}</div>
        </div>
        <div className="bg-bg-surface p-2 rounded border border-border-active col-span-2">
          <div className="text-[9px] text-text-muted">Tape Mov (L/S/R)</div>
          <div className="text-sm font-mono font-bold text-text-secondary mt-0.5">{statistics.tapeMovements.L}/{statistics.tapeMovements.S}/{statistics.tapeMovements.R}</div>
        </div>
      </div>
    </div>
  );
}

export const Debugger: React.FC = () => {
  const history = useTMStore(state => state.history);
  const errorMessage = useTMStore(state => state.errorMessage);

  return (
    <div className="flex-1 flex flex-col font-sans w-full">
      <div className="px-3 py-1.5 bg-bg-panel border-b border-border-main text-[10px] font-bold text-text-muted flex justify-between">
        <span>DEBUG CONSOLE / HISTORY</span>
        <span className="text-green-500">Live Logging Active</span>
      </div>
      <div className="flex-1 p-2 font-mono text-[9px] overflow-y-auto space-y-1 w-full">
        {history.slice(-50).map((h, i) => (
           <div key={i} className="flex gap-4">
              <span className="text-text-faint min-w-[50px]">[{h.stepCount.toString().padStart(4, '0')}]</span> 
              <span className="text-[#93c5fd]">TRACE:</span> 
              <span>State \`{h.currentState}\` Head 0x{h.headPosition.toString(16).padStart(2, '0')}.</span>
           </div>
        ))}
        {errorMessage && (
           <div className="flex gap-4 text-red-400 mt-2">
             <span className="text-text-faint min-w-[50px]">[{history.length.toString().padStart(4, '0')}]</span> 
             <span className="font-bold uppercase underline">Alert:</span> 
             {errorMessage}
           </div>
        )}
      </div>
    </div>
  );
}
