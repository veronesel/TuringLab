import { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTMStore } from './store/tmStore';
import { useScenariosStore } from './store/scenariosStore';
import { presetScenarios } from './data/scenarios';
import { Tape } from './components/turing/Tape';
import { StateDiagram } from './components/turing/StateDiagram';
import { Controls } from './components/turing/Controls';
import { Statistics, Debugger } from './components/turing/Statistics';
import { ScenarioLibrary } from './components/turing/ScenarioLibrary';
import { RuleEditor } from './components/turing/RuleEditor';
import { AdvancedRuleStudio } from './components/turing/AdvancedRuleStudio';
import { PerformanceOverlay } from './components/turing/PerformanceOverlay';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';

import { ShortcutsModal } from './components/turing/ShortcutsModal';
import { SymbolAliasesPanel } from './components/turing/SymbolAliasesPanel';
import { Settings2, HelpCircle, BrainCircuit, Loader2, X, Moon, Sun, LayoutDashboard, Keyboard, GripHorizontal, GripVertical, RotateCcw, Download, Upload, Tags, FileText, CheckCircle2, Maximize, Minimize, Link, Table, Undo2, Redo2 } from 'lucide-react';
import { TourOverlay } from './components/turing/TourOverlay';
import { HelpSidebar } from './components/turing/HelpSidebar';
import { Breadcrumb } from './components/ui/Breadcrumb';
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
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  
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
  const importConfiguration = useTMStore(state => state.importConfiguration);
  const undoEdit = useTMStore(state => state.undoEdit);
  const redoEdit = useTMStore(state => state.redoEdit);
  const editHistoryIndex = useTMStore(state => state.editHistoryIndex);
  const editHistory = useTMStore(state => state.editHistory);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAliasPanelOpen, setIsAliasPanelOpen] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  const handleExportCSV = () => {
    const history = useTMStore.getState().history;
    const header = "Step,State,Read,Write,Direction,HeadPosition\n";
    const rows = history.map((entry, index) => {
      const prevEntry = index > 0 ? history[index - 1] : null;
      let readSymbol = '_';
      let writeSymbol = '_';
      let moveDirection = 'S';
      if (prevEntry) {
         readSymbol = prevEntry.tape[prevEntry.headPosition] || '_';
         writeSymbol = entry.tape[prevEntry.headPosition] || '_';
         if (entry.headPosition > prevEntry.headPosition) moveDirection = 'R';
         else if (entry.headPosition < prevEntry.headPosition) moveDirection = 'L';
      }
      return `${index},${entry.currentState},${readSymbol},${writeSymbol},${moveDirection},${entry.headPosition}`;
    }).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turing-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyURL = () => {
    try {
      const state = useTMStore.getState();
      const exportData = {
        id: state.activeScenario?.id,
        name: state.activeScenario?.name,
        rules: state.rules,
        symbols: state.symbolAliases,
        tape: state.tape,
        head: state.headPosition,
      };
      // For URL we should ideally compress it, but simple base64 works for small configs
      const encoded = btoa(JSON.stringify(exportData));
      const url = new URL(window.location.href);
      url.searchParams.set('config', encoded);
      navigator.clipboard.writeText(url.toString());
      alert('Configuration URL copied to clipboard!');
    } catch (e) {
      console.error(e);
      alert('Failed to copy configuration URL.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const state = useTMStore.getState();
      const pdf = new jsPDF('portrait', 'pt', 'a4');
      const marginX = 40;
      let y = 40;
      
      pdf.setFontSize(18);
      pdf.text(`Turing Machine Report: ${state.activeScenario?.name || 'Untitled'}`, marginX, y);
      y += 20;

      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Category: ${state.activeScenario?.category || 'Custom Workspace'}`, marginX, y);
      y += 20;

      pdf.text(`Generated on: ${new Date().toLocaleString()}`, marginX, y);
      y += 30;

      // Final Status
      pdf.setTextColor(0);
      pdf.setFontSize(14);
      pdf.text('Execution Summary', marginX, y);
      y += 20;

      pdf.setFontSize(10);
      pdf.text(`Status: ${state.status}`, marginX, y);
      y += 15;
      pdf.text(`Total Steps: ${state.stepCount}`, marginX, y);
      y += 15;
      pdf.text(`Final State: ${state.currentState}`, marginX, y);
      y += 30;

      // Final Tape Content
      pdf.setFontSize(14);
      pdf.text('Final Tape Content', marginX, y);
      y += 20;

      const tapeKeys = Object.keys(state.tape).map(Number).sort((a, b) => a - b);
      let tapeContent = '... ';
      if (tapeKeys.length > 0) {
         for (let i = tapeKeys[0]; i <= tapeKeys[tapeKeys.length-1]; i++) {
           tapeContent += (state.tape[i] || '_') + ' ';
         }
      }
      tapeContent += '...';
      
      pdf.setFontSize(10);
      pdf.setFont('courier');
      // Wrap text
      const splitTape = pdf.splitTextToSize(tapeContent, 500);
      pdf.text(splitTape, marginX, y);
      
      y += (splitTape.length * 15) + 20;

      // Execution History
      pdf.setFontSize(14);
      pdf.setFont('helvetica');
      pdf.text('Execution History Summary (Last 50 Steps)', marginX, y);
      y += 20;

      pdf.setFontSize(9);
      pdf.setFont('courier');
      
      const endHistory = state.historyIndex >= 0 ? state.historyIndex + 1 : state.history.length;
      const historyToExport = state.history.slice(0, endHistory).slice(-50);
      
      if (historyToExport.length === 0) {
        pdf.text("No history available.", marginX, y);
      } else {
        const header = "Step | State          | Head | Sym";
        pdf.text(header, marginX, y);
        y += 15;
        
        for (const entry of historyToExport) {
          if (y > 780) { // New page
             pdf.addPage();
             y = 40;
             pdf.text(header, marginX, y);
             y += 15;
          }
          const step = String(entry.stepCount).padStart(4, ' ');
          const st = String(entry.currentState).padEnd(14, ' ').substring(0, 14);
          const hd = String(entry.headPosition).padStart(4, ' ');
          const sym = String(entry.tape[entry.headPosition] || '_').padStart(3, ' ');
          pdf.text(`${step} | ${st} | ${hd} | ${sym}`, marginX, y);
          y += 12;
        }
      }

      pdf.save(`TuringLab-Report-${Date.now()}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
      alert("Failed to export PDF: " + (e as Error).message);
    }
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      const state = useTMStore.getState();
      const exportData = {
        id: state.activeScenario?.id,
        name: state.activeScenario?.name,
        description: state.activeScenario?.description,
        rules: state.rules,
        tape: state.tape,
        headPosition: state.headPosition,
        currentState: state.currentState,
        acceptStates: state.activeScenario?.acceptStates,
        symbolAliases: state.symbolAliases,
        bookmarks: state.bookmarks,
        diagramCheckpoints: state.diagramCheckpoints
      };
      localStorage.setItem('tm-autosave', JSON.stringify({ timestamp: Date.now(), data: exportData }));
      setLastAutoSave(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExportConfig = () => {
     const state = useTMStore.getState();
     const exportData = {
        id: state.activeScenario?.id,
        name: state.activeScenario?.name,
        description: state.activeScenario?.description,
        rules: state.rules,
        tape: state.tape,
        headPosition: state.headPosition,
        currentState: state.currentState,
        acceptStates: state.activeScenario?.acceptStates,
        symbolAliases: state.symbolAliases,
        bookmarks: state.bookmarks,
        diagramCheckpoints: state.diagramCheckpoints
     };
     const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `tm-config-${Date.now()}.json`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (event) => {
        try {
           const config = JSON.parse(event.target?.result as string);
           importConfiguration(config);
        } catch (err) {
           console.error("Failed to parse configuration file", err);
           alert("Invalid configuration file.");
        }
     };
     reader.readAsText(file);
     e.target.value = '';
  };

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
      const params = new URLSearchParams(window.location.search);
      const configData = params.get('config');
      if (configData) {
        try {
          const decoded = JSON.parse(atob(configData));
          if (decoded.rules && decoded.tape) {
            useTMStore.getState().importConfiguration({
              id: decoded.id || 'shared-config',
              name: decoded.name || 'Shared Configuration',
              description: 'Configuration loaded from URL',
              rules: decoded.rules,
              tape: decoded.tape,
              headPosition: decoded.head || 0,
              currentState: decoded.rules[0]?.currentState || 'q0',
              acceptStates: [],
              symbolAliases: decoded.symbols || {}
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        } catch (e) {
          console.error("Failed to load config from URL", e);
        }
      }

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
    <div ref={containerRef} className="h-screen min-h-[820px] w-full bg-bg-base text-text-primary flex flex-col font-sans select-none overflow-y-auto relative">
      
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
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <h1 className="font-mono font-bold text-primary-base tracking-tighter text-lg sm:text-xl hidden sm:block shrink-0">
            TURING<span className="text-text-primary">LAB</span> <span className="text-[10px] bg-primary-base/20 px-1 rounded border border-primary-base/30 ml-1">v4.0</span>
          </h1>
          <div className="h-4 w-px bg-border-main hidden sm:block"></div>
          
          <Breadcrumb 
            activeScenario={activeScenario} 
            onNavigateToCategory={() => {
              setIsSidebarCollapsed(false);
              const panel = sidebarPanelRef.current;
              if (panel && panel.isCollapsed()) panel.expand();
            }}
            onNavigateToMachine={() => setIsStudioOpen(true)}
          />
        </div>
        <div className="flex items-center gap-1 sm:gap-3 shrink min-w-0 overflow-x-auto no-scrollbar ml-2">
          <div className="flex bg-bg-surface border border-border-main rounded p-0.5 ml-2">
            <input type="file" ref={fileInputRef} onChange={handleImportConfig} accept=".json" className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center px-2 py-1 hover:bg-bg-element rounded text-text-secondary transition-colors"
              title="Import Configuration"
            >
              <Upload size={14} />
            </button>
            <button 
              onClick={handleExportConfig}
              className="flex items-center justify-center px-2 py-1 hover:bg-bg-element rounded text-text-secondary transition-colors"
              title="Export Configuration"
            >
              <Download size={14} />
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center justify-center px-2 py-1 hover:bg-bg-element rounded text-text-secondary transition-colors"
              title="Export Detailed Report"
            >
              <FileText size={14} />
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center justify-center px-2 py-1 hover:bg-bg-element rounded text-text-secondary transition-colors"
              title="Export History CSV"
            >
              <Table size={14} />
            </button>
            <button 
              onClick={handleCopyURL}
              className="flex items-center justify-center px-2 py-1 hover:bg-bg-element rounded text-text-secondary transition-colors"
              title="Copy Configuration URL"
            >
              <Link size={14} />
            </button>
            <button 
              onClick={() => setIsAliasPanelOpen(true)}
              className="flex items-center justify-center px-2 py-1 hover:bg-bg-element rounded text-text-secondary transition-colors border-l border-border-main ml-1"
              title="Symbol Aliases"
            >
              <Tags size={14} />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="flex items-center justify-center px-2 py-1 hover:bg-amber-500/10 rounded transition-colors border-l border-border-main ml-1"
              style={{ color: '#f59e0b' }}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={14} className="text-amber-500" /> : <Maximize size={14} className="text-amber-500" />}
            </button>
          </div>

          <div className="flex bg-bg-surface border border-border-main rounded p-0.5 ml-2">
            <button
              onClick={undoEdit}
              disabled={editHistoryIndex <= 0 || isRunning}
              className="flex items-center justify-center px-2 py-1 hover:bg-bg-element disabled:opacity-50 rounded text-text-secondary transition-colors"
              title="Undo Edit"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={redoEdit}
              disabled={editHistoryIndex >= editHistory.length - 1 || isRunning}
              className="flex items-center justify-center px-2 py-1 hover:bg-bg-element disabled:opacity-50 rounded text-text-secondary transition-colors"
              title="Redo Edit"
            >
              <Redo2 size={14} />
            </button>
          </div>

          <div className="flex bg-bg-surface border border-border-main rounded p-0.5 ml-2">
            <div className="flex items-center pl-2 pr-1 text-text-muted" title={lastAutoSave ? `Last auto-saved: ${lastAutoSave.toLocaleTimeString()}` : "Auto-save active"}>
              <CheckCircle2 size={12} className={lastAutoSave ? "text-green-500" : "text-text-faint"} />
              <span className="text-[9px] font-bold ml-1 mr-2">{lastAutoSave ? "SAVED" : "UNSAVED"}</span>
            </div>
          </div>

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
                          <StateDiagram onExplainLogic={handleExplainLogic} />
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
                        <PanelGroup orientation="vertical">
                          <Panel defaultSize={60} minSize={20} className="min-h-0 min-w-0 flex flex-col">
                            <RuleEditor onOpenStudio={() => setIsStudioOpen(true)} />
                          </Panel>
                          {renderHandle('vertical')}
                          <Panel defaultSize={40} minSize={20} className="min-h-0 min-w-0 flex flex-col">
                            <Statistics />
                          </Panel>
                        </PanelGroup>
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

      <AdvancedRuleStudio isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} />
      <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />
      <SymbolAliasesPanel isOpen={isAliasPanelOpen} onClose={() => setIsAliasPanelOpen(false)} />
      <HelpSidebar />
    </div>
  );
}
