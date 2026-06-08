import { useEffect, useState, useRef } from 'react';
import { useTMStore } from './store/tmStore';
import { useScenariosStore } from './store/scenariosStore';
import { presetScenarios } from './data/scenarios';
import { Tape } from './components/turing/Tape';
import { StateDiagram } from './components/turing/StateDiagram';
import { Controls } from './components/turing/Controls';
import { Statistics, Debugger } from './components/turing/Statistics';
import { ScenarioLibrary } from './components/turing/ScenarioLibrary';
import { RuleEditor } from './components/turing/RuleEditor';
import { PerformanceOverlay } from './components/turing/PerformanceOverlay';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

import { ShortcutsModal } from './components/turing/ShortcutsModal';
import { Settings2, HelpCircle, BrainCircuit, Loader2, X, Moon, Sun, LayoutDashboard, Keyboard, GripHorizontal, GripVertical, RotateCcw } from 'lucide-react';
import { TourOverlay } from './components/turing/TourOverlay';
import { HelpSidebar } from './components/turing/HelpSidebar';
import { useThemeStore, DARK_SCHEMAS, LIGHT_SCHEMAS } from './store/themeStore';

const renderHandle = (direction: 'horizontal' | 'vertical') => (
  <PanelResizeHandle
    className={`group flex items-center justify-center bg-transparent z-40 shrink-0 transition-colors cursor-${direction === 'horizontal' ? 'col' : 'row'}-resize ${direction === 'horizontal' ? 'w-2 relative' : 'h-2 relative'}`}
  >
    <div className={`
      flex items-center justify-center bg-transparent group-hover:bg-primary-base/20 group-active:bg-primary-base/30
      transition-colors rounded-[2px]
      ${direction === 'horizontal' ? 'w-2 h-12' : 'h-2 w-12'}
    `}>
       {direction === 'horizontal' ? <GripVertical size={12} className="text-border-active group-hover:text-primary-base opacity-50" /> : <GripHorizontal size={12} className="text-border-active group-hover:text-primary-base opacity-50" />}
    </div>
    <div className={`absolute bg-border-main z-[-1] pointer-events-none transition-colors group-hover:bg-primary-base/50 ${direction === 'horizontal' ? 'w-[1px] h-full' : 'h-[1px] w-full'}`} />
  </PanelResizeHandle>
);

export default function App() {
  const loadScenario = useTMStore(state => state.loadScenario);
  const activeScenario = useTMStore(state => state.activeScenario);
  
  const [isTourActive, setIsTourActive] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  
  const [activeLayoutId, setActiveLayoutId] = useState('turing-layout-custom');
  const [layoutResetKey, setLayoutResetKey] = useState(0);
  
  const sidebarPanelRef = useRef<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleToggle = () => {
      const panel = sidebarPanelRef.current;
      if (panel) {
        if (panel.isCollapsed()) {
          panel.expand();
        } else {
          panel.collapse();
        }
      }
    };
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const resetLayout = () => {

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('react-resizable-panels:turing-layout-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setLayoutResetKey(prev => prev + 1);
  };
  
  const handleLayoutPreset = (preset: 'default' | 'diagram' | 'custom') => {
    setActiveLayoutId(`turing-layout-${preset}`);
    if (preset === 'default') {
      localStorage.removeItem('react-resizable-panels:turing-layout-default');
    } else if (preset === 'diagram') {
      localStorage.removeItem('react-resizable-panels:turing-layout-diagram');
    }
  };

  const { themeMode, colorSchema, toggleThemeMode, setColorSchema } = useThemeStore();
  const { activeScenarios, addActiveScenario } = useScenariosStore();

  useEffect(() => {
    // Sync document theme
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.className = `theme-${themeMode}-${colorSchema}`;
  }, [themeMode, colorSchema]);

  const toggleThemeModeHandler = () => {
    toggleThemeMode();
  };

  const schemas = themeMode === 'dark' ? DARK_SCHEMAS : LIGHT_SCHEMAS;

  const isRunning = useTMStore(state => state.isRunning);
  const run = useTMStore(state => state.run);
  const pause = useTMStore(state => state.pause);
  const resetMachine = useTMStore(state => state.resetMachine);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) pause();
        else run();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        resetMachine();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-sidebar'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, run, pause, resetMachine]);

  useEffect(() => {
    if (!activeScenario) {
      const defaultSc = presetScenarios[0];
      addActiveScenario(defaultSc);
      loadScenario(defaultSc);
    }
  }, [activeScenario, loadScenario, addActiveScenario]);

  const handleExplainLogic = async () => {
    if (!activeScenario) return;
    setIsExplaining(true);
    setExplanation(null);
    try {
      const res = await fetch('/api/explain-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: activeScenario })
      });
      const data = await res.json();
      setExplanation(data.explanation || "No explanation provided.");
    } catch (e: any) {
      setExplanation("Failed to generate explanation. " + e.message);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="h-screen w-full bg-bg-base text-text-primary flex flex-col font-sans select-none overflow-hidden relative">
      <PerformanceOverlay />
      
      {/* Explain Logic Dialog Overlay */}
      {isExplaining || explanation ? (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-bg-panel border border-border-active w-full max-w-md rounded-xl shadow-2xl p-6 relative">
             <button disabled={isExplaining} onClick={() => { setIsExplaining(false); setExplanation(null); }} className="absolute top-4 right-4 text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors">
               <X size={20} />
             </button>
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-primary-base/20 p-2 rounded-lg text-primary-base">
                 <BrainCircuit size={24} />
               </div>
               <h2 className="text-lg font-bold text-text-primary">AI Logic Explanation</h2>
             </div>
             
             {isExplaining ? (
               <div className="flex flex-col items-center justify-center py-8 gap-4">
                 <Loader2 size={32} className="animate-spin text-primary-base" />
                 <p className="text-xs text-text-secondary font-mono">Analyzing Turing Machine rules...</p>
               </div>
             ) : (
               <div className="text-sm text-text-secondary leading-relaxed max-h-[300px] overflow-y-auto pr-2">
                 {explanation}
               </div>
             )}
          </div>
        </div>
      ) : null}

      <TourOverlay isActive={isTourActive} onClose={() => setIsTourActive(false)} />

      {/* Header */}
      <header className="h-12 border-b border-border-main bg-bg-panel flex items-center justify-between px-4 shrink-0 relative z-50">
        <div className="flex items-center gap-4">
          <h1 className="font-mono font-bold text-primary-base tracking-tighter text-xl">
            TURING<span className="text-text-primary">LAB</span> <span className="text-[10px] bg-primary-base/20 px-1 rounded border border-primary-base/30 ml-1">v4.0</span>
          </h1>
          <div className="h-4 w-px bg-border-main"></div>
          <span className="text-xs max-w-sm px-2 py-1 text-text-secondary hidden md:block truncate font-bold">
            {activeScenario?.name || 'Loading...'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExplainLogic}
            className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold bg-primary-base/20 text-primary-base border border-primary-base/30 rounded hover:bg-primary-base/40 transition-colors"
          >
            <BrainCircuit size={12} /> EXPLAIN LOGIC
          </button>
          
          <div className="flex bg-bg-surface border border-border-main rounded p-0.5 ml-2">
            <div className="flex items-center pl-2 pr-1 text-text-muted">
              <LayoutDashboard size={12} />
            </div>
            <select 
              value={activeLayoutId.replace('turing-layout-', '')} 
              onChange={e => handleLayoutPreset(e.target.value as any)}
              className="bg-transparent text-[10px] font-bold text-text-secondary outline-none px-1 py-1 uppercase appearance-none cursor-pointer"
            >
              <option value="custom" className="bg-bg-panel">Custom Layout</option>
              <option value="default" className="bg-bg-panel">Default Focus</option>
              <option value="diagram" className="bg-bg-panel">Diagram Focus</option>
            </select>
            <button 
              onClick={resetLayout}
              className="flex items-center justify-center px-1.5 ml-1 hover:bg-bg-element rounded text-text-secondary transition-colors"
              title="Reset Layout"
            >
              <RotateCcw size={12} />
            </button>
          </div>
          
          <div className="h-4 w-px bg-border-main"></div>
          
          <button 
            onClick={() => setIsShortcutsModalOpen(true)}
            className="flex items-center justify-center p-1.5 hover:bg-bg-element rounded-full text-text-secondary transition-colors"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={16} />
          </button>
          <button 
            onClick={() => setIsTourActive(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold bg-[#1d4ed8]/20 text-[#93c5fd] border border-[#3b82f6]/30 rounded hover:bg-[#1d4ed8]/40 transition-colors"
          >
            <HelpCircle size={12} /> GUIDED TOUR
          </button>
          
          <div className="h-4 w-px bg-border-main"></div>
          <div className="flex items-center gap-2">
             <button 
               onClick={toggleThemeModeHandler} 
               className="p-1.5 hover:bg-bg-element rounded-full text-text-secondary transition-colors"
               title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`}
             >
               {themeMode === 'dark' ? <Moon size={16} fill="currentColor" /> : <Sun size={16} fill="currentColor" />}
             </button>
             <div className="flex bg-bg-surface border border-border-main rounded p-0.5">
               {schemas.map(schema => (
                 <button
                   key={schema}
                   onClick={() => setColorSchema(schema)}
                   className={`px-3 py-1 text-[10px] font-bold rounded capitalize transition-all ${colorSchema === schema ? 'bg-primary-dark text-text-primary shadow-lg' : 'hover:bg-bg-element text-text-secondary'}`}
                 >
                   {schema}
                 </button>
               ))}
             </div>
          </div>
          <div className="h-4 w-px bg-border-main"></div>
          <button className="p-1.5 hover:bg-bg-element rounded-full">
            <Settings2 size={16} className="text-text-secondary"/>
          </button>
        </div>
      </header>


      {/* Main Workspace */}
      <PanelGroup 
        key={`${activeLayoutId}-v-${layoutResetKey}`}
        id={`${activeLayoutId}-v`}
        orientation="vertical" 
        className="flex-1 overflow-hidden min-h-0 min-w-0"
        onLayoutChanged={(layout) => {
          if (activeLayoutId === 'turing-layout-custom') {
            localStorage.setItem('react-resizable-panels:turing-layout-custom-v', JSON.stringify(layout));
          }
        }}
        defaultLayout={
          activeLayoutId === 'turing-layout-custom' && localStorage.getItem('react-resizable-panels:turing-layout-custom-v') 
            ? JSON.parse(localStorage.getItem('react-resizable-panels:turing-layout-custom-v')!) 
            : undefined
        }
      >
        <Panel defaultSize={80} minSize={50} className="min-h-0 min-w-0 flex flex-col">
          <PanelGroup 
            key={`${activeLayoutId}-h-${layoutResetKey}`}
            id={`${activeLayoutId}-h`}
            orientation="horizontal" 
            className="w-full h-full min-h-0 min-w-0"
            onLayoutChanged={(layout) => {
              if (activeLayoutId === 'turing-layout-custom') {
                localStorage.setItem('react-resizable-panels:turing-layout-custom-h', JSON.stringify(layout));
              }
            }}
            defaultLayout={
              activeLayoutId === 'turing-layout-custom' && localStorage.getItem('react-resizable-panels:turing-layout-custom-h') 
                ? JSON.parse(localStorage.getItem('react-resizable-panels:turing-layout-custom-h')!) 
                : undefined
            }
          >
            
            {/* Left Sidebar */}
            <Panel 
              panelRef={sidebarPanelRef}
              defaultSize={20} 
              minSize={15} 
              collapsible={true}
              collapsedSize={4}
              onResize={() => {
                const isCollapsed = sidebarPanelRef.current?.isCollapsed();
                setIsSidebarCollapsed(isCollapsed || false);
              }}
              className="min-h-0 min-w-0 flex flex-col"
            >
              <div data-tour="library" className="w-full h-full z-10 block border-r border-border-main min-h-0 min-w-0">
                <ScenarioLibrary 
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={() => {
                    const panel = sidebarPanelRef.current;
                    if (panel) {
                      if (panel.isCollapsed()) panel.expand();
                      else panel.collapse();
                    }
                  }}
                />
              </div>
            </Panel>

            {renderHandle('horizontal')}

            {/* Center & Right */}
            <Panel defaultSize={80} minSize={20} className="min-h-0 min-w-0 flex flex-col">
              <PanelGroup 
                key={`${activeLayoutId}-center-h-${layoutResetKey}`}
                id={`${activeLayoutId}-center-h`}
                orientation="horizontal"
                className="w-full h-full min-h-0 min-w-0"
                onLayoutChanged={(layout) => {
                  if (activeLayoutId === 'turing-layout-custom') {
                    localStorage.setItem('react-resizable-panels:turing-layout-custom-center-h', JSON.stringify(layout));
                  }
                }}
                defaultLayout={
                  activeLayoutId === 'turing-layout-custom' && localStorage.getItem('react-resizable-panels:turing-layout-custom-center-h') 
                    ? JSON.parse(localStorage.getItem('react-resizable-panels:turing-layout-custom-center-h')!) 
                    : undefined
                }
              >
                <Panel defaultSize={70} minSize={10} className="min-h-0 min-w-0 flex flex-col">
                  <PanelGroup 
                    key={`${activeLayoutId}-center-v-${layoutResetKey}`}
                    id={`${activeLayoutId}-center-v`}
                    orientation="vertical"
                    className="w-full h-full min-h-0 min-w-0 bg-bg-base"
                    onLayoutChanged={(layout) => {
                      if (activeLayoutId === 'turing-layout-custom') {
                        localStorage.setItem('react-resizable-panels:turing-layout-custom-center-v', JSON.stringify(layout));
                      }
                    }}
                    defaultLayout={
                      activeLayoutId === 'turing-layout-custom' && localStorage.getItem('react-resizable-panels:turing-layout-custom-center-v') 
                        ? JSON.parse(localStorage.getItem('react-resizable-panels:turing-layout-custom-center-v')!) 
                        : undefined
                    }
                  >
                    <Panel defaultSize={35} minSize={15} className="min-h-0 min-w-0 flex flex-col">
                      <div className="border-b border-border-main w-full h-full relative overflow-hidden flex flex-col min-h-0 min-w-0">
                        <div data-tour="tape" className="flex-1 flex flex-col min-h-0 min-w-0"><Tape /></div>
                        <div data-tour="controls" className="shrink-0 min-w-0"><Controls /></div>
                      </div>
                    </Panel>
                    
                    {renderHandle('vertical')}
                    
                    <Panel defaultSize={65} minSize={20} className="min-h-0 min-w-0 flex flex-col">
                      <div className="w-full h-full relative flex flex-col min-h-0 min-w-0">
                        <div data-tour="diagram" className="flex-1 w-full relative overflow-hidden flex flex-col bg-bg-base min-h-0 min-w-0">
                          <StateDiagram />
                        </div>
                      </div>
                    </Panel>
                  </PanelGroup>
                </Panel>
                
                {activeLayoutId !== 'turing-layout-diagram' && (
                  <>
                    {renderHandle('horizontal')}
                    <Panel defaultSize={30} minSize={10} className="min-h-0 min-w-0 flex flex-col">
                      <aside data-tour="rules" className="w-full h-full bg-bg-surface flex flex-col z-10 border-l border-border-main min-h-0 min-w-0">
                        <RuleEditor />
                        <Statistics />
                      </aside>
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </Panel>

        {renderHandle('vertical')}

        <Panel defaultSize={20} minSize={10} className="min-h-0 min-w-0 flex flex-col">
          <footer data-tour="stats" className="w-full h-full border-t border-border-main bg-bg-surface flex shrink-0 z-10">
            <Debugger />
          </footer>
        </Panel>
      </PanelGroup>

      <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />
      <HelpSidebar />
    </div>
  );
}
