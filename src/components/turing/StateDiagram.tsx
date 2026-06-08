import React, { useMemo, useEffect } from 'react';
import { ReactFlow, Controls, Background, Node, Edge, MarkerType, useReactFlow, ReactFlowProvider, NodeChange, applyNodeChanges } from '@xyflow/react';
import { Save, ChevronDown, Trash2 } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { useTMStore } from '../../store/tmStore';

const StateDiagramInternal: React.FC = () => {
  const rules = useTMStore(state => state.rules);
  const activeScenario = useTMStore(state => state.activeScenario);
  const currentState = useTMStore(state => state.currentState);
  const lastRuleId = useTMStore(state => state.lastRuleId);
  const status = useTMStore(state => state.status);
  const { fitView } = useReactFlow();
  const [autoFit, setAutoFit] = React.useState(true);
  const [showCheckpoints, setShowCheckpoints] = React.useState(false);

  const addDiagramCheckpoint = useTMStore(state => state.addDiagramCheckpoint);
  const removeDiagramCheckpoint = useTMStore(state => state.removeDiagramCheckpoint);
  const diagramCheckpoints = useTMStore(state => state.diagramCheckpoints);
  const jumpToStep = useTMStore(state => state.jumpToStep);

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

    const reachableStates = new Set<string>();
    const outgoingRules = new Map<string, any[]>();
    rules.forEach(r => {
      if (!outgoingRules.has(r.currentState)) outgoingRules.set(r.currentState, []);
      outgoingRules.get(r.currentState)!.push(r);
    });

    if (activeScenario) {
      const toVisit = [activeScenario.initialState];
      reachableStates.add(activeScenario.initialState);
      while(toVisit.length > 0) {
        const curr = toVisit.pop()!;
        const transitions = outgoingRules.get(curr) || [];
        transitions.forEach(t => {
           if (!reachableStates.has(t.nextState)) {
             reachableStates.add(t.nextState);
             toVisit.push(t.nextState);
           }
        });
      }
    }

    const stuckStates = new Set<string>();
    states.forEach(stateName => {
       const isAccept = activeScenario?.acceptStates.includes(stateName);
       if (!isAccept && !outgoingRules.has(stateName)) {
          stuckStates.add(stateName);
       }
    });

    const statesArr = Array.from(states);
    const radius = Math.max(150, statesArr.length * 40);
    const centerX = 250;
    const centerY = 250;

    const newNodes: Node[] = statesArr.map((stateName, index) => {
      const angle = (index / statesArr.length) * 2 * Math.PI;
      
      let x = centerX + radius * Math.cos(angle);
      let y = centerY + radius * Math.sin(angle);

      if (activeScenario?.customPositions && activeScenario.customPositions[stateName]) {
         x = activeScenario.customPositions[stateName].x;
         y = activeScenario.customPositions[stateName].y;
      }
      
      const isAccept = activeScenario?.acceptStates.includes(stateName);
      const isStart = activeScenario?.initialState === stateName;
      const isActive = stateName === currentState;
      const isUnreachable = activeScenario && !reachableStates.has(stateName);
      const isStuck = stuckStates.has(stateName);

      let bgColor = isActive ? 'var(--color-primary-base)' : 'var(--color-diagram-node)';
      if (status === 'error' && isActive) bgColor = '#ef4444';
      if (status === 'rejected' && isActive) bgColor = '#f97316';

      let borderColor = isAccept ? '#22c55e' : (isStart ? '#3b82f6' : 'var(--color-border-main)');
      let borderStyle = isAccept ? '4px double' : '2px solid';

      if (isUnreachable || isStuck) {
         borderColor = '#ef4444';
         if (!isActive) bgColor = '#450a0a';
      }

      const baseNode = {
        id: stateName,
        position: { x, y },
        data: { label: stateName },
        draggable: true,
        style: {
          background: bgColor,
          color: isActive ? 'var(--color-bg-base)' : (isUnreachable || isStuck ? '#fca5a5' : 'var(--color-text-primary)'),
          border: borderStyle,
          borderColor: borderColor,
          borderRadius: isAccept ? '50%' : '12px',
          width: isAccept ? 45 : 70,
          height: isAccept ? 45 : 45,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          boxShadow: isActive ? '0 0 15px var(--color-primary-base)' : (isUnreachable || isStuck ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'),
          fontFamily: 'sans-serif',
          fontSize: '12px'
        }
      };

      return baseNode;
    });

    if (activeScenario) {
      let startX = centerX + radius - 100;
      let startY = centerY - 100;
      if (activeScenario.customPositions && activeScenario.customPositions['__start__']) {
         startX = activeScenario.customPositions['__start__'].x;
         startY = activeScenario.customPositions['__start__'].y;
      }

      newNodes.push({
        id: '__start__',
        type: 'default',
        position: { x: startX, y: startY },
        data: { label: '' },
        draggable: true,
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

  // Monitor canvas resize events and automatically re-center the diagram
  const resizeObserver = useMemo(() => new ResizeObserver(() => {
    if (autoFit) {
      window.requestAnimationFrame(() => {
        fitView({ padding: 0.2, duration: 300 });
      });
    }
  }), [autoFit, fitView]);

  const [liveNodes, setLiveNodes] = React.useState<Node[]>(nodes);
  
  useEffect(() => {
    setLiveNodes(nodes);
  }, [nodes]);

  const onNodesChange = React.useCallback(
    (changes: NodeChange<Node>[]) => setLiveNodes((nds) => applyNodeChanges(changes, nds)),
    [setLiveNodes]
  );
  
  useEffect(() => {
    const rfEl = document.querySelector('.react-flow');
    if (rfEl) {
      resizeObserver.observe(rfEl);
    }
    return () => resizeObserver.disconnect();
  }, [resizeObserver]);

  // Re-fit view when scenario changes
  useEffect(() => {
    if (autoFit) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
    }
  }, [activeScenario, autoFit, fitView]);

  const updateScenarioPositions = useTMStore(state => state.updateScenarioPositions);

  const handleNodeDragStop = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent, node: Node, newNodes: Node[]) => {
    updateScenarioPositions({ [node.id]: node.position });
  };

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col min-h-0 min-w-0" style={{ backgroundColor: 'var(--color-diagram-bg)' }}>
      <div className="p-3 flex justify-between items-center z-10 relative pointer-events-none shrink-0 border-b border-border-main min-w-0 overflow-x-auto no-scrollbar gap-4" style={{ backgroundColor: 'var(--color-diagram-bg)' }}>
         <span className="text-[10px] font-bold text-primary-base/50 tracking-widest uppercase italic font-sans shrink-0 whitespace-nowrap">Visual State Diagram v0.1</span>
         <div className="flex gap-4 font-sans pointer-events-auto items-center shrink-0">
           <button 
             onClick={() => setAutoFit(!autoFit)}
             className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors ${autoFit ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}`}
           >
             AUTO-FIT : {autoFit ? 'ON' : 'OFF'}
           </button>
           <button 
             onClick={() => fitView({ padding: 0.2, duration: 800 })}
             className="text-[9px] font-bold bg-bg-element hover:bg-border-active text-text-primary px-2 py-0.5 rounded transition-colors border border-transparent"
           >
             ZOOM TO FIT
           </button>
           
           {/* Checkpoint Dropdown */}
           <div className="relative">
             <div className="flex bg-bg-element rounded border border-border-main text-[9px] font-bold">
                <button 
                  onClick={() => {
                     const name = window.prompt("Save checkpoint name:", `Step ${useTMStore.getState().historyIndex}`);
                     if (name) addDiagramCheckpoint(name);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 hover:bg-border-active text-primary-base transition-colors border-r border-border-main"
                  title="Save current state as Checkpoint"
                >
                  <Save size={10} /> SAVE
                </button>
                <button 
                  onClick={() => setShowCheckpoints(!showCheckpoints)}
                  className="px-1 py-0.5 hover:bg-border-active transition-colors flex items-center justify-center text-text-primary"
                >
                  {diagramCheckpoints.length} <ChevronDown size={10} className="ml-0.5"/>
                </button>
             </div>
             
             {showCheckpoints && (
               <div className="absolute top-full right-0 mt-1 w-48 bg-bg-panel border border-border-main rounded shadow-xl overflow-hidden z-50">
                 <div className="p-2 border-b border-border-main text-[10px] font-bold text-text-muted">SAVED CHECKPOINTS</div>
                 <div className="max-h-48 overflow-y-auto no-scrollbar">
                   {diagramCheckpoints.length === 0 ? (
                     <div className="p-3 text-[10px] text-text-faint text-center">No checkpoints saved.</div>
                   ) : (
                     diagramCheckpoints.map(cp => (
                       <div key={cp.id} className="flex items-center justify-between p-2 hover:bg-bg-element border-b border-border-main/50 last:border-0 group cursor-pointer" onClick={() => { jumpToStep(cp.stepNumber); setShowCheckpoints(false); }}>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] text-text-primary truncate font-bold">{cp.name}</span>
                            <span className="text-[9px] text-text-muted font-mono">Step: {cp.stepNumber}</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeDiagramCheckpoint(cp.id); }}
                            className="text-text-faint hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                       </div>
                     ))
                   )}
                 </div>
               </div>
             )}
           </div>

           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary-base shadow-[0_0_5px_var(--color-primary-base)]"></div><span className="text-[9px] text-text-secondary">ACTIVE</span></div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div><span className="text-[9px] text-text-secondary">START</span></div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div><span className="text-[9px] text-red-400">UNREACHABLE/STUCK</span></div>
         </div>
      </div>
      <div className="flex-1 w-full h-full min-h-0 min-w-0 relative">
        <ReactFlow 
          nodes={liveNodes} 
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeDragStop={handleNodeDragStop}
          fitView
          attributionPosition="bottom-right"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} color="var(--color-border-main)" />
          <Controls showInteractive={false} />
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
