import React, { useState, useEffect, useMemo } from 'react';
import { useTMStore } from '../../store/tmStore';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StateHeatmap: React.FC = () => {
  const history = useTMStore(state => state.history);
  const historyIndex = useTMStore(state => state.historyIndex);
  const activeScenario = useTMStore(state => state.activeScenario);
  const [viewType, setViewType] = useState<'chart' | 'grid'>('chart');
  
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

  const chartData = React.useMemo(() => {
    return Object.entries(stateCounts)
      .map(([stateName, count]) => ({
        name: stateName,
        visits: count,
        color: activeScenario?.stateColors?.[stateName] || 'var(--color-primary-base)'
      }))
      .sort((a, b) => b.visits - a.visits);
  }, [stateCounts, activeScenario]);

  return (
    <div className="mt-3 text-[10px] font-sans flex flex-col">
      <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
        <div className="text-[9px] text-text-muted uppercase font-bold">State Visitation Analysis</div>
        <div className="flex gap-1">
          <button 
            onClick={() => setViewType('chart')}
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors ${viewType === 'chart' ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}`}
          >
            BAR CHART
          </button>
          <button 
            onClick={() => setViewType('grid')}
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors ${viewType === 'grid' ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}`}
          >
            HEATMAP GRID
          </button>
        </div>
      </div>

      {Object.keys(stateCounts).length === 0 ? (
        <div className="h-28 flex items-center justify-center border border-border-main rounded bg-bg-surface text-text-faint">
          No states visited yet
        </div>
      ) : viewType === 'chart' ? (
        <div className="h-32 bg-bg-surface border border-border-main rounded p-2 flex flex-col justify-between">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: -5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--color-border-main)' }} 
                />
                <YAxis 
                  tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--color-border-main)' }} 
                  width={35}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border-main)', fontSize: '10px', borderRadius: '4px' }}
                  labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '2px' }}
                  labelFormatter={(label) => `State: ${label}`}
                  formatter={(value: any) => [value, 'Visits']}
                  isAnimationActive={false}
                />
                <Bar dataKey="visits" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {chartData.map((entry, index) => {
                    let cellColor = entry.color;
                    if (cellColor === 'var(--color-diagram-node)') {
                      cellColor = 'var(--color-primary-base)';
                    }
                    return <Cell key={`cell-${index}`} fill={cellColor} fillOpacity={0.8} stroke={cellColor} strokeWidth={1} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center px-1 pt-1.5 border-t border-border-main text-[8px] text-text-faint font-mono">
            <span>MOST ACTIVE: {chartData[0]?.name} ({chartData[0]?.visits} visits)</span>
            <span>TOTAL STATES INVOLVED: {chartData.length}</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
          {Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).map(([stateName, count]) => {
            const intensity = Math.max(0.05, count / maxVisits);
            const customColor = activeScenario?.stateColors?.[stateName];
            let barBg = customColor && customColor !== 'var(--color-diagram-node)' ? customColor : 'var(--color-primary-base)';
            return (
              <div key={stateName} className="relative bg-bg-surface rounded border border-border-main overflow-hidden flex items-center justify-between p-1 px-2 group hover:border-primary-base transition-colors">
                <div 
                  className="absolute left-0 top-0 bottom-0 transition-all opacity-20"
                  style={{ width: `${intensity * 100}%`, backgroundColor: barBg }}
                />
                <div className="flex items-center gap-1.5 relative z-10 truncate max-w-[70%]">
                  <span 
                    className="w-2 h-2 rounded-full border border-black/40 shrink-0" 
                    style={{ backgroundColor: customColor || 'var(--color-diagram-node)' }} 
                  />
                  <span className="font-bold text-text-primary truncate">{stateName}</span>
                </div>
                <span className="font-mono text-text-secondary relative z-10">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TimeComplexityChart: React.FC = () => {
  const history = useTMStore(state => state.history);
  const historyIndex = useTMStore(state => state.historyIndex);
  const [chartView, setChartView] = useState<'head' | 'memory' | 'time'>('head');

  const chartData = useMemo(() => {
    // We only want to plot up to the current history index
    const activeHistory = history.slice(0, historyIndex + 1);
    
    // Subsample if history is too large to keep render fast (~max 100 points)
    const MAX_POINTS = 100;
    const step = Math.max(1, Math.floor(activeHistory.length / MAX_POINTS));
    
    const data = [];
    const speed = useTMStore.getState().executionSpeed || 500;
    
    for (let i = 0; i < activeHistory.length; i += step) {
      const entry = activeHistory[i];
      const tapeKeys = Object.keys(entry.tape || {});
      const tapeSize = tapeKeys.length;
      const nonBlankCount = tapeKeys.filter(
        k => entry.tape[Number(k)] !== undefined && entry.tape[Number(k)] !== '_' && entry.tape[Number(k)] !== ''
      ).length;
      
      const cpuTimeMs = entry.statistics ? entry.statistics.totalTimeMs : 0;
      const simulatedTimeSec = entry.stepCount * (speed / 1000);

      data.push({
        stepCount: entry.stepCount,
        headPosition: entry.headPosition,
        allocatedCells: tapeSize,
        activeSymbols: nonBlankCount,
        cpuTimeMs: Number(cpuTimeMs.toFixed(2)),
        simulatedTimeSec: Number(simulatedTimeSec.toFixed(2))
      });
    }
    
    // Ensure the final state is always included
    if (activeHistory.length > 0 && (activeHistory.length - 1) % step !== 0) {
       const lastEntry = activeHistory[activeHistory.length - 1];
       const tapeKeys = Object.keys(lastEntry.tape || {});
       const tapeSize = tapeKeys.length;
       const nonBlankCount = tapeKeys.filter(
         k => lastEntry.tape[Number(k)] !== undefined && lastEntry.tape[Number(k)] !== '_' && lastEntry.tape[Number(k)] !== ''
       ).length;
       
       const cpuTimeMs = lastEntry.statistics ? lastEntry.statistics.totalTimeMs : 0;
       const simulatedTimeSec = lastEntry.stepCount * (speed / 1000);

       data.push({
         stepCount: lastEntry.stepCount,
         headPosition: lastEntry.headPosition,
         allocatedCells: tapeSize,
         activeSymbols: nonBlankCount,
         cpuTimeMs: Number(cpuTimeMs.toFixed(2)),
         simulatedTimeSec: Number(simulatedTimeSec.toFixed(2))
       });
    }

    return data;
  }, [history, historyIndex]);

  if (chartData.length <= 1) {
    return (
      <div className="mt-3 text-[10px] font-sans flex flex-col h-44">
        <div className="text-[9px] text-text-muted mb-1 uppercase font-bold">Execution Performance Analysis</div>
        <div className="flex-1 flex items-center justify-center border border-border-main rounded bg-bg-surface text-text-faint">
          Not enough data yet
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 text-[10px] font-sans flex flex-col">
      <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
        <div className="text-[9px] text-text-muted uppercase font-bold">
          {chartView === 'head' && 'Space-Time (Head Trajectory)'}
          {chartView === 'memory' && 'Memory (Tape Growth)'}
          {chartView === 'time' && 'Time Complexity (Step Count vs Time)'}
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => setChartView('head')}
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors ${chartView === 'head' ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}`}
          >
            TRAJECTORY
          </button>
          <button 
            onClick={() => setChartView('memory')}
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors ${chartView === 'memory' ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}`}
          >
            TAPE GROW
          </button>
          <button 
            onClick={() => setChartView('time')}
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors ${chartView === 'time' ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}`}
          >
            STEP VS TIME
          </button>
        </div>
      </div>
      <div className="h-44 bg-bg-surface border border-border-main rounded p-2 flex flex-col justify-between">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'head' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: -5 }}>
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
            ) : chartView === 'memory' ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: -5 }}>
                <XAxis dataKey="stepCount" tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-main)' }} minTickGap={20} />
                <YAxis tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-main)' }} width={40} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border-main)', fontSize: '10px', borderRadius: '4px' }}
                  labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '2px' }}
                  labelFormatter={(label) => `Step: ${label}`}
                  isAnimationActive={false}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '8px', paddingTop: '4px' }} />
                <Area 
                  type="monotone" 
                  dataKey="allocatedCells" 
                  name="Allocated cells"
                  stroke="#a855f7" 
                  fill="#a855f7" 
                  fillOpacity={0.1}
                  strokeWidth={1.5} 
                  dot={false}
                  isAnimationActive={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="activeSymbols" 
                  name="Occupied cells"
                  stroke="#06b6d4" 
                  fill="#06b6d4" 
                  fillOpacity={0.2}
                  strokeWidth={1.5} 
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: -5 }}>
                <XAxis dataKey="simulatedTimeSec" tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-main)' }} minTickGap={20} />
                <YAxis tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--color-border-main)' }} width={40} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-panel)', border: '1px solid var(--color-border-main)', fontSize: '10px', borderRadius: '4px' }}
                  labelStyle={{ color: 'var(--color-text-muted)', marginBottom: '2px' }}
                  labelFormatter={(label) => `Simulated Time: ${label}s`}
                  isAnimationActive={false}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '8px', paddingTop: '4px' }} />
                <Line 
                  type="monotone" 
                  dataKey="stepCount" 
                  name="Steps Executed"
                  stroke="#f5a623" 
                  strokeWidth={1.5} 
                  dot={false}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpuTimeMs" 
                  name="CPU time (ms)"
                  stroke="#f43f5e" 
                  strokeWidth={1} 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Quick legend stats metrics at the bottom of the chart card */}
        <div className="flex justify-between items-center px-1 pt-1.5 border-t border-border-main text-[8px] text-text-faint font-mono">
          {chartView === 'head' && (
            <>
              <span>STEPS METRIC</span>
              <span>HEAD SPAN: {Math.max(...chartData.map(d => d.headPosition)) - Math.min(...chartData.map(d => d.headPosition))} CELLS</span>
            </>
          )}
          {chartView === 'memory' && (
            <>
              <span>MEMORY EFFICIENCY</span>
              <span>OCCUPANCY RATE: {((chartData[chartData.length - 1]?.activeSymbols / (chartData[chartData.length - 1]?.allocatedCells || 1)) * 100).toFixed(0)}%</span>
            </>
          )}
          {chartView === 'time' && (
            <>
              <span>PERFORMANCE INDEX</span>
              <span>COMPUTATION COST: {chartData[chartData.length - 1]?.cpuTimeMs}ms TOTAL</span>
            </>
          )}
        </div>
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
      <TimeComplexityChart />

      <div className="flex justify-between items-center mt-4 mb-2 min-w-0 flex-wrap gap-2 border-t border-border-main pt-3">
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
