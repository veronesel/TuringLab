import { useEffect, useState } from 'react';
import { useTMStore } from './store/tmStore';
import { presetScenarios } from './data/scenarios';
import { Tape } from './components/turing/Tape';
import { StateDiagram } from './components/turing/StateDiagram';
import { Controls } from './components/turing/Controls';
import { Statistics, Debugger } from './components/turing/Statistics';
import { ScenarioLibrary } from './components/turing/ScenarioLibrary';
import { RuleEditor } from './components/turing/RuleEditor';
import { Settings2, HelpCircle, BrainCircuit, Loader2, X, Moon, Sun } from 'lucide-react';
import { TourOverlay } from './components/turing/TourOverlay';
import { HelpSidebar } from './components/turing/HelpSidebar';
import { useThemeStore, DARK_SCHEMAS, LIGHT_SCHEMAS } from './store/themeStore';

export default function App() {
  const loadScenario = useTMStore(state => state.loadScenario);
  const activeScenario = useTMStore(state => state.activeScenario);
  
  const [isTourActive, setIsTourActive] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const { themeMode, colorSchema, toggleThemeMode, setColorSchema } = useThemeStore();

  useEffect(() => {
    // Sync document theme
    document.documentElement.setAttribute('data-theme', themeMode);
    document.documentElement.className = `theme-${themeMode}-${colorSchema}`;
  }, [themeMode, colorSchema]);

  const toggleThemeModeHandler = () => {
    toggleThemeMode();
  };

  const schemas = themeMode === 'dark' ? DARK_SCHEMAS : LIGHT_SCHEMAS;

  useEffect(() => {
    if (!activeScenario) {
      loadScenario(presetScenarios[0]);
    }
  }, [activeScenario, loadScenario]);

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
          <div className="h-4 w-px bg-border-main"></div>
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
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <div data-tour="library" className="h-full z-10"><ScenarioLibrary /></div>
        
        <main className="flex-1 flex flex-col bg-bg-base">
          <div className="h-[220px] border-b border-border-main relative overflow-hidden flex flex-col shrink-0">
            <div data-tour="tape" className="flex-1 flex flex-col"><Tape /></div>
            <div data-tour="controls"><Controls /></div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            <div data-tour="diagram" className="flex-1 relative overflow-hidden flex flex-col">
               <StateDiagram />
            </div>
            
            <aside data-tour="rules" className="w-[320px] border-l border-border-main bg-bg-surface flex flex-col z-10">
              <RuleEditor />
              <Statistics />
            </aside>
          </div>
        </main>
      </div>

      <footer data-tour="stats" className="h-[140px] border-t border-border-main bg-bg-surface flex shrink-0 z-10 w-full">
         <Debugger />
      </footer>
      
      <HelpSidebar />
    </div>
  );
}
