import fs from 'fs';

let content = fs.readFileSync('src/components/turing/StateDiagram.tsx', 'utf8');

const regexToolbar = /<div className="absolute top-4 right-4 z-50 flex flex-col gap-2.*?<\/div>\n           <\/div>\n          <\/div>/s;

const replaceToolbar = `<motion.div drag dragMomentum={false} dragConstraints={containerRef} className="absolute top-4 right-4 z-50 flex flex-col gap-1.5 p-1.5 bg-bg-surface/80 backdrop-blur border border-border-main rounded-lg shadow-xl pointer-events-auto max-h-[calc(100%-2rem)] overflow-y-auto no-scrollbar w-[44px]">
            <div className="w-full h-3 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 mb-1">
               <div className="w-4 h-1 bg-text-muted rounded-full"></div>
            </div>
            
            <IconButton icon={HelpCircle} tooltip="How It Works" onClick={() => setShowHowItWorks(true)} />
            <div className="h-px w-full bg-border-main my-0.5"></div>
            
            <div className="relative group flex items-center justify-center">
               <button 
                 onClick={handleResetZoom}
                 className="w-full aspect-square bg-bg-element hover:bg-border-active text-text-secondary rounded transition-colors flex items-center justify-center"
               >
                 <span className="text-[8px] font-bold leading-[1.1]">{zoomLevel}<br/>%</span>
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
              
               {!showCheckpoints && (
                 <div className="absolute right-full mr-2 top-0 px-2 py-1 bg-bg-surface text-text-primary text-[10px] whitespace-nowrap rounded border border-border-main opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">
                   Checkpoints (Click to open)
                 </div>
               )}
              
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
          </motion.div>
       </div>`;

if (content.match(regexToolbar)) {
  content = content.replace(regexToolbar, replaceToolbar);
  console.log('Replaced toolbar');
} else {
  console.log('Toolbar regex did not match!');
}


const regexLegend = /<Panel position="bottom-left" className="legend-panel">.*?<\/Panel>/s;
const replaceLegend = `<motion.div drag dragMomentum={false} dragConstraints={containerRef} className="absolute bottom-4 left-4 z-50 pointer-events-auto">
              <div className="bg-bg-panel border border-border-main rounded-lg p-3 shadow-lg flex flex-col gap-2 max-w-[180px]">
                <div className="w-full h-3 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 -mt-1 mb-1">
                   <div className="w-6 h-1 bg-text-muted rounded-full"></div>
                </div>
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border-main pb-1 mb-1">Legend</h3>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-text-primary shrink-0"></div>
                  <span className="text-text-secondary">Start Point</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-4 rounded bg-bg-element border-2 border-[#22c55e] shrink-0"></div>
                  <span className="text-text-secondary">Initial State</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-4 rounded bg-bg-element border-2 border-border-main shrink-0"></div>
                  <span className="text-text-secondary">Normal State</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-full bg-bg-element border-[3px] border-double border-[#3b82f6] shrink-0"></div>
                  <span className="text-text-secondary">Accept State</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-4 rounded bg-[#450a0a] border-2 border-[#ef4444] shrink-0"></div>
                  <span className="text-text-secondary">Stuck (Error)</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs mt-1 border-t border-border-main pt-2">
                  <div className="font-mono text-[9px] bg-bg-surface px-1 py-0.5 rounded text-text-muted border border-border-main shrink-0">
                    0→1,R
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="text-text-secondary text-[10px]">Transition Rule</span>
                    <span className="text-text-muted text-[8px]">Read 0, Write 1, Move R</span>
                  </div>
                </div>

                {activeScenario?.stateColors && Object.keys(activeScenario.stateColors).length > 0 && (
                  <div className="flex flex-col gap-1 mt-1 border-t border-border-main pt-2 max-h-36 overflow-y-auto no-scrollbar">
                    <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">State Colors:</span>
                    {Object.entries(activeScenario.stateColors)
                      .filter(([_, color]) => color && color !== 'var(--color-diagram-node)')
                      .map(([stateName, color]) => (
                        <div key={stateName} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/40" style={{ backgroundColor: color }}></div>
                          <span className="text-text-secondary truncate text-[10px]" title={stateName}>{stateName}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>`;

if (content.match(regexLegend)) {
  content = content.replace(regexLegend, replaceLegend);
  console.log('Replaced Legend');
} else {
  console.log('Legend regex did not match!');
}


fs.writeFileSync('src/components/turing/StateDiagram.tsx', content);
