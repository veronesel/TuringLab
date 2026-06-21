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
import { SettingsModal } from './components/turing/SettingsModal';
import { SymbolAliasesPanel } from './components/turing/SymbolAliasesPanel';
import { FloatingWindow } from './components/turing/FloatingWindow';
import { RejectionExplanationModal } from './components/turing/RejectionExplanationModal';
import { Settings2, HelpCircle, BrainCircuit, Loader2, X, Moon, Sun, LayoutDashboard, Keyboard, GripHorizontal, GripVertical, RotateCcw, Download, Upload, Tags, FileText, CheckCircle2, Maximize, Minimize, Link, Table, Undo2, Redo2, CopyPlus, Volume2, VolumeX, BookOpen, ChevronRight } from 'lucide-react';
import { TourOverlay } from './components/turing/TourOverlay';
import { HelpSidebar } from './components/turing/HelpSidebar';
import { Breadcrumb } from './components/ui/Breadcrumb';
import { InstantTooltip } from './components/ui/InstantTooltip';
import { useThemeStore, DARK_SCHEMAS, LIGHT_SCHEMAS } from './store/themeStore';
import { motion, AnimatePresence } from 'motion/react';

const renderHandle = (
  direction: 'horizontal' | 'vertical', 
  options?: {
    onDoubleClick?: () => void;
    collapsedIcon?: React.ReactNode;
    isCollapsed?: boolean;
    onExpandClick?: () => void;
  }
) => (
  <PanelResizeHandle
    className={`group flex items-center justify-center bg-transparent z-40 shrink-0 transition-colors cursor-${direction === 'horizontal' ? 'col' : 'row'}-resize ${direction === 'horizontal' ? 'w-2 relative' : 'h-2 relative'}`}
    onDoubleClick={options?.onDoubleClick}
  >
    <div className={`
      flex items-center justify-center bg-transparent group-hover:bg-primary-base/20 group-active:bg-primary-base/30
      transition-colors rounded-[2px]
      ${direction === 'horizontal' ? 'w-2 h-12' : 'h-2 w-12'}
    `}>
       {direction === 'horizontal' ? <GripVertical size={12} className="text-border-active group-hover:text-primary-base opacity-50 pointer-events-none" /> : <GripHorizontal size={12} className="text-border-active group-hover:text-primary-base opacity-50 pointer-events-none" />}
    </div>
    <div className={`absolute bg-border-main z-[-1] pointer-events-none transition-colors group-hover:bg-primary-base/50 ${direction === 'horizontal' ? 'w-[1px] h-full' : 'h-[1px] w-full'}`} />
    
    {options?.isCollapsed && options?.collapsedIcon && (
      <button 
        onClick={(e) => { e.stopPropagation(); options?.onExpandClick?.(); }} 
        className={`absolute ${direction === 'horizontal' ? 'right-[-14px] top-1/2 -translate-y-1/2 rounded-r border-l-0' : 'bottom-[-14px] left-1/2 -translate-x-1/2 rounded-b border-t-0'} bg-bg-panel border border-border-main cursor-pointer p-0.5 hover:text-primary-base z-[100] text-text-muted transition-colors shadow-sm`}
        title="Expand"
      >
        {options.collapsedIcon}
      </button>
    )}
  </PanelResizeHandle>
);

export default function App() {
  const loadScenario = useTMStore(state => state.loadScenario);
  const activeScenario = useTMStore(state => state.activeScenario);
  
  interface Toast {
    id: string;
    message: string;
    downloadUrl: string;
    fileName: string;
    fileType: 'CSV' | 'JSON' | 'PDF';
  }

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, downloadUrl: string, fileName: string, fileType: 'CSV' | 'JSON' | 'PDF') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, downloadUrl, fileName, fileType }]);
    setTimeout(() => {
      setToasts(prev => {
        const target = prev.find(t => t.id === id);
        if (target && target.downloadUrl.startsWith('blob:')) {
          URL.revokeObjectURL(target.downloadUrl);
        }
        return prev.filter(t => t.id !== id);
      });
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => {
      const target = prev.find(t => t.id === id);
      if (target && target.downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.downloadUrl);
      }
      return prev.filter(t => t.id !== id);
    });
  };

  const [isTourActive, setIsTourActive] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'rules' | 'stats' | 'debugger'>('rules');
  
  const [autosavePrompt, setAutosavePrompt] = useState<{ timestamp: number; data: any } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tm-autosave');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.timestamp && parsed.data) {
          const hasContent = parsed.data.rules?.length > 0 || Object.keys(parsed.data.tape || {}).length > 0;
          if (hasContent) {
            setAutosavePrompt(parsed);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse tm-autosave", e);
    }
  }, []);

  const handleResumeAutosave = () => {
    if (autosavePrompt?.data) {
      useTMStore.getState().importConfiguration(autosavePrompt.data);
    }
    setAutosavePrompt(null);
  };

  const handleDismissAutosave = () => {
    setAutosavePrompt(null);
  };
  
  const PRESET_LAYOUTS = {
    custom: {
      h: [20, 80],
      centerH: [70, 30],
      centerV: [35, 65]
    },
    default: {
      h: [18, 82],
      centerH: [70, 30],
      centerV: [30, 70]
    },
    library: {
      h: [32, 68],
      centerH: [68, 32],
      centerV: [35, 65]
    },
    diagram: {
      h: [4, 96],
      centerH: [100, 0],
      centerV: [15, 85]
    },
    rules: {
      h: [15, 85],
      centerH: [55, 45],
      centerV: [28, 72]
    },
    tape: {
      h: [4, 96],
      centerH: [82, 18],
      centerV: [60, 40]
    }
  };

  const [activeLayoutId, setActiveLayoutId] = useState('turing-layout-custom');
  const [layoutResetKey, setLayoutResetKey] = useState(0);
  const [detachedPanels, setDetachedPanels] = useState<string[]>([]);
  
  const togglePanelDetach = (panelId: string) => {
    setDetachedPanels(prev => 
      prev.includes(panelId) ? prev.filter(id => id !== panelId) : [...prev, panelId]
    );
  };
  
  const sidebarPanelRef = useRef<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderTapePanel = () => (
    <div className="border-b border-border-main w-full h-full relative flex flex-col min-h-0 min-w-0 bg-bg-base">
      <div data-tour="tape" className="flex-1 flex flex-col min-h-0 min-w-0"><Tape /></div>
      <div data-tour="controls" className="shrink-0 min-w-0 h-10"><Controls /></div>
    </div>
  );

  const renderDiagramPanel = () => (
    <div className="w-full h-full relative flex flex-col min-h-0 min-w-0">
      <div data-tour="diagram" className="flex-1 w-full relative overflow-hidden flex flex-col bg-bg-base min-h-0 min-w-0">
        <StateDiagram onExplainLogic={handleExplainLogic} />
      </div>
    </div>
  );

  const renderRulesPanel = () => (
    <RuleEditor onOpenStudio={() => setIsStudioOpen(true)} />
  );

  const renderStatsPanel = () => (
    <Statistics />
  );

  const renderDebuggerPanel = () => (
    <div data-tour="stats" className="w-full h-full bg-bg-surface flex flex-col min-h-0 min-w-0">
      <Debugger />
    </div>
  );

  const DetachableWrapper = ({ id, children }: { id: string, children: React.ReactNode }) => (
    <div className="relative w-full h-full group/panel overflow-hidden flex flex-col min-h-0 min-w-0">
      <button 
        onClick={() => togglePanelDetach(id)}
        className="absolute top-1 right-1 p-1 bg-bg-surface/80 hover:bg-bg-element text-text-secondary rounded shadow-sm opacity-0 group-hover/panel:opacity-100 transition-opacity z-[60]"
        title="Detach Panel"
      >
        <CopyPlus size={14} />
      </button>
      {children}
    </div>
  );

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
  
  const handleLayoutPreset = (preset: 'custom' | 'default' | 'library' | 'diagram' | 'rules' | 'tape') => {
    setActiveLayoutId(`turing-layout-${preset}`);
    localStorage.removeItem(`react-resizable-panels:turing-layout-${preset}-h`);
    localStorage.removeItem(`react-resizable-panels:turing-layout-${preset}-center-h`);
    localStorage.removeItem(`react-resizable-panels:turing-layout-${preset}-center-v`);
    setLayoutResetKey(prev => prev + 1);

    // Dynamic enhancements based on focus mode
    if (preset === 'rules') {
      setActiveSidebarTab('rules');
      setIsSidebarCollapsed(false); // Classic rules layout keeps left sidebar visible (15%)
    } else if (preset === 'tape') {
      setActiveSidebarTab('debugger');
      setIsSidebarCollapsed(true); // Collapsed left sidebar to focus on tape performance
    } else if (preset === 'diagram') {
      setIsSidebarCollapsed(true); // Collapsed left sidebar to focus on state diagram
    } else if (preset === 'library') {
      setIsSidebarCollapsed(false); // Classic library layout keeps left sidebar expanded and wide (32%)
    } else if (preset === 'default') {
      setIsSidebarCollapsed(false); // Classic default workspace keeps left sidebar visible (18%)
      setActiveSidebarTab('rules');
    }
  };

  const { themeMode, colorSchema, toggleThemeMode, setColorSchema, soundEnabled, setSoundEnabled } = useThemeStore();
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
  const status = useTMStore(state => state.status);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAliasPanelOpen, setIsAliasPanelOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  useEffect(() => {
    if (status === 'rejected') {
      setIsRejectionModalOpen(true);
    }
  }, [status]);

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
    const fileName = `turing-history-${Date.now()}.csv`;
    a.download = fileName;
    a.click();
    addToast("Export successful", url, fileName, 'CSV');
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

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const fileName = `TuringLab-Report-${Date.now()}.pdf`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast("Export successful", url, fileName, 'PDF');
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
     const fileName = `tm-config-${Date.now()}.json`;
     a.download = fileName;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     addToast("Export successful", url, fileName, 'JSON');
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
              <option value="custom" className="bg-bg-panel">Custom Grid</option>
              <option value="default" className="bg-bg-panel">Classic Workspace</option>
              <option value="library" className="bg-bg-panel">Library Focus</option>
              <option value="diagram" className="bg-bg-panel">Diagram Focus</option>
              <option value="rules" className="bg-bg-panel">Rules Builder Focus</option>
              <option value="tape" className="bg-bg-panel">Tape Player Focus</option>
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
          
          <button 
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold border rounded transition-all duration-150 ${
              isHelpOpen 
                ? 'bg-sky-500/20 text-sky-400 border-sky-400/40 hover:bg-sky-500/30 shadow-inner' 
                : 'bg-bg-element text-text-secondary border-border-main hover:bg-bg-element/80'
            }`}
            title="Toggle system manual and capabilities explorer"
          >
            <BookOpen size={12} className={isHelpOpen ? 'animate-pulse text-sky-400' : 'text-text-secondary'} />
            <span className={isHelpOpen ? 'text-sky-400' : ''}>HELP COMPANION</span>
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
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 hover:bg-bg-element rounded-full text-text-secondary transition-colors"
            title={soundEnabled ? "Disable Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <div className="h-4 w-px bg-border-main"></div>
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 hover:bg-bg-element rounded-full text-text-secondary transition-colors"
            title="Settings"
          >
            <Settings2 size={16} />
          </button>
        </div>
      </header>


      {/* Main Workspace */}
      <PanelGroup 
        key={`${activeLayoutId}-h-${layoutResetKey}`}
        id={`${activeLayoutId}-h`}
        orientation="horizontal" 
        className="w-full flex-1 min-h-0 min-w-0"
        onLayoutChanged={(layout) => {
          if (activeLayoutId === 'turing-layout-custom') {
            localStorage.setItem('react-resizable-panels:turing-layout-custom-h', JSON.stringify(layout));
          }
        }}
        defaultLayout={
          activeLayoutId === 'turing-layout-custom'
            ? (localStorage.getItem('react-resizable-panels:turing-layout-custom-h') 
                ? JSON.parse(localStorage.getItem('react-resizable-panels:turing-layout-custom-h')!) 
                : PRESET_LAYOUTS.custom.h)
            : (PRESET_LAYOUTS[activeLayoutId.replace('turing-layout-', '') as keyof typeof PRESET_LAYOUTS] || PRESET_LAYOUTS.default).h
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

        {renderHandle('horizontal', {
          isCollapsed: isSidebarCollapsed,
          collapsedIcon: <ChevronRight size={14} />,
          onExpandClick: () => sidebarPanelRef.current?.expand(),
          onDoubleClick: () => {
            const panel = sidebarPanelRef.current;
            if (panel) {
              if (panel.isCollapsed()) panel.expand();
              else panel.collapse();
            }
          }
        })}

        {/* Center & Right Sidebar */}
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
              activeLayoutId === 'turing-layout-custom'
                ? (localStorage.getItem('react-resizable-panels:turing-layout-custom-center-h') 
                    ? JSON.parse(localStorage.getItem('react-resizable-panels:turing-layout-custom-center-h')!) 
                    : PRESET_LAYOUTS.custom.centerH)
                : (PRESET_LAYOUTS[activeLayoutId.replace('turing-layout-', '') as keyof typeof PRESET_LAYOUTS] || PRESET_LAYOUTS.default).centerH
            }
          >
            {/* Center Panel (Tape and Diagram) */}
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
                  activeLayoutId === 'turing-layout-custom'
                    ? (localStorage.getItem('react-resizable-panels:turing-layout-custom-center-v') 
                        ? JSON.parse(localStorage.getItem('react-resizable-panels:turing-layout-custom-center-v')!) 
                        : PRESET_LAYOUTS.custom.centerV)
                    : (PRESET_LAYOUTS[activeLayoutId.replace('turing-layout-', '') as keyof typeof PRESET_LAYOUTS] || PRESET_LAYOUTS.default).centerV
                }
              >
                {!detachedPanels.includes('tape') && (
                  <Panel defaultSize={35} minSize={30} className="min-h-0 min-w-0 flex flex-col">
                    <DetachableWrapper id="tape">
                      {renderTapePanel()}
                    </DetachableWrapper>
                  </Panel>
                )}
                
                {!detachedPanels.includes('tape') && !detachedPanels.includes('diagram') && renderHandle('vertical')}
                
                {!detachedPanels.includes('diagram') && (
                  <Panel defaultSize={65} minSize={20} className="min-h-0 min-w-0 flex flex-col">
                    <DetachableWrapper id="diagram">
                      {renderDiagramPanel()}
                    </DetachableWrapper>
                  </Panel>
                )}

                {detachedPanels.includes('tape') && detachedPanels.includes('diagram') && (
                  <Panel defaultSize={100} className="bg-bg-panel/50 hidden" />
                )}
              </PanelGroup>
            </Panel>
            
            {/* Multi-Tab Right Sidebar Panel */}
            {activeLayoutId !== 'turing-layout-diagram' && (
              <>
                {renderHandle('horizontal')}
                <Panel defaultSize={30} minSize={15} className="min-h-0 min-w-0 flex flex-col">
                  <aside data-tour="rules" className="w-full h-full bg-bg-surface flex flex-col z-10 border-l border-border-main min-h-0 min-w-0">
                    
                    {/* Sidebar Tab Selector Header */}
                    <div className="flex border-b border-border-main bg-bg-panel p-1 gap-1 shrink-0 select-none">
                      <button
                        onClick={() => setActiveSidebarTab('rules')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                          activeSidebarTab === 'rules'
                            ? 'bg-primary-base text-bg-base shadow-sm font-extrabold'
                            : 'text-text-secondary hover:bg-bg-element hover:text-text-primary'
                        }`}
                        title="Turing Machine Rules Configuration (Row items & conflicts)"
                      >
                        <Table size={12} />
                        <span>Rules</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveSidebarTab('stats')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                          activeSidebarTab === 'stats'
                            ? 'bg-primary-base text-bg-base shadow-sm font-extrabold'
                            : 'text-text-secondary hover:bg-bg-element hover:text-text-primary'
                        }`}
                        title="Machine execution counters and dynamic graphs"
                      >
                        <LayoutDashboard size={12} />
                        <span>Stats</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveSidebarTab('debugger')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                          activeSidebarTab === 'debugger'
                            ? 'bg-primary-base text-bg-base shadow-sm font-extrabold'
                            : 'text-text-secondary hover:bg-bg-element hover:text-text-primary'
                        }`}
                        title="Step-by-step Simulation History Log"
                      >
                        <FileText size={12} />
                        <span>Log</span>
                      </button>
                    </div>

                    {/* Tab Panels Container */}
                    <div className="flex-1 min-h-0 min-w-0 flex flex-col relative bg-bg-panel">
                      {activeSidebarTab === 'rules' && (
                        <div className="w-full h-full min-h-0 min-w-0 flex flex-col">
                          {!detachedPanels.includes('rules') ? (
                            <DetachableWrapper id="rules">
                              {renderRulesPanel()}
                            </DetachableWrapper>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-text-muted bg-bg-surface">
                              <Table size={24} className="opacity-20 mb-2 text-text-muted" />
                              <p className="text-[10px] font-mono">Rules Panel is detached</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeSidebarTab === 'stats' && (
                        <div className="w-full h-full min-h-0 min-w-0 flex flex-col">
                          {!detachedPanels.includes('stats') ? (
                            <DetachableWrapper id="stats">
                              {renderStatsPanel()}
                            </DetachableWrapper>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-text-muted bg-bg-surface">
                              <LayoutDashboard size={24} className="opacity-20 mb-2 text-text-muted" />
                              <p className="text-[10px] font-mono">Stats Panel is detached</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeSidebarTab === 'debugger' && (
                        <div className="w-full h-full min-h-0 min-w-0 flex flex-col">
                          {!detachedPanels.includes('debugger') ? (
                            <DetachableWrapper id="debugger">
                              {renderDebuggerPanel()}
                            </DetachableWrapper>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-text-muted bg-bg-surface">
                              <FileText size={24} className="opacity-20 mb-2 text-text-muted" />
                              <p className="text-[10px] font-mono">Log Panel is detached</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </aside>
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>
      </PanelGroup>

      <AdvancedRuleStudio isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} />
      <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      <SymbolAliasesPanel isOpen={isAliasPanelOpen} onClose={() => setIsAliasPanelOpen(false)} />
      <RejectionExplanationModal isOpen={isRejectionModalOpen} onClose={() => setIsRejectionModalOpen(false)} />
      <HelpSidebar isOpen={isHelpOpen} setIsOpen={setIsHelpOpen} />

      {/* Floating Windows for Detached Panels */}
      {detachedPanels.includes('tape') && (
        <FloatingWindow id="tape" title="Tape & Controls" icon={<LayoutDashboard size={12} />} onClose={() => togglePanelDetach('tape')} defaultSize={{width: 600, height: 180}} defaultPosition={{x: window.innerWidth / 2 - 300, y: 50}}>
          {renderTapePanel()}
        </FloatingWindow>
      )}
      {detachedPanels.includes('diagram') && (
        <FloatingWindow id="diagram" title="State Diagram" icon={<BrainCircuit size={12} />} onClose={() => togglePanelDetach('diagram')} defaultSize={{width: 800, height: 500}} defaultPosition={{x: window.innerWidth / 2 - 400, y: 100}}>
          {renderDiagramPanel()}
        </FloatingWindow>
      )}
      {detachedPanels.includes('rules') && (
        <FloatingWindow id="rules" title="Rule Editor" icon={<BrainCircuit size={12} />} onClose={() => togglePanelDetach('rules')} defaultSize={{width: 400, height: 500}} defaultPosition={{x: 50, y: 100}}>
          {renderRulesPanel()}
        </FloatingWindow>
      )}
      {detachedPanels.includes('stats') && (
        <FloatingWindow id="stats" title="Statistics" icon={<LayoutDashboard size={12} />} onClose={() => togglePanelDetach('stats')} defaultSize={{width: 400, height: 400}} defaultPosition={{x: 50, y: window.innerHeight - 450}}>
          {renderStatsPanel()}
        </FloatingWindow>
      )}
      {detachedPanels.includes('debugger') && (
        <FloatingWindow id="debugger" title="Debugger" icon={<BrainCircuit size={12} />} onClose={() => togglePanelDetach('debugger')} defaultSize={{width: 800, height: 200}} defaultPosition={{x: window.innerWidth / 2 - 400, y: window.innerHeight - 250}}>
          {renderDebuggerPanel()}
        </FloatingWindow>
      )}
      <InstantTooltip />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {autosavePrompt && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.92, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 40, transition: { duration: 0.15 } }}
              layout
              className="pointer-events-auto bg-bg-panel border border-border-active rounded-xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-md relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1 rounded-lg bg-primary-base/10 text-primary-base mt-0.5 shrink-0">
                    <Undo2 size={15} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-text-primary font-sans tracking-wide">
                      Unsaved Session Found
                    </h4>
                    <p className="text-[10px] text-text-muted font-sans mt-0.5 leading-normal truncate">
                      Would you like to resume your last auto-saved session?
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismissAutosave}
                  className="p-1 rounded bg-transparent hover:bg-bg-element text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Dismiss Auto-Save"
                >
                  <X size={13} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismissAutosave}
                  className="flex-1 px-3 py-1.5 rounded bg-bg-surface hover:bg-bg-element text-text-secondary border border-border-main font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer select-none"
                >
                  Discard
                </button>
                <button
                  onClick={handleResumeAutosave}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-primary-base hover:bg-primary-dark text-bg-base font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer select-none"
                >
                  <Undo2 size={12} />
                  Resume
                </button>
              </div>
            </motion.div>
          )}

          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.92, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 40, transition: { duration: 0.15 } }}
              layout
              className="pointer-events-auto bg-bg-panel border border-border-active rounded-xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-md relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1 rounded-lg bg-green-500/10 text-green-400 mt-0.5 shrink-0">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-text-primary font-sans tracking-wide">
                      {toast.message}
                    </h4>
                    <p className="text-[10px] text-text-muted font-sans mt-0.5 leading-normal truncate max-w-[210px]" title={toast.fileName}>
                      {toast.fileName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded bg-transparent hover:bg-bg-element text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
                  title="Dismiss Notification"
                >
                  <X size={13} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <a
                  href={toast.downloadUrl}
                  download={toast.fileName}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-primary-base hover:bg-primary-dark text-bg-base font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer select-none"
                >
                  <Download size={12} />
                  Save {toast.fileType} File
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
