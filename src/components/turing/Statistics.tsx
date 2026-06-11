import React, { useState, useEffect, useMemo } from 'react';
import { useTMStore } from '../../store/tmStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const StateHeatmap: React.FC = () => {
  const history = useTMStore(state => state.history);
  const historyIndex = useTMStore(state => state.historyIndex);
  
  const stateCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (let i = 0; i <= historyIndex; i++) {
        const h = history[i];
        if (h && h.currentState) {
          counts[h.currentState] = (counts[h.currentState] || 0) + 1;
        }
    }
    return counts;
  }, [history, historyIndex]);

  const maxVisits = Math.max(1, ...Object.values(stateCounts));

  return (
    <div className="mt-3 text-[10px] font-sans">
      <div className="text-[9px] text-text-muted mb-1 uppercase font-bold">State Visits Heatmap</div>
      <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
        {Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).map(([stateName, count]) => {
          const intensity = Math.max(0.05, count / maxVisits);
          return (
            <div key={stateName} className="relative bg-bg-surface rounded border border-border-main overflow-hidden flex items-center justify-between p-1 px-2 group hover:border-primary-base transition-colors overflow-hidden">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-primary-base/30 transition-all opacity-70"
                style={{ width: `${intensity * 100}%` }}
              />
              <span className="font-bold text-text-primary relative z-10 truncate max-w-[60%]">{stateName}</span>
              <span className="font-mono text-text-secondary relative z-10">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimeComplexityChart: React.FC = () => {
  const history = useTMStore(state => state.history);
  const historyIndex = useTMStore(state => state.historyIndex);

  const chartData = useMemo(() => {
    // We only want to plot up to the current history index
    const activeHistory = history.slice(0, historyIndex + 1);
    
    // Subsample if history is too large to keep render fast (~max 100 points)
    const MAX_POINTS = 100;
    const step = Math.max(1, Math.floor(activeHistory.length / MAX_POINTS));
    
    const data = [];
    
    for (let i = 0; i < activeHistory.length; i += step) {
      const entry = activeHistory[i];
      data.push({
        stepCount: entry.stepCount,
        headPosition: entry.headPosition
      });
    }
    
    // Ensure the final state is always included
    if (activeHistory.length > 0 && (activeHistory.length - 1) % step !== 0) {
       const lastEntry = activeHistory[activeHistory.length - 1];
       data.push({
         stepCount: lastEntry.stepCount,
         headPosition: lastEntry.headPosition
       });
    }

    return data;
  }, [history, historyIndex]);

  if (chartData.length <= 1) {
    return (
      <div className="mt-3 text-[10px] font-sans flex flex-col h-32">
        <div className="text-[9px] text-text-muted mb-1 uppercase font-bold">Space-Time Complexity</div>
        <div className="flex-1 flex items-center justify-center border border-border-main rounded bg-bg-surface text-text-faint">
          Not enough data yet
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 text-[10px] font-sans flex flex-col h-32">
      <div className="text-[9px] text-text-muted mb-1 uppercase font-bold">Space-Time Complexity</div>
      <div className="flex-1 bg-bg-surface border border-border-main rounded p-1 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: -10 }}>
            <XAxis dataKey="stepCount" tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-main)' }} minTickGap={20} />
            <YAxis tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-main)' }} width={40} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border-main)', fontSize: '10px', borderRadius: '4px' }}
              itemStyle={{ color: 'var(--color-primary-base)' }}
              labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '2px' }}
              labelFormatter={(label) => `Step: ${label}`}
              formatter={(value: any) => [value, 'Tape Head']}
              isAnimationActive={false}
            />
            <Line 
              type="stepAfter" 
              dataKey="headPosition" 
              stroke="var(--color-primary-base)" 
              strokeWidth={1.5} 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

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
    <div className="bg-bg-panel p-3 overflow-y-auto flex flex-col font-sans flex-1 min-h-0 min-w-0">
      <div className="flex justify-between items-center mb-2 min-w-0 flex-wrap gap-2">
        <span className="text-[10px] font-bold text-text-muted uppercase">Real-time Stats</span>
        <span className={`text-[10px] uppercase font-bold ${status === 'running' ? 'text-primary-base' : status === 'accepted' ? 'text-green-400' : status === 'error' || status === 'rejected' ? 'text-red-400' : 'text-text-secondary'}`}>{status}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 min-w-0">
        <div className="bg-bg-surface p-2 rounded border border-border-active min-w-0 overflow-hidden">
          <div className="text-[9px] text-text-muted truncate">Steps / Hz</div>
          <div className="text-sm font-mono font-bold text-text-secondary mt-0.5 truncate">{statistics.stepsExecuted} / {sps}</div>
        </div>
        <div className="bg-bg-surface p-2 rounded border border-border-active min-w-0 overflow-hidden">
          <div className="text-[9px] text-text-muted truncate">Memory (Cells)</div>
          <div className="text-sm font-mono font-bold text-text-secondary mt-0.5 truncate">{memoryUsage}</div>
        </div>
        <div className="bg-bg-surface p-2 rounded border border-border-active min-w-0 overflow-hidden">
          <div className="text-[9px] text-text-muted truncate">Symbols Built</div>
          <div className="text-lg font-mono font-bold text-text-secondary truncate">{statistics.symbolsWritten}</div>
        </div>
        <div className="bg-bg-surface p-2 rounded border border-border-active min-w-0 overflow-hidden">
          <div className="text-[9px] text-text-muted truncate">Tape Shifts</div>
          <div className="text-lg font-mono font-bold text-text-secondary truncate">{statistics.tapeMovements.R + statistics.tapeMovements.L}</div>
        </div>
        <div className="bg-bg-surface p-2 rounded border border-border-active min-w-0 overflow-hidden">
          <div className="text-[9px] text-text-muted truncate">Unique States</div>
          <div className="text-lg font-mono font-bold text-text-secondary truncate">{statistics.uniqueStatesVisited}</div>
        </div>
        <div className="bg-bg-surface p-2 rounded border border-border-active col-span-2 min-w-0 overflow-hidden">
          <div className="text-[9px] text-text-muted mb-1 uppercase font-bold text-primary-base/80">Performance Dashboard</div>
          <div className="flex justify-between items-center text-[10px] mb-0.5">
             <span className="text-text-muted">Total Transitions:</span>
             <span className="font-mono font-bold text-text-primary">{statistics.stepsExecuted}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] mb-0.5">
             <span className="text-text-muted">Avg Time/Step:</span>
             <span className="font-mono font-bold text-text-primary">
                {statistics.stepsExecuted > 0 ? (statistics.totalTimeMs / statistics.stepsExecuted).toFixed(2) : '0.00'} ms
             </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
             <span className="text-text-muted">Memory Usage:</span>
             <span className="font-mono font-bold text-text-primary">{memoryUsage * 8} B</span>
          </div>
        </div>
      </div>
      
      <TimeComplexityChart />
      <StateHeatmap />
    </div>
  );
}

export const Debugger: React.FC = () => {
  const history = useTMStore(state => state.history);
  const historyIndex = useTMStore(state => state.historyIndex);
  const errorMessage = useTMStore(state => state.errorMessage);
  const jumpToStep = useTMStore(state => state.jumpToStep);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historyIndex, history.length]);

  return (
    <div className="flex-1 flex flex-col font-sans w-full bg-bg-surface overflow-hidden min-w-0">
      <div className="px-3 py-1.5 bg-bg-panel border-b border-border-main text-[10px] font-bold text-text-muted flex justify-between items-center shrink-0 min-w-0">
        <span className="uppercase">Simulation Log</span>
        <span className="text-primary-base font-mono">{history.length} Events</span>
      </div>
      <div ref={scrollRef} className="flex-1 p-2 font-mono text-[10px] overflow-y-auto space-y-1 w-full relative">
        {history.map((h, i) => {
          const isCurrent = i === historyIndex;
          const isFuture = i > historyIndex;

          const prevTape = i > 0 ? history[i-1].tape : null;
          const prevHead = i > 0 ? history[i-1].headPosition : null;
          
          let writtenSymbol = null;
          let movedDir = null;
          
          if (prevTape && prevHead !== null) {
            writtenSymbol = h.tape[prevHead] !== prevTape[prevHead] ? h.tape[prevHead] : null;
            if (h.headPosition > prevHead) movedDir = "R";
            else if (h.headPosition < prevHead) movedDir = "L";
            else movedDir = "S";
          }

          return (
            <div 
              key={i} 
              className={`flex items-center justify-between gap-4 p-1 rounded group cursor-pointer transition-colors ${isCurrent ? 'bg-primary-base/20 border border-primary-base/30' : isFuture ? 'opacity-50 hover:bg-bg-element text-text-faint' : 'hover:bg-bg-element text-text-secondary'}`}
              onClick={() => jumpToStep(i)}
            >
                <div className="flex items-center gap-3 w-full max-w-full overflow-hidden">
                  <span className="min-w-[40px] text-text-muted shrink-0">[{h.stepCount.toString().padStart(4, '0')}]</span> 
                  <span className={`w-12 font-bold shrink-0 ${isCurrent ? 'text-primary-base' : ''}`}>{h.currentState}</span> 
                  
                  {i === 0 ? (
                    <span className="text-text-muted italic truncate">Machine started</span>
                  ) : (
                    <span className="flex items-center gap-2 truncate">
                       {writtenSymbol ? (
                         <span>Wrote <span className="text-amber-400 font-bold">'{writtenSymbol}'</span></span>
                       ) : (
                         <span className="text-text-faint">Read '{prevTape?.[prevHead!] || '_'}'</span>
                       )}
                       <span className="text-text-muted">→</span>
                       <span className={`font-bold ${movedDir === 'L' ? 'text-purple-400' : movedDir === 'R' ? 'text-cyan-400' : 'text-text-muted'}`}>
                         Moved {movedDir}
                       </span>
                    </span>
                  )}
                </div>
                
                <div className="text-text-faint whitespace-nowrap hidden md:block shrink-0">
                  Head: @{h.headPosition}
                </div>
            </div>
          );
        })}
        {errorMessage && historyIndex === history.length - 1 && (
           <div className="flex gap-4 text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20 mt-2">
             <span className="font-bold uppercase">Error:</span> 
             {errorMessage}
           </div>
        )}
      </div>
    </div>
  );
}
