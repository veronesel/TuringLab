import fs from 'fs';

let content = fs.readFileSync('src/components/turing/StateDiagram.tsx', 'utf8');

content = content.replace("import { motion } from 'motion/react';", "").replace(
  "import { Save, ChevronDown, Trash2, Camera, X, HelpCircle, BrainCircuit, Maximize } from 'lucide-react';",
  "import { motion } from 'motion/react';\nimport { Save, ChevronDown, Trash2, Camera, X, HelpCircle, BrainCircuit, Maximize, Map, Flame, List, ArrowRightLeft, LayoutGrid, Undo2, MousePointerClick, Crosshair } from 'lucide-react';"
);

// Add containerRef to StateDiagramInternal
content = content.replace(
  "const StateDiagramInternal: React.FC<StateDiagramProps> = ({ onExplainLogic }) => {",
  "const StateDiagramInternal: React.FC<StateDiagramProps> = ({ onExplainLogic }) => {\n  const containerRef = React.useRef<HTMLDivElement>(null);\n"
);

// Add IconButton
content = content.replace(
  "const StateDiagramInternal: React.FC<StateDiagramProps> = ({ onExplainLogic }) => {",
  `const IconButton = ({ icon: Icon, tooltip, onClick, isActive, className = '', disabled=false }: any) => {
  return (
    <div className={\`relative group flex items-center justify-center \${className}\`}>
      <button 
        onClick={onClick}
        disabled={disabled}
        className={\`p-2 rounded transition-colors flex items-center justify-center \${
           isActive 
             ? 'bg-primary-dark border border-primary-base text-text-primary' 
             : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'
        } \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}
      >
        <Icon size={14} />
      </button>
      <div className="absolute right-full mr-2 px-2 py-1 bg-bg-surface text-text-primary text-[10px] whitespace-nowrap rounded border border-border-main opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">
        {tooltip}
      </div>
    </div>
  )
}

const StateDiagramInternal: React.FC<StateDiagramProps> = ({ onExplainLogic }) => {`
);

// Right Toolbar replacing
const originToolbar = `       <div className="flex-1 w-full h-full min-h-0 min-w-0 relative">
          <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 p-2 bg-bg-surface/80 backdrop-blur border border-border-main rounded-lg shadow-xl pointer-events-auto max-h-[calc(100%-2rem)] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setShowHowItWorks(true)}
              className="text-[9px] font-bold bg-primary-base/20 hover:bg-primary-base/35 text-primary-base border border-primary-base/40 px-2.5 py-1.5 rounded transition-colors flex items-center justify-center gap-1"
              title="Click to understand how this specific Turing Machine works"
            >
              <HelpCircle size={11} /> HOW IT WORKS
            </button>
            <div className="h-px w-full bg-border-main my-1"></div>
            <button
              onClick={handleResetZoom}
              className="text-[9px] font-bold bg-bg-element hover:bg-border-active text-text-secondary w-full py-1.5 rounded transition-colors border border-transparent text-center"
              title="Reset Zoom to 100%"
            >
              {zoomLevel}%
            </button>
           <button 
             onClick={() => setAutoFit(!autoFit)}
             className={\`text-[9px] font-bold w-full py-1.5 rounded transition-colors \${autoFit ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}\`}
           >
             AUTO-FIT: {autoFit ? 'ON' : 'OFF'}
           </button>
           <button 
             onClick={() => setHeatmapMode(!heatmapMode)}
             className={\`text-[9px] font-bold w-full py-1.5 rounded transition-colors \${heatmapMode ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}\`}
             title="Color nodes based on how frequently the machine has entered each state"
           >
             HEATMAP: {heatmapMode ? 'ON' : 'OFF'}
           </button>
           <button 
             onClick={() => setShowMinimap(!showMinimap)}
             className={\`text-[9px] font-bold w-full py-1.5 rounded transition-colors \${showMinimap ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}\`}
           >
             MINIMAP: {showMinimap ? 'ON' : 'OFF'}
           </button>
           <button 
             onClick={() => setShowLegend(!showLegend)}
             className={\`text-[9px] font-bold w-full py-1.5 rounded transition-colors \${showLegend ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}\`}
           >
             LEGEND: {showLegend ? 'ON' : 'OFF'}
           </button>
           <button 
             onClick={() => setShowArrows(!showArrows)}
             className={\`text-[9px] font-bold w-full py-1.5 rounded transition-colors \${showArrows ? 'bg-primary-dark border border-primary-base text-text-primary' : 'bg-bg-element hover:bg-border-active text-text-secondary border border-transparent'}\`}
           >
             ARROWS: {showArrows ? 'ON' : 'OFF'}
           </button>
           <div className="h-px w-full bg-border-main my-1"></div>
           <button 
             onClick={handleRelayout}
             className="text-[9px] font-bold bg-bg-element hover:bg-border-active text-text-primary w-full py-1.5 rounded transition-colors border border-transparent"
           >
             RE-LAYOUT
           </button>
           <button 
             onClick={handleSnapshot}
             className="flex items-center justify-center gap-1 text-[9px] font-bold bg-bg-element hover:bg-border-active text-text-primary w-full py-1.5 rounded transition-colors border border-transparent"
           >
             <Camera size={10} /> SNAPSHOT
           </button>

           <button 
             onClick={undo}
             disabled={historyIndex <= 0 || isRunning}
             className="text-[9px] font-bold bg-bg-element hover:bg-border-active disabled:opacity-50 text-text-primary w-full py-1.5 rounded transition-colors border border-transparent"
             title="Undo State Change"
           >
             STEP BACK
           </button>
           
           {/* Checkpoint Dropdown */}
           <div className="relative w-full">
             <div className="flex bg-bg-element rounded border border-border-main text-[9px] font-bold w-full">
                <button 
                  onClick={() => {
                     const name = window.prompt("Save checkpoint name:", \`Step \${useTMStore.getState().historyIndex}\`);
                     if (name) addDiagramCheckpoint(name);
                  }}
                  className="flex items-center justify-center gap-1 flex-1 py-1.5 hover:bg-border-active text-primary-base transition-colors border-r border-border-main"
                  title="Save current state as Checkpoint"
                >
                  <Save size={10} /> SAVE
                </button>
                <button 
                  onClick={() => setShowCheckpoints(!showCheckpoints)}
                  className="px-2 py-1.5 hover:bg-border-active transition-colors flex items-center justify-center text-text-primary"
                >
                  {diagramCheckpoints.length} <ChevronDown size={10} className="ml-0.5"/>
                </button>
             </div>
             
             {showCheckpoints && (
               <div className="absolute top-0 right-[calc(100%+8px)] w-48 bg-bg-panel border border-border-main rounded shadow-xl overflow-hidden z-50">
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
                            className="p-1.5 text-text-faint hover:text-red-400 hover:bg-red-400/10 rounded transition-colors hidden group-hover:block shrink-0"
                            title="Delete Checkpoint"
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
          </div>`;

const replaceToolbar = `       <div className="flex-1 w-full h-full min-h-0 min-w-0 relative" ref={containerRef}>
          <motion.div drag dragMomentum={false} dragConstraints={containerRef} className="absolute top-4 right-4 z-50 flex flex-col gap-1.5 p-1.5 bg-bg-surface/80 backdrop-blur border border-border-main rounded-lg shadow-xl pointer-events-auto max-h-[calc(100%-2rem)] overflow-y-auto no-scrollbar w-[44px]">
            <div className="w-full h-3 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 mb-1">
               <div className="w-4 h-1 bg-text-muted rounded-full"></div>
            </div>
            
            <IconButton icon={HelpCircle} tooltip="How It Works" onClick={() => setShowHowItWorks(true)} />
            <div className="h-px w-full bg-border-main my-0.5"></div>
            
            <div className="relative group flex items-center justify-center">
               <button 
                 onClick={handleResetZoom}
                 className="p-2 bg-bg-element hover:bg-border-active text-text-secondary rounded transition-colors flex items-center justify-center"
               >
                 <span className="text-[8px] font-bold leading-none">{zoomLevel}<br/>%</span>
               </button>
               <div className="absolute right-full mr-2 px-2 py-1 bg-bg-surface text-text-primary text-[10px] whitespace-nowrap rounded border border-border-main opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">
                 Reset Zoom (100%)
               </div>
            </div>

            <IconButton icon={Crosshair} isActive={autoFit} tooltip={\`Auto-Fit: \${autoFit ? 'ON' : 'OFF'}\`} onClick={() => setAutoFit(!autoFit)} />
            <IconButton icon={Flame} isActive={heatmapMode} tooltip={\`Heatmap: \${heatmapMode ? 'ON' : 'OFF'}\`} onClick={() => setHeatmapMode(!heatmapMode)} />
            <IconButton icon={Map} isActive={showMinimap} tooltip={\`Minimap: \${showMinimap ? 'ON' : 'OFF'}\`} onClick={() => setShowMinimap(!showMinimap)} />
            <IconButton icon={List} isActive={showLegend} tooltip={\`Legend: \${showLegend ? 'ON' : 'OFF'}\`} onClick={() => setShowLegend(!showLegend)} />
            <IconButton icon={ArrowRightLeft} isActive={showArrows} tooltip={\`Arrows: \${showArrows ? 'ON' : 'OFF'}\`} onClick={() => setShowArrows(!showArrows)} />
            
            <div className="h-px w-full bg-border-main my-0.5"></div>
            
            <IconButton icon={LayoutGrid} tooltip="Re-Layout" onClick={handleRelayout} />
            <IconButton icon={Camera} tooltip="Snapshot" onClick={handleSnapshot} />
            <IconButton icon={Undo2} tooltip="Step Back" disabled={historyIndex <= 0 || isRunning} onClick={undo} />
            
            {/* Checkpoint Dropdown */}
            <div className="relative w-full group">
              <button 
                onClick={() => setShowCheckpoints(!showCheckpoints)}
                className="w-full flex flex-col items-center justify-center bg-bg-element hover:bg-border-active py-1.5 rounded transition-colors border border-transparent"
              >
                <div className="flex text-text-primary items-center"><Save size={12} /></div>
                <div className="flex text-[9px] font-bold text-text-secondary mt-0.5 leading-none">
                  {diagramCheckpoints.length} <ChevronDown size={8} />
                </div>
              </button>
              
               <div className="absolute right-full mr-2 top-0 px-2 py-1 bg-bg-surface text-text-primary text-[10px] whitespace-nowrap rounded border border-border-main opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">
                 Checkpoints (Click to open)
               </div>
              
              {showCheckpoints && (
                <div className="absolute top-0 right-[calc(100%+8px)] w-48 bg-bg-panel border border-border-main rounded shadow-xl overflow-hidden z-[200]">
                  <div className="flex items-center justify-between p-2 border-b border-border-main">
                     <span className="text-[10px] font-bold text-text-muted">SAVED CHECKPOINTS</span>
                     <button
                        onClick={() => {
                           const name = window.prompt("Save checkpoint name:", \`Step \${useTMStore.getState().historyIndex}\`);
                           if (name) addDiagramCheckpoint(name);
                        }}
                        className="text-[9px] bg-primary-base/20 text-primary-base hover:bg-primary-base/40 px-1.5 py-0.5 rounded"
                     >
                        + SAVE
                     </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto no-scrollbar">
                    {diagramCheckpoints.length === 0 ? (
                      <div className="p-3 text-[10px] text-text-faint text-center">No checkpoints saved.</div>
                    ) : (
                      diagramCheckpoints.map(cp => (
                        <div key={cp.id} className="flex items-center justify-between p-2 hover:bg-bg-element border-b border-border-main/50 last:border-0 group/cp cursor-pointer" onClick={() => { jumpToStep(cp.stepNumber); setShowCheckpoints(false); }}>
                           <div className="flex flex-col min-w-0">
                             <span className="text-[10px] text-text-primary truncate font-bold">{cp.name}</span>
                             <span className="text-[9px] text-text-muted font-mono">Step: {cp.stepNumber}</span>
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); removeDiagramCheckpoint(cp.id); }}
                             className="p-1.5 text-text-faint hover:text-red-400 hover:bg-red-400/10 rounded transition-colors hidden group-hover/cp:block shrink-0"
                             title="Delete Checkpoint"
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
          </motion.div>`;

content = content.replace(originToolbar, replaceToolbar);

let legendFind = `          {showLegend && (
            <Panel position="bottom-left" className="legend-panel">
              <div className="bg-bg-panel border border-border-main rounded-lg p-3 shadow-lg flex flex-col gap-2 max-w-[180px] pointer-events-auto">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border-main pb-1 mb-1">Legend</h3>`;

let legendReplace = `          {showLegend && (
            <motion.div drag dragMomentum={false} dragConstraints={containerRef} className="absolute bottom-4 left-4 z-50 pointer-events-auto">
              <div className="bg-bg-panel border border-border-main rounded-lg p-3 shadow-lg flex flex-col gap-2 max-w-[180px]">
                <div className="w-full h-3 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 -mt-1 mb-1">
                   <div className="w-6 h-1 bg-text-muted rounded-full"></div>
                </div>
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border-main pb-1 mb-1">Legend</h3>`;

content = content.replace(legendFind, legendReplace);
content = content.replace(
  `                  </div>
                )}
              </div>
            </Panel>
          )}`,
  `                  </div>
                )}
              </div>
            </motion.div>
          )}`
);

fs.writeFileSync('src/components/turing/StateDiagram.tsx', content);
