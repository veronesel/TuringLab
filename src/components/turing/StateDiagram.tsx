import React, { useMemo, useEffect } from 'react';
import { ReactFlow, Controls, Background, Node, Edge, MarkerType, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTMStore } from '../../store/tmStore';

const StateDiagramInternal: React.FC = () => {
  const rules = useTMStore(state => state.rules);
  const activeScenario = useTMStore(state => state.activeScenario);
  const currentState = useTMStore(state => state.currentState);
  const lastRuleId = useTMStore(state => state.lastRuleId);
  const status = useTMStore(state => state.status);
  const { fitView } = useReactFlow();

  const { nodes, edges } = useMemo(() => {
    const states = new Set<string>();
    if (activeScenario) {
      states.add(activeScenario.initialState);
      activeScenario.acceptStates.forEach(s => states.add(s));
    }
    rules.forEach(r => {
      states.add(r.currentState);
      states.add(r.nextState);
    });

    const statesArr = Array.from(states);
    const radius = Math.max(150, statesArr.length * 40);
    const centerX = 250;
    const centerY = 250;

    const newNodes: Node[] = statesArr.map((stateName, index) => {
      const angle = (index / statesArr.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      const isAccept = activeScenario?.acceptStates.includes(stateName);
      const isStart = activeScenario?.initialState === stateName;
      const isActive = stateName === currentState;

      let bgColor = isActive ? 'var(--color-primary-base)' : 'var(--color-bg-panel)';
      if (status === 'error' && isActive) bgColor = '#ef4444';
      if (status === 'rejected' && isActive) bgColor = '#f97316';

      const baseNode = {
        id: stateName,
        position: { x, y },
        data: { label: stateName },
        style: {
          background: bgColor,
          color: isActive ? 'var(--color-bg-base)' : 'var(--color-text-primary)',
          border: isAccept ? '4px double' : '2px solid',
          borderColor: isAccept ? '#22c55e' : (isStart ? '#3b82f6' : 'var(--color-border-main)'),
          borderRadius: isAccept ? '50%' : '12px',
          width: isAccept ? 45 : 70,
          height: isAccept ? 45 : 45,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          boxShadow: isActive ? '0 0 15px var(--color-primary-base)' : 'none',
          fontFamily: 'sans-serif',
          fontSize: '12px'
        }
      };

      return baseNode;
    });

    if (activeScenario) {
      newNodes.push({
        id: '__start__',
        type: 'default',
        position: { x: centerX + radius - 100, y: centerY - 100 }, // Placed near initial state (would ideally compute it)
        data: { label: '' },
        style: {
          background: 'var(--color-text-primary)',
          border: 'none',
          borderRadius: '50%',
          width: 20,
          height: 20,
          minWidth: 20,
        }
      });
    }

    const newEdges: Edge[] = rules.map(rule => {
      const isActiveTrans = rule.id === lastRuleId;
      return {
        id: rule.id,
        source: rule.currentState,
        target: rule.nextState,
        label: `${rule.readSymbol}→${rule.writeSymbol},${rule.moveDirection}`,
        type: 'bezier',
        animated: isActiveTrans,
        style: {
          stroke: isActiveTrans ? 'var(--color-primary-base)' : 'var(--color-border-active)',
          strokeWidth: isActiveTrans ? 3 : 1.5,
        },
        labelStyle: { fill: isActiveTrans ? 'var(--color-primary-base)' : 'var(--color-text-muted)', fontWeight: isActiveTrans ? 'bold' : 'normal', fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: 'var(--color-bg-surface)', fillOpacity: 0.8 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isActiveTrans ? 'var(--color-primary-base)' : 'var(--color-border-active)',
        },
      };
    });

    if (activeScenario) {
      newEdges.push({
        id: '__start_edge__',
        source: '__start__',
        target: activeScenario.initialState,
        type: 'straight',
        style: { stroke: 'var(--color-text-primary)', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-text-primary)' },
      });
    }

    return { nodes: newNodes, edges: newEdges };
  }, [rules, activeScenario, currentState, lastRuleId, status]);

  // Re-fit view when scenario changes
  useEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, [activeScenario, fitView]);

  return (
    <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] overflow-hidden flex flex-col">
      <div className="p-3 flex justify-between bg-bg-base/80 z-10 relative pointer-events-none shrink-0 border-b border-border-main">
         <span className="text-[10px] font-bold text-primary-base/50 tracking-widest uppercase italic font-sans">Visual State Diagram v0.1</span>
         <div className="flex gap-2 font-sans">
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary-base shadow-[0_0_5px_#f59e0b]"></div><span className="text-[9px] text-text-secondary">ACTIVE</span></div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[9px] text-text-secondary">START</span></div>
         </div>
      </div>
      <div className="flex-1 w-full h-full">
        <ReactFlow 
          nodes={nodes} 
          edges={edges}
          fitView
          attributionPosition="bottom-right"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} color="var(--color-border-main)" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export const StateDiagram: React.FC = () => (
  <ReactFlowProvider>
    <StateDiagramInternal />
  </ReactFlowProvider>
);
