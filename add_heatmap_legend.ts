import fs from 'fs';

let content = fs.readFileSync('src/components/turing/StateDiagram.tsx', 'utf8');

const newLegend = `          {heatmapMode && (
            <motion.div drag dragMomentum={false} dragConstraints={containerRef} className="absolute bottom-4 left-[220px] z-50 pointer-events-auto">
              <div className="bg-bg-panel border border-border-main rounded-lg p-3 shadow-lg flex flex-col gap-2 min-w-[200px]">
                <div className="w-full h-3 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 -mt-1 mb-1">
                   <div className="w-6 h-1 bg-text-muted rounded-full"></div>
                </div>
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border-main pb-1 mb-1">Heatmap Scale</h3>
                
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex justify-between text-[9px] text-text-secondary leading-none mb-1">
                    <span>High (Red)</span>
                    <span>Low (Blue)</span>
                  </div>
                  <div className="h-2 w-full rounded outline outline-1 outline-border-main" style={{ 
                    background: 'linear-gradient(to right, hsl(0, 80%, 40%), hsl(60, 80%, 40%), hsl(120, 80%, 40%), hsl(180, 80%, 40%), hsl(240, 80%, 40%))' 
                  }}></div>
                </div>
                
                <div className="flex items-center justify-between text-xs mt-3">
                  <span className="text-text-secondary text-[10px]">Unvisited</span>
                  <div className="w-6 h-4 rounded bg-[#1e1e24] border border-[rgba(255,255,255,0.1)] shrink-0"></div>
                </div>
              </div>
            </motion.div>
          )}`

// place it right after the Legend div closes:
content = content.replace(
  `                  </div>
                )}
              </div>
            </motion.div>
          )}`,
  `                  </div>
                )}
              </div>
            </motion.div>
          )}
${newLegend}`
);

fs.writeFileSync('src/components/turing/StateDiagram.tsx', content);
