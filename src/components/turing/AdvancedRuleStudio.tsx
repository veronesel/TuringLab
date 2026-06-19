import React, { useState, useMemo, useEffect } from 'react';
import { useTMStore } from '../../store/tmStore';
import { TMRule, Direction, TMScenario } from '../../types/tm';
import { ScenarioDiffModal } from "./ScenarioDiffModal";
import { AnimatePresence } from "motion/react";
import { useScenariosStore } from '../../store/scenariosStore';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, Trash2, Wand2, Grid, List, Sparkles, AlertTriangle, 
  CheckCircle2, Search, X, MessageSquare, Copy, Upload, 
  ArrowRight, RefreshCw, Sliders, Info, HelpCircle
} from 'lucide-react';

interface AdvancedRuleStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedRuleStudio: React.FC<AdvancedRuleStudioProps> = ({ isOpen, onClose }) => {
  const storeRules = useTMStore(state => state.rules);
  const setRules = useTMStore(state => state.setRules);
  const isRunning = useTMStore(state => state.isRunning);
  const activeScenario = useTMStore(state => state.activeScenario);
  const currentState = useTMStore(state => state.currentState);
  const headPosition = useTMStore(state => state.headPosition);
  const tape = useTMStore(state => state.tape);
  const lastRuleId = useTMStore(state => state.lastRuleId);

  // Draft state representing the user's modifications in the studio
  const [draftRules, setDraftRules] = useState<TMRule[]>([]);
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'matrix' | 'builder' | 'ai' | 'help'>('spreadsheet');
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Co-Designer State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedScenario, setGeneratedScenario] = useState<TMScenario | null>(null);

  const { addActiveScenario } = useScenariosStore();
  const loadScenario = useTMStore(state => state.loadScenario);
  
  // JSON Import/Export area state
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // State Renovator state (multi-rename)
  const [renamerFrom, setRenamerFrom] = useState('');
  const [renamerTo, setRenamerTo] = useState('');
  const [renamerSuccess, setRenamerSuccess] = useState(false);

  // Guided sentence builder states
  const [bCurrentState, setBCurrentState] = useState('q0');
  const [bReadSymbol, setBReadSymbol] = useState('0');
  const [bNextState, setBNextState] = useState('q0');
  const [bWriteSymbol, setBWriteSymbol] = useState('0');
  const [bMoveDirection, setBMoveDirection] = useState<Direction>('R');

  // Matrix cell selection
  const [hoveredRuleId, setHoveredRuleId] = useState<string | null>(null);

  // Sync draft rules with store when modal opens or when store rules update
  useEffect(() => {
    if (isOpen) {
      setDraftRules(storeRules);
    }
  }, [isOpen, storeRules]);

  // Close studio when Esc is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Clean renamer status
  useEffect(() => {
    if (renamerSuccess) {
      const timer = setTimeout(() => setRenamerSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [renamerSuccess]);

  // Extract all unique states currently in draft rules
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    if (activeScenario) {
      states.add(activeScenario.initialState);
      activeScenario.acceptStates.forEach(s => states.add(s));
    }
    draftRules.forEach(r => {
      if (r.currentState.trim()) states.add(r.currentState.trim());
      if (r.nextState.trim()) states.add(r.nextState.trim());
    });
    // Add default initial state q0 if empty
    if (states.size === 0) states.add('q0');
    return Array.from(states).sort();
  }, [draftRules, activeScenario]);

  // Extract all unique read/write symbols currently in draft rules
  const uniqueSymbols = useMemo(() => {
    const symbols = new Set<string>(['0', '1', '_']);
    draftRules.forEach(r => {
      if (r.readSymbol) symbols.add(r.readSymbol);
      if (r.writeSymbol) symbols.add(r.writeSymbol);
    });
    return Array.from(symbols).sort((a, b) => {
      if (a === '_') return -1;
      if (b === '_') return 1;
      return a.localeCompare(b);
    });
  }, [draftRules]);

  // Diagnostics and health auditing
  const diagnostics = useMemo(() => {
    const errors: Array<{ type: 'error' | 'warning' | 'info'; message: string; payload?: any }> = [];
    const keys = new Set<string>();
    const dupes = new Set<string>();

    draftRules.forEach(r => {
      const key = `${r.currentState.trim()}|${r.readSymbol.trim() || '_'}`;
      if (keys.has(key)) {
        dupes.add(key);
      }
      keys.add(key);
    });

    if (dupes.size > 0) {
      dupes.forEach(dupe => {
        const [state, symb] = dupe.split('|');
        errors.push({
          type: 'error',
          message: `Determinism flaw: state '${state}' and symbol '${symb}' has multiple active transitions.`,
          payload: { state, symbol: symb }
        });
      });
    }

    // Check for "dead ends" - transition states that never have an outgoing instruction
    const definedOutStates = new Set(draftRules.map(r => r.currentState.trim()));
    const visitedNextStates = new Set(draftRules.map(r => r.nextState.trim()));
    
    visitedNextStates.forEach(nextS => {
      const isAccept = activeScenario?.acceptStates.includes(nextS) || nextS === 'halt' || nextS.toLowerCase().includes('accept');
      if (!isAccept && !definedOutStates.has(nextS)) {
        errors.push({
          type: 'warning',
          message: `Dead end state: transitions go to '${nextS}' but no rules exist for it (may stall machine unless accepted).`,
          payload: { state: nextS }
        });
      }
    });

    // Scan for empty states or symbol cells
    draftRules.forEach((r, idx) => {
      if (!r.currentState.trim() || !r.nextState.trim()) {
        errors.push({
          type: 'warning',
          message: `Rule #${idx + 1} has an empty state cell.`,
          payload: { id: r.id }
        });
      }
    });

    return errors;
  }, [draftRules, activeScenario]);

  // Action: update a single field in a draft rule
  const updateDraftRule = (id: string, field: keyof TMRule, value: string) => {
    setDraftRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Action: remove draft rule
  const deleteDraftRule = (id: string) => {
    setDraftRules(prev => prev.filter(r => r.id !== id));
  };

  // Action: add a blank rule
  const createBlankRuleFromTemplate = (initial?: Partial<TMRule>) => {
    const newRule: TMRule = {
      id: uuidv4(),
      currentState: initial?.currentState || uniqueStates[0] || 'q0',
      readSymbol: initial?.readSymbol || '0',
      nextState: initial?.nextState || uniqueStates[0] || 'q0',
      writeSymbol: initial?.writeSymbol || '0',
      moveDirection: initial?.moveDirection || 'R'
    };
    setDraftRules(prev => [...prev, newRule]);
  };

  // Action: auto-format & sort rules alphabetically
  const formatAndOptimizeDraft = () => {
    setDraftRules(prev => {
      return [...prev].map(r => ({
        ...r,
        currentState: r.currentState.trim() || 'q0',
        readSymbol: r.readSymbol.trim() || '_',
        nextState: r.nextState.trim() || 'q0',
        writeSymbol: r.writeSymbol.trim() || '_',
      })).sort((a, b) => {
        if (a.currentState === b.currentState) {
          return a.readSymbol.localeCompare(b.readSymbol);
        }
        return a.currentState.localeCompare(b.currentState);
      });
    });
  };

  // Action: Bulk state renaming
  const executeRenameRenovator = () => {
    const fromVal = renamerFrom.trim();
    const toVal = renamerTo.trim();
    if (!fromVal || !toVal) return;

    setDraftRules(prev => prev.map(r => {
      return {
        ...r,
        currentState: r.currentState === fromVal ? toVal : r.currentState,
        nextState: r.nextState === fromVal ? toVal : r.nextState
      };
    }));

    setRenamerFrom('');
    setRenamerTo('');
    setBCurrentState(curr => curr === fromVal ? toVal : curr);
    setBNextState(curr => curr === fromVal ? toVal : curr);
    setRenamerSuccess(true);
  };

  // Action: Save rules back to simulator
  const saveAndSyncSimulatorState = () => {
    setRules(draftRules);
    onClose();
  };

  // Action: Export draft to clean JSON format
  const exportDraftRules = () => {
    const exportObject = draftRules.map(({ id, ...rest }) => rest);
    setJsonInput(JSON.stringify(exportObject, null, 2));
    setJsonError(null);
    setShowDataPanel(true);
  };

  // Action: Import JSON formatted rules
  const importJsonRules = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error("Specified text is not an array of rules.");
      }
      
      const validated: TMRule[] = parsed.map((item: any, idx) => {
        if (typeof item.currentState !== 'string' || typeof item.nextState !== 'string') {
          throw new Error(`Rule #${idx + 1} is missing a currentState or nextState property.`);
        }
        return {
          id: uuidv4(),
          currentState: String(item.currentState || 'q0'),
          readSymbol: String(item.readSymbol !== undefined ? item.readSymbol : '_').trim() || '_',
          nextState: String(item.nextState || 'q0'),
          writeSymbol: String(item.writeSymbol !== undefined ? item.writeSymbol : '_').trim() || '_',
          moveDirection: (item.moveDirection === 'L' || item.moveDirection === 'R' || item.moveDirection === 'S') ? item.moveDirection : 'R'
        };
      });

      setDraftRules(validated);
      setShowDataPanel(false);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || "Failed parsing rules schema.");
    }
  };

  // Action: sentence builder submit
  const submitCustomSentenceRule = () => {
    const newRule: TMRule = {
      id: uuidv4(),
      currentState: bCurrentState.trim() || 'q0',
      readSymbol: bReadSymbol.trim() || '_',
      nextState: bNextState.trim() || 'q0',
      writeSymbol: bWriteSymbol.trim() || '_',
      moveDirection: bMoveDirection
    };

    // Check if duplicate rule already exists in draft, replace if found, otherwise append
    const existingIdx = draftRules.findIndex(
      r => r.currentState.trim() === bCurrentState.trim() && r.readSymbol.trim() === bReadSymbol.trim()
    );

    if (existingIdx !== -1) {
      setDraftRules(prev => prev.map((r, i) => i === existingIdx ? newRule : r));
    } else {
      setDraftRules(prev => [...prev, newRule]);
    }
  };

  // Action: AI Generation
  const [aiContextActive, setAiContextActive] = useState(false);
  const [previewState, setPreviewState] = useState<{
    isOpen: boolean;
    base: TMScenario | null;
    proposed: TMScenario | null;
  }>({ isOpen: false, base: null, proposed: null });

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiIsGenerating(true);
    setAiError(null);
    try {
      let baseScenarioContext;
      if (aiContextActive) {
        const state = useTMStore.getState();
        const activeScenario = state.activeScenario;
        
        let initialTapeStr = activeScenario ? activeScenario.initialTape : "_";
        const indices = Object.keys(state.tape).map(Number).sort((a,b)=>a-b);
        if (indices.length > 0) {
           const min = Math.min(...indices);
           const max = Math.max(...indices);
           let t = "";
           for(let i=min; i<=max; i++) t += state.tape[i] || '_';
           initialTapeStr = t;
        }

        baseScenarioContext = {
          ...(activeScenario || {}),
          rules: draftRules, // Give it our current draft rules
          initialTape: initialTapeStr,
          customPositions: activeScenario?.customPositions,
        };
      }

      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          description: aiPrompt,
          baseScenario: baseScenarioContext
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      const newScenario = data.configuration as TMScenario;
      setGeneratedScenario(newScenario);
    } catch (e: any) {
      setAiError(e.message || "Failed to generate.");
    } finally {
      setAiIsGenerating(false);
    }
  };

  const mergeAiRulesToDraft = () => {
    if (!generatedScenario) return;
    const aiRules = generatedScenario.rules;
    setDraftRules(curr => {
      const ruleMap = new Map<string, TMRule>();
      aiRules.forEach(r => {
        ruleMap.set(`${r.currentState.trim()}|${r.readSymbol.trim() || '_'}`, r);
      });
      const filteredCurrent = curr.filter(r => {
        const key = `${r.currentState.trim()}|${r.readSymbol.trim() || '_'}`;
        return !ruleMap.has(key);
      });
      return [...filteredCurrent, ...aiRules];
    });
  };

  const overwriteDraftWithAiRules = () => {
    if (!generatedScenario) return;
    setDraftRules(generatedScenario.rules);
  };

  const applyFullAiScenario = () => {
    if (!generatedScenario) return;
    
    // We already have some base scenario context if we wanted to build it,
    // let's just assemble what we have right now visually.
    const state = useTMStore.getState();
    const activeScenario = state.activeScenario;
    let initialTapeStr = activeScenario ? activeScenario.initialTape : "_";
    const indices = Object.keys(state.tape).map(Number).sort((a,b)=>a-b);
    if (indices.length > 0) {
       const min = Math.min(...indices);
       const max = Math.max(...indices);
       let t = "";
       for(let i=min; i<=max; i++) t += state.tape[i] || '_';
       initialTapeStr = t;
    }
    
    // The base scenario for the diff
    const baseScenarioContext = {
      ...(activeScenario || {}),
      id: activeScenario?.id || "current",
      name: activeScenario?.name || "Current State",
      description: activeScenario?.description || "",
      category: activeScenario?.category || "",
      rules: draftRules, // draft rules are what the user currently has edited
      initialTape: initialTapeStr,
      customPositions: activeScenario?.customPositions,
    } as TMScenario;

    setPreviewState({
      isOpen: true,
      base: baseScenarioContext,
      proposed: generatedScenario
    });
  };

  const handleApplyPreview = () => {
    if (!previewState.proposed) return;
    
    const formattedScenario: TMScenario = {
      ...previewState.proposed,
      id: `ai-gen-${Date.now()}`,
      category: "AI Generated"
    };

    addActiveScenario(formattedScenario);
    loadScenario(formattedScenario);
    setPreviewState({ isOpen: false, base: null, proposed: null });
    onClose();
  };

  const handleCancelPreview = () => {
    setPreviewState({ isOpen: false, base: null, proposed: null });
  };

  // Filter the spreadsheet views dynamically
  const filteredDraftRules = useMemo(() => {
    if (!searchQuery.trim()) return draftRules;
    const q = searchQuery.toLowerCase();
    return draftRules.filter(r => 
      r.currentState.toLowerCase().includes(q) || 
      r.nextState.toLowerCase().includes(q) || 
      r.readSymbol.toLowerCase().includes(q) ||
      r.writeSymbol.toLowerCase().includes(q)
    );
  }, [draftRules, searchQuery]);

  // Translate rule into human-friendly English description
  const translateToNaturalLanguage = (rule: TMRule) => {
    const writeS = rule.writeSymbol === '_' ? '(blank)' : `"${rule.writeSymbol}"`;
    const readS = rule.readSymbol === '_' ? '(blank)' : `"${rule.readSymbol}"`;
    const moveStr = rule.moveDirection === 'R' ? 'Right (→)' : rule.moveDirection === 'L' ? 'Left (←)' : 'Stay (•)';
    return (
      <div className="text-[11px] leading-relaxed text-text-secondary">
        IF scanning state is <strong className="text-secondary-base">{rule.currentState}</strong> and reading symbol {readS}, 
        THEN update tape with {writeS}, head shifts {moveStr}, and shifts current state to <strong className="text-primary-base">{rule.nextState}</strong>.
      </div>
    );
  };

  // Is draft modified from current simulator rules?
  const hasPendingChanges = JSON.stringify(storeRules) !== JSON.stringify(draftRules);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 animate-fade-in bg-black/85 backdrop-blur-[5px]">
      <div 
        id="advanced-rule-studio-card"
        className="relative w-full h-[88vh] max-w-6xl bg-bg-panel border border-border-main rounded-xl flex flex-col overflow-hidden text-sm shadow-[0_0_50px_rgba(0,0,0,0.8)]"
      >
        {/* TOP COMPONENT HEADER */}
        <header className="p-3 bg-bg-surface border-b border-border-main flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary-base/10 text-primary-base">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-sans text-text-primary flex items-center gap-2">
                Advanced Instruction Studio
                {hasPendingChanges && (
                  <span className="text-[9px] font-mono tracking-wider uppercase font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-full">
                    Draft Unsaved
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-text-faint font-sans">
                Full-featured workspace to model state machines, inspect flow graphs, and validate integrity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportDraftRules}
              className="px-2.5 py-1 text-[10px] bg-bg-element hover:bg-border-active border border-border-main text-text-secondary hover:text-text-primary rounded transition-colors flex items-center gap-1.5"
              title="Import or Export rules JSON array"
            >
              <Upload size={11} /> Import/Export
            </button>
            <button
              onClick={formatAndOptimizeDraft}
              className="px-2.5 py-1 text-[10px] bg-bg-element hover:bg-border-active border border-border-main text-primary-base rounded transition-colors flex items-center gap-1.5"
              title="Auto format and sort transition lines"
            >
              <Wand2 size={11} /> Auto Sort
            </button>
            <button
              onClick={() => createBlankRuleFromTemplate()}
              className="px-2.5 py-1 text-[10px] bg-green-950/20 hover:bg-green-900/30 text-green-400 border border-green-500/30 rounded transition-colors flex items-center gap-1"
            >
              <Plus size={12} /> Add Rule
            </button>
            <button
              onClick={saveAndSyncSimulatorState}
              disabled={!hasPendingChanges}
              className={`px-3 py-1 text-[10px] rounded border transition-all ${
                hasPendingChanges 
                  ? 'bg-primary-base hover:bg-primary-base/80 border-transparent text-black font-extrabold shadow-[0_0_15px_var(--color-primary-base)]' 
                  : 'bg-transparent text-text-faint border-transparent pointer-events-none'
              }`}
            >
              Apply to Simulator
            </button>
            <div className="h-6 w-[1px] bg-border-main mx-1" />
            <button 
              onClick={onClose}
              className="p-1 rounded bg-[#161B22] hover:bg-[#21262d] text-text-secondary hover:text-text-primary transition-all border border-border-main"
            >
              <X size={14} />
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA (SPLIT SPREADSHEET / DIAGNOSTIC PANEL) */}
        <div className="flex flex-1 overflow-hidden min-h-0 bg-[#0d1117]">
          {/* LEFT CONTAINER (THE CURRENT SELECTED PANEL) */}
          <main className="flex-1 overflow-hidden flex flex-col border-r border-[#161B22]/50">
            {/* WORKSPACE NAVIGATION BAR */}
            <div className="flex items-center justify-between px-3 py-2 bg-bg-panel border-b border-[#161B22]/60 select-none">
              <nav className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab('spreadsheet')}
                  className={`px-3 py-1 text-[11px] font-medium font-sans flex items-center gap-1.5 rounded transition-all ${
                    activeTab === 'spreadsheet' 
                      ? 'bg-[#1f2937] text-text-primary border border-border-main/80 font-semibold' 
                      : 'text-text-muted hover:text-text-primary hover:bg-[#161b22] border border-transparent'
                  }`}
                >
                  <List size={12} className={activeTab === 'spreadsheet' ? 'text-primary-base' : ''} /> 
                  Spreadsheet List ({filteredDraftRules.length})
                </button>
                <button
                  onClick={() => setActiveTab('matrix')}
                  className={`px-3 py-1 text-[11px] font-medium font-sans flex items-center gap-1.5 rounded transition-all ${
                    activeTab === 'matrix' 
                      ? 'bg-[#1f2937] text-text-primary border border-border-main/80 font-semibold' 
                      : 'text-text-muted hover:text-text-primary hover:bg-[#161b22] border border-transparent'
                  }`}
                >
                  <Grid size={12} className={activeTab === 'matrix' ? 'text-cyan-400' : ''} /> 
                  Transition Matrix Grid
                </button>
                <button
                  onClick={() => setActiveTab('builder')}
                  className={`px-3 py-1 text-[11px] font-medium font-sans flex items-center gap-1.5 rounded transition-all ${
                    activeTab === 'builder' 
                      ? 'bg-[#1f2937] text-text-primary border border-border-main/80 font-semibold' 
                      : 'text-text-muted hover:text-text-primary hover:bg-[#161b22] border border-transparent'
                  }`}
                >
                  <MessageSquare size={12} className={activeTab === 'builder' ? 'text-orange-400' : ''} /> 
                  Guided Sentence Builder
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-3 py-1 text-[11px] font-medium font-sans flex items-center gap-1.5 rounded transition-all ${
                    activeTab === 'ai' 
                      ? 'bg-[#1f2937] text-text-primary border border-border-main/80 font-semibold' 
                      : 'text-text-muted hover:text-text-primary hover:bg-[#161b22] border border-transparent'
                  }`}
                >
                  <Sparkles size={12} className={activeTab === 'ai' ? 'text-amber-400' : ''} /> 
                  AI Co-Designer
                </button>
                <button
                  onClick={() => setActiveTab('help')}
                  className={`px-3 py-1 text-[11px] font-medium font-sans flex items-center gap-1.5 rounded transition-all ${
                    activeTab === 'help' 
                      ? 'bg-[#1f2937] text-text-primary border border-border-main/80 font-semibold' 
                      : 'text-text-muted hover:text-text-primary hover:bg-[#161b22] border border-transparent'
                  }`}
                >
                  <HelpCircle size={12} className={activeTab === 'help' ? 'text-green-400' : ''} /> 
                  Help & Academy
                </button>
              </nav>

              {activeTab === 'spreadsheet' && (
                <div className="relative w-48 flex items-center">
                  <span className="absolute left-2.5 text-text-muted">
                    <Search size={11} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search query, state, symbol..."
                    className="w-full text-[10px] pl-7 pr-2.5 py-1 bg-bg-surface outline-none border border-border-main rounded text-text-primary placeholder:text-text-faint focus:border-border-active transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-text-muted hover:text-text-primary"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ACTION GRAPHICS AND INTERACTION SHEETS */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              
              {/* TAB 1: SPREADSHEET TABLE EDITOR */}
              {activeTab === 'spreadsheet' && (
                <div className="border border-[#21262d] rounded-lg overflow-hidden bg-bg-surface flex-1 flex flex-col">
                  <div className="overflow-x-auto overflow-y-auto max-h-[50vh]">
                    <table className="w-full table-fixed min-w-[600px] border-collapse">
                      <thead className="bg-[#161B22] text-[10px] text-text-muted border-b border-border-main font-sans text-left sticky top-0 z-20">
                        <tr>
                          <th className="p-2 w-10 text-center text-text-faint">#</th>
                          <th className="p-2 w-1/4">CURRENT STATE</th>
                          <th className="p-2 w-[12%] text-center">READ TAPE</th>
                          <th className="p-2 w-[12%] text-center">WRITE TAPE</th>
                          <th className="p-2 w-[12%] text-center">MOVE DIRECTION</th>
                          <th className="p-2 w-1/4">NEXT STATE STATE</th>
                          <th className="p-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#161B22] font-mono text-[11px]">
                        {filteredDraftRules.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-text-faint font-sans">
                              {searchQuery ? "No matching rules match your search query." : "No instruction rules found. Click '+ Add Rule' above."}
                            </td>
                          </tr>
                        ) : (
                          filteredDraftRules.map((rule, index) => {
                            const isCurrentRuleActive = lastRuleId === rule.id;
                            const isStateActive = currentState === rule.currentState;
                            const currentTapeSymbol = (tape[headPosition] || '_').trim() || '_';
                            const isRuleEvaluatedNow = isStateActive && rule.readSymbol === currentTapeSymbol;

                            return (
                              <tr 
                                key={rule.id}
                                onMouseEnter={() => setHoveredRuleId(rule.id)}
                                onMouseLeave={() => setHoveredRuleId(null)}
                                className={`group transition-all duration-150 ${
                                  isRuleEvaluatedNow 
                                    ? 'bg-primary-base/20 font-bold border-l-2 border-primary-base' 
                                    : (isCurrentRuleActive ? 'bg-primary-base/10' : 'hover:bg-bg-panel/40')
                                }`}
                              >
                                <td className="p-2 text-center text-text-faint border-r border-[#161B22]/50 relative">
                                  {isRuleEvaluatedNow && (
                                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary-base rounded-full animate-pulse" />
                                  )}
                                  {index + 1}
                                </td>
                                
                                <td className="p-2 font-semibold">
                                  <input 
                                    type="text"
                                    value={rule.currentState}
                                    onChange={e => updateDraftRule(rule.id, 'currentState', e.target.value)}
                                    className={`w-full bg-transparent outline-none focus:bg-[#21262d] px-1.5 py-0.5 rounded ${
                                      isRuleEvaluatedNow ? 'text-primary-base' : 'text-blue-400 font-medium'
                                    }`}
                                    placeholder="e.g. q0"
                                  />
                                </td>

                                <td className="p-1 text-center font-extrabold">
                                  <input 
                                    type="text"
                                    value={rule.readSymbol}
                                    maxLength={1}
                                    onChange={e => updateDraftRule(rule.id, 'readSymbol', e.target.value)}
                                    className={`w-10 bg-transparent text-center outline-none focus:bg-[#21262d] py-0.5 rounded text-amber-400`}
                                    placeholder="_"
                                  />
                                </td>

                                <td className="p-1 text-center font-extrabold">
                                  <input 
                                    type="text"
                                    value={rule.writeSymbol}
                                    maxLength={1}
                                    onChange={e => updateDraftRule(rule.id, 'writeSymbol', e.target.value)}
                                    className={`w-10 bg-transparent text-center outline-none focus:bg-[#21262d] py-0.5 rounded text-indigo-400`}
                                    placeholder="_"
                                  />
                                </td>

                                <td className="p-1 text-center font-black">
                                  <select
                                    value={rule.moveDirection}
                                    onChange={e => updateDraftRule(rule.id, 'moveDirection', e.target.value as Direction)}
                                    className="bg-bg-panel border border-[#21262d] text-center px-2 py-0.5 rounded outline-none cursor-pointer text-cyan-400"
                                  >
                                    <option value="L">L (Left)</option>
                                    <option value="R">R (Right)</option>
                                    <option value="S">- (Stay)</option>
                                  </select>
                                </td>

                                <td className="p-2 font-semibold">
                                  <input 
                                    type="text"
                                    value={rule.nextState}
                                    onChange={e => updateDraftRule(rule.id, 'nextState', e.target.value)}
                                    className="w-full bg-transparent outline-none focus:bg-[#21262d] px-1.5 py-0.5 rounded text-purple-400 font-medium"
                                    placeholder="Next state"
                                  />
                                </td>

                                <td className="p-2 text-right">
                                  <button 
                                    onClick={() => deleteDraftRule(rule.id)}
                                    className="text-text-faint hover:text-red-400 transition-colors p-1"
                                    title="Delete rule"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* MINI FOOTER DESCRIPTION BAR */}
                  <div className="p-2.5 bg-[#161B22] border-t border-border-main flex items-center justify-between text-[10px] text-text-muted">
                    <div className="flex gap-4">
                      <span>💡 Double-click or select cell input text to adjust values directly.</span>
                      <span>_ represents the Blank tape cells symbol.</span>
                    </div>
                    {hoveredRuleId && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-base animate-pulse" />
                        <span className="text-text-primary capitalize font-mono">Row selected</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TRANSITION MATRIX (GRID VISUALIZER) */}
              {activeTab === 'matrix' && (
                <div className="flex-1 flex flex-col gap-4 border border-[#21262d] bg-bg-surface rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                  <div>
                    <h3 className="text-xs font-bold text-text-primary font-sans flex items-center gap-1.5">
                      <Grid size={13} className="text-cyan-400" />
                      Two-Dimensional Transition Map
                    </h3>
                    <p className="text-[10px] text-text-muted font-sans mt-0.5">
                      Intersection cells of current State (rows) and scanned tape Symbol (columns). Click on empty cells to rapidly build paths.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-[#21262d] rounded bg-[#0d1117] relative">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#161b22] text-text-muted text-[10px] font-sans border-b border-[#21262d]">
                          <th className="p-3 font-semibold text-left border-r border-[#21262d] w-32 sticky left-0 bg-[#161b22] z-20">
                            State \ Symbol
                          </th>
                          {uniqueSymbols.map(symb => (
                            <th key={symb} className="p-3 text-center font-bold border-r border-[#21262d] min-w-[120px]">
                              Symbol: {symb === '_' ? 'Blank (_)' : `"${symb}"`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueStates.map(state => {
                          const isCurrentEvaluatingState = currentState === state;
                          return (
                            <tr 
                              key={state} 
                              className={`border-b border-[#21262d]/75 ${isCurrentEvaluatingState ? 'bg-primary-base/5' : ''}`}
                            >
                              {/* State Header Column */}
                              <td className={`p-3 font-mono font-bold border-r border-[#21262d] text-left sticky left-0 z-10 ${
                                isCurrentEvaluatingState 
                                  ? 'bg-[#1f2937] text-primary-base border-r-2 border-r-primary-base' 
                                  : 'bg-[#0d1117] text-blue-400'
                              }`}>
                                {state}
                                {isCurrentEvaluatingState && (
                                  <span className="ml-1 text-[8px] bg-primary-base/20 border border-primary-base/40 px-1 py-0.2 rounded text-primary-base select-none uppercase tracking-widest leading-none">
                                    Current
                                  </span>
                                )}
                              </td>

                              {/* Matrix cells */}
                              {uniqueSymbols.map(symbol => {
                                const matchedRule = draftRules.find(
                                  r => r.currentState.trim() === state.trim() && (r.readSymbol.trim() || '_') === symbol
                                );

                                if (matchedRule) {
                                  const isLastRuleUsed = lastRuleId === matchedRule.id;
                                  return (
                                    <td 
                                      key={symbol} 
                                      className={`p-2 border-r border-[#21262d] text-center font-mono ${
                                        isLastRuleUsed ? 'bg-indigo-950/20' : ''
                                      }`}
                                    >
                                      <div className="bg-[#1c2128] border border-border-main/80 rounded p-1.5 text-left relative group">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-white text-[10px]">
                                            Write: <span className="text-amber-400">"{matchedRule.writeSymbol}"</span>
                                          </span>
                                          <span className={`text-[8px] font-black px-1 py-0.2 rounded ${
                                            matchedRule.moveDirection === 'L' ? 'bg-purple-900/40 text-purple-400' : 'bg-cyan-900/40 text-cyan-400'
                                          }`}>
                                            Move: {matchedRule.moveDirection}
                                          </span>
                                        </div>
                                        <div className="text-[9px] text-text-secondary mt-1 flex items-center justify-between">
                                          <span>→ Go to: <strong className="text-purple-400">{matchedRule.nextState}</strong></span>
                                          <button
                                            onClick={() => deleteDraftRule(matchedRule.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all p-0.5"
                                            title="Delete trace rule"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  );
                                }

                                // Render empty grid cell for missing rules
                                return (
                                  <td key={symbol} className="p-2 border-r border-[#21262d] text-center">
                                    <button
                                      onClick={() => createBlankRuleFromTemplate({ currentState: state, readSymbol: symbol })}
                                      className="w-full h-11 border border-dashed border-[#30363d] hover:border-[#8b949e] rounded text-text-faint hover:text-text-secondary transition-all flex items-center justify-center text-[10px] font-sans gap-1"
                                    >
                                      <Plus size={10} /> Add Transition
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: GUIDED SENTENCE BUILDER */}
              {activeTab === 'builder' && (
                <div className="flex-1 flex flex-col md:flex-row gap-6 border border-[#21262d] bg-bg-surface rounded-lg p-6 max-h-[50vh] overflow-y-auto">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-text-primary font-sans flex items-center gap-1.5">
                        <Sparkles size={13} className="text-orange-400" />
                        Guided Natural Transition Builder
                      </h3>
                      <p className="text-[10px] text-text-muted font-sans mt-0.5">
                        Easily program rules using grammatical natural assertions. This protects you against syntax mistakes.
                      </p>
                    </div>

                    {/* INTERACTIVE COMPOSITOR CARD */}
                    <div className="my-4 bg-bg-panel/40 border border-border-main rounded-xl p-5 leading-normal relative overflow-hidden flex flex-col gap-4">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-base/5 rounded-full filter blur-xl pointer-events-none" />
                      
                      {/* PREVIEW CONTAINER */}
                      <div className="border-l-2 border-orange-500 bg-orange-950/10 p-3 rounded">
                        <span className="text-[9px] uppercase tracking-wider text-orange-400 font-bold block mb-1">Human Translation Translation</span>
                        <div className="text-[12px] font-sans text-text-secondary">
                          IF scanned state is <span className="bg-[#161b22] px-1.5 py-0.5 rounded text-white font-mono font-bold border border-[#21261d]/80">{bCurrentState || '_'}</span> and scans symbol <span className="bg-[#161b22] px-1.5 py-0.5 rounded text-orange-400 font-mono font-bold border border-[#21261d]/80">"{bReadSymbol || 'blank'}"</span>,
                          THEN overwrite tape cell with <span className="bg-[#161b22] px-1.5 py-0.5 rounded text-indigo-400 font-mono font-bold border border-[#21261d]/80">"{bWriteSymbol || '_'}"</span>, move pointer <strong className="text-cyan-400 font-bold">{bMoveDirection === 'R' ? 'Right (→)' : bMoveDirection === 'L' ? 'Left (←)' : 'Stay (•)'}</strong>, and transition next to State <span className="bg-[#161b22] px-1.5 py-0.5 rounded text-purple-400 font-mono font-bold border border-[#21261d]/80">{bNextState || '_'}</span>.
                        </div>
                      </div>

                      {/* TRANSITION SELECTORS COMPOSITION GRID */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-muted font-sans">Current State</label>
                          <select 
                            value={bCurrentState}
                            onChange={(e) => setBCurrentState(e.target.value)}
                            className="bg-[#161B22] border border-[#21262d] p-1.5 rounded outline-none font-mono text-xs cursor-pointer text-white"
                          >
                            {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                            <option value="new_state">+ Create "q_new"</option>
                          </select>
                          {bCurrentState === 'new_state' && (
                            <input 
                              type="text"
                              className="mt-1 bg-[#161B22] border border-[#21262d] px-2 py-1 rounded text-xs outline-none"
                              placeholder="Input State Name"
                              onChange={(e) => setBCurrentState(e.target.value)}
                            />
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-muted font-sans">Read Symbol</label>
                          <select 
                            value={bReadSymbol}
                            onChange={(e) => setBReadSymbol(e.target.value)}
                            className="bg-[#161B22] border border-[#21262d] p-1.5 rounded outline-none font-mono text-xs cursor-pointer text-amber-400"
                          >
                            {uniqueSymbols.map(symb => (
                              <option key={symb} value={symb}>
                                {symb === '_' ? 'Blank (_)' : `"${symb}"`}
                              </option>
                            ))}
                            <option value="X">"X"</option>
                            <option value="Y">"Y"</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-muted font-sans">Write Symbol</label>
                          <input 
                            type="text"
                            value={bWriteSymbol}
                            maxLength={1}
                            onChange={(e) => setBWriteSymbol(e.target.value)}
                            className="bg-[#161B22] border border-[#21262d] p-1.5 rounded outline-none font-mono text-xs text-indigo-400 text-center"
                            placeholder="_"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-muted font-sans font-sans">Direction</label>
                          <div className="flex gap-1">
                            {['L', 'R', 'S'].map(dir => (
                              <button
                                key={dir}
                                type="button"
                                onClick={() => setBMoveDirection(dir as Direction)}
                                className={`flex-1 py-1 rounded border text-[11px] font-black transition-all ${
                                  bMoveDirection === dir 
                                    ? 'bg-cyan-900/30 border-cyan-400 text-cyan-400' 
                                    : 'bg-[#161B22] border-transparent text-text-faint hover:text-text-secondary'
                                }`}
                              >
                                {dir}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-muted font-sans">Then Next State</label>
                          <select 
                            value={bNextState}
                            onChange={(e) => setBNextState(e.target.value)}
                            className="bg-[#161B22] border border-[#21262d] p-1.5 rounded outline-none font-mono text-xs cursor-pointer text-white"
                          >
                            {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                            <option value="halt">halt</option>
                            <option value="accept">accept</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={submitCustomSentenceRule}
                      className="w-full bg-orange-600 hover:bg-orange-500 font-sans font-bold text-white py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      <Plus size={14} /> Incorporate Transition Rule
                    </button>
                  </div>
                </div>
              )}

              {/* AI CO-DESIGNER WORKSPACE */}
              {activeTab === 'ai' && (
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 max-h-[calc(100vh-200px)] no-scrollbar">
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <span className="text-xs text-amber-400 font-extrabold uppercase tracking-wide flex items-center gap-1 font-sans">
                      <Sparkles size={13} /> AI Generative Co-Designer
                    </span>
                    <h2 className="text-base font-bold text-text-primary tracking-tight font-sans">
                      Synthesize Infinite Turing State Machines
                    </h2>
                    <p className="text-xs text-text-muted leading-relaxed font-sans max-w-2xl">
                      Enter what you wish your Turing machine to solve in conversational language (e.g. unary numbers multiplier, a palindrome validator, or brackets parity scanner). Gemini will design the scenario, tape symbols, and build the entire transition mapping structure.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
                    {/* INPUT FORM */}
                    <div className="lg:col-span-5 flex flex-col gap-3 min-h-0">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-text-muted font-sans tracking-wide">
                          Task Description / Objective
                        </label>
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="Describe your machine logic e.g. Design a Turing machine to shift binary strings stored on the tape to the right by one cell, leaving a blank at the starting cell..."
                          rows={6}
                          className="w-full text-xs font-sans bg-[#161b22] p-3 outline-none border border-border-main rounded-lg text-text-primary placeholder:text-text-faint focus:border-[#4d5c6e] resize-none leading-relaxed transition-colors"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input 
                          type="checkbox" 
                          checked={aiContextActive} 
                          onChange={(e) => setAiContextActive(e.target.checked)}
                          className="accent-[#1d4ed8] cursor-pointer"
                        />
                        <span className="text-[11px] text-text-muted font-sans select-none">
                          Provide active sandbox rules & tape as base context
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={aiIsGenerating || !aiPrompt.trim()}
                        className="w-full bg-[#1d4ed8] hover:bg-blue-600 font-sans font-bold text-white py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide disabled:opacity-45 disabled:pointer-events-none shadow shrink-0"
                      >
                        {aiIsGenerating ? (
                          <>
                            <span className="animate-spin border-2 border-white/30 border-t-white h-3 w-3 rounded-full mr-1" />
                            Synthesizing Program blueprint...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} /> Generate Turing Scheme
                          </>
                        )}
                      </button>

                      {aiError && (
                        <div className="text-[11px] text-red-400 font-bold font-sans bg-red-950/25 border border-red-500/20 px-3 py-2 rounded-lg flex items-start gap-1.5 leading-normal shrink-0">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                          <span>{aiError}</span>
                        </div>
                      )}

                      {/* QUICK START IDEAS */}
                      <div className="flex flex-col gap-2 border border-border-main/40 rounded-lg p-3 bg-bg-panel/40 overflow-y-auto no-scrollbar">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-text-muted font-sans flex-shrink-0">
                          Quick Presets Ideas
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { title: "Binary Inverter", desc: "Change all '0's to '1's and '1's to '0's on the tape and halt." },
                            { title: "Double '1's Counter", desc: "For every '1' printed, double its occurrences (e.g. 111 becomes 111111)." },
                            { title: "Odd Zeros Checker", desc: "Scan if the tape has an odd number of zeros, halting on accept." },
                            { title: "Tape Shifter Right", desc: "Shift all binary contents on the tape right by exactly 1 position." }
                          ].map((idea, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setAiPrompt(idea.desc)}
                              className="text-left text-[11px] p-2 rounded border border-[#21262d] hover:border-text-muted bg-[#161b22] text-text-secondary hover:text-text-primary transition-all flex flex-col gap-0.5 group"
                            >
                              <span className="font-bold font-sans text-amber-400/80 group-hover:text-amber-300">{idea.title}</span>
                              <span className="text-[10px] text-text-faint font-sans line-clamp-1">{idea.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* BLUEPRINT RESULTS */}
                    <div className="lg:col-span-7 flex flex-col border border-border-main rounded-lg bg-bg-panel/40 overflow-hidden h-[400px] lg:h-auto min-h-[350px]">
                      {aiIsGenerating ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 select-none">
                          <div className="relative flex items-center justify-center h-12 w-12">
                            <span className="absolute animate-ping h-8 w-8 rounded-full bg-cyan-400 opacity-20"></span>
                            <Sparkles size={24} className="text-cyan-400 animate-pulse" />
                          </div>
                          <div className="text-center">
                            <h4 className="text-xs font-bold text-text-secondary font-sans animate-pulse">Running Neural Synthesis...</h4>
                            <p className="text-[11px] text-text-muted mt-1 leading-relaxed font-sans max-w-xs">
                              Gemini is computing states, determining transitions rules, and auditing logic parameters.
                            </p>
                          </div>
                        </div>
                      ) : generatedScenario ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                          {/* BLUE PRINT METADATA */}
                          <div className="p-3 bg-[#161b22] border-b border-border-main flex flex-col gap-1 shrink-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-400 font-sans border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.2 rounded">
                                Computed Blueprint Ready
                              </span>
                              <span className="text-[10px] text-text-muted font-mono bg-bg-element px-1.5 py-0.5 rounded">
                                {generatedScenario.rules.length} transition rules
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-text-primary font-sans mt-1">
                              {generatedScenario.name}
                            </h4>
                            <p className="text-[10px] text-text-faint font-sans leading-normal">
                              {generatedScenario.description}
                            </p>
                          </div>

                          {/* ACTION BUTTON UTILITIES BAR */}
                          <div className="px-3 py-2 bg-[#0d1117] border-b border-border-main flex items-center justify-end gap-1.5 flex-wrap shrink-0">
                            <span className="text-[10px] text-text-muted font-sans font-medium mr-auto">Draft Actions:</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={mergeAiRulesToDraft}
                                className="px-2 py-1 bg-[#161b22] hover:bg-[#21262d] text-cyan-400 hover:text-cyan-300 font-bold text-[10px] border border-cyan-500/25 rounded transition-all flex items-center gap-1 font-sans"
                                title="Merge AI rules with current rules, auto-replacing overlapping state/symbol combos"
                              >
                                Merge Rules
                              </button>
                              <button
                                type="button"
                                onClick={overwriteDraftWithAiRules}
                                className="px-2 py-1 bg-[#161b22] hover:bg-[#21262d] text-amber-400 hover:text-amber-300 font-bold text-[10px] border border-amber-500/25 rounded transition-all flex items-center gap-1 font-sans"
                                title="Replace current rules entirely with AI rules"
                              >
                                Overwrite Rules
                              </button>
                              <button
                                type="button"
                                onClick={applyFullAiScenario}
                                className="px-2.5 py-1 bg-[#22c55e] hover:bg-[#16a34a] text-black font-extrabold text-[10px] rounded transition-all flex items-center gap-1 font-sans shadow"
                                title="Load full AI sandbox scenario (updates initial tape, states, rules, and closes the studio to let you run immediately)"
                              >
                                Apply & Open Run
                              </button>
                            </div>
                          </div>

                          {/* PREVIEW OF RULES */}
                          <div className="flex-1 overflow-y-auto no-scrollbar bg-[#090d12]">
                            <div className="p-3">
                              <span className="text-[9px] uppercase font-bold text-text-faint tracking-wider font-sans block mb-2">
                                Computed Transition Functions:
                              </span>
                              <div className="flex flex-col gap-1">
                                {generatedScenario.rules.map((rule, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-1.5 rounded bg-bg-panel/50 hover:bg-[#161b22] border border-[#21262d]/55 hover:border-text-muted/20 text-[10px] font-mono transition-colors"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-blue-400 font-bold">({rule.currentState}, "{rule.readSymbol || '_'}")</span>
                                      <span className="text-text-faint text-[9.5px]">➔</span>
                                      <span className="text-green-400 font-bold">({rule.nextState}, "{rule.writeSymbol || '_'}", {rule.moveDirection})</span>
                                    </div>
                                    <span className="text-[9px] text-[8px] bg-[#161b22] text-text-faint font-sans px-1 rounded-sm border border-border-main/50">
                                      Rule #{idx + 1}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-2 select-none">
                          <Sparkles size={20} className="text-[#3b82f6]/40 cursor-default" />
                          <h4 className="text-xs font-bold text-text-muted font-sans">Awaiting Logic Prompts</h4>
                          <p className="text-[10px] text-text-faint text-center leading-relaxed font-sans max-w-[200px]">
                            Once generated, the full simulation blueprint, state mappings, and initial tape configurations will populate here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* HELP & ACADEMY WORKSPACE */}
              {activeTab === 'help' && (
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 max-h-[calc(100vh-200px)] no-scrollbar bg-[#0d1117] font-sans text-text-primary">
                  {/* HERO BANNER SECTION */}
                  <div className="flex flex-col gap-1.5 border border-[#161B22]/80 bg-bg-panel/40 p-3.5 rounded-lg flex-shrink-0">
                    <span className="text-xs text-green-400 font-extrabold uppercase tracking-wide flex items-center gap-1 font-sans">
                      <HelpCircle size={13} /> Advanced Rule Studio Guide & Academy
                    </span>
                    <h2 className="text-base font-bold text-text-primary tracking-tight font-sans">
                      Mastering the Turing Machine Interface
                    </h2>
                    <p className="text-xs text-text-muted leading-relaxed font-sans max-w-3xl">
                      Welcome to the Rule Studio. Here you can write, refactor, and synthesize state transition mathematical frameworks. A Turing Machine executes operations step-by-step using a sliding read/write head, an infinitely expanding storage tape, and a deterministic finite-state transition rule-book.
                    </p>
                  </div>

                  {/* TAB DESCRIPTION CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 flex-shrink-0">
                    {/* SPREADSHEET CARD */}
                    <div className="p-3 border border-[#21262d] rounded-lg bg-bg-surface hover:bg-[#161b22]/50 transition-all flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded bg-[#21262d] text-primary-base">
                          <List size={12} />
                        </span>
                        <h4 className="text-xs font-bold text-text-primary">1. Spreadsheet List Editor</h4>
                      </div>
                      <p className="text-[11px] text-[#8892b0] leading-normal">
                        Our raw, direct-cell interface. Write states, symbols, head instructions, and next states inside a clean spreadsheet spreadsheet grid.
                      </p>
                      <ul className="text-[10px] text-text-muted list-disc list-inside leading-relaxed flex flex-col gap-1 mt-1 border-t border-border-main/50 pt-1.5">
                        <li><span className="text-text-secondary font-medium">Find it at:</span> Tab <kbd className="px-1 bg-[#161b22] border border-[#21262d] rounded text-[9px]">Rule Grid</kbd> at top left.</li>
                        <li>Double-click/click cells to edit parameters in place.</li>
                        <li>Search rules instantly to look up sub-procedures.</li>
                      </ul>
                    </div>

                    {/* MATRIX CARD */}
                    <div className="p-3 border border-[#21262d] rounded-lg bg-bg-surface hover:bg-[#161b22]/50 transition-all flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded bg-[#21262d] text-cyan-400">
                          <Grid size={12} />
                        </span>
                        <h4 className="text-xs font-bold text-text-primary">2. Transition Matrix</h4>
                      </div>
                      <p className="text-[11px] text-[#8892b0] leading-normal">
                        Represent the machine as an algebraic 2D grid matrix of Current States vs. Scanned Symbols. Highlights code coverage.
                      </p>
                      <ul className="text-[10px] text-text-muted list-disc list-inside leading-relaxed flex flex-col gap-1 mt-1 border-t border-border-main/50 pt-1.5">
                        <li><span className="text-text-secondary font-medium">Find it at:</span> Tab <kbd className="px-1 bg-[#161b22] border border-[#21262d] rounded text-[9px]">Transition Matrix</kbd> at top left.</li>
                        <li>Identifies unhandled state pathways at a glance.</li>
                        <li>Click any unmapped cell to instantly generate a blank rule.</li>
                      </ul>
                    </div>

                    {/* GUIDED BUILDER CARD */}
                    <div className="p-3 border border-[#21262d] rounded-lg bg-bg-surface hover:bg-[#161b22]/50 transition-all flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded bg-[#21262d] text-orange-400">
                          <MessageSquare size={12} />
                        </span>
                        <h4 className="text-xs font-bold text-text-primary">3. Guided Builder</h4>
                      </div>
                      <p className="text-[11px] text-[#8892b0] leading-normal">
                        Bypasses syntactic bugs and typos by letting you compose transitions through structured drop-down sentence elements.
                      </p>
                      <ul className="text-[10px] text-text-muted list-disc list-inside leading-relaxed flex flex-col gap-1 mt-1 border-t border-border-main/50 pt-1.5">
                        <li><span className="text-text-secondary font-medium">Find it at:</span> Tab <kbd className="px-1 bg-[#161b22] border border-[#21262d] rounded text-[9px]">Guided Creator</kbd> at top left.</li>
                        <li>Includes real-time English natural language translation HUD.</li>
                        <li>"Incorporate" button appends or updates draft on the fly.</li>
                      </ul>
                    </div>

                    {/* AI CO-DESIGNER CARD */}
                    <div className="p-3 border border-[#21262d] rounded-lg bg-bg-surface hover:bg-[#161b22]/50 transition-all flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded bg-[#21262d] text-amber-400">
                          <Sparkles size={12} />
                        </span>
                        <h4 className="text-xs font-bold text-text-primary">4. AI Co-Designer</h4>
                      </div>
                      <p className="text-[11px] text-[#8892b0] leading-normal">
                        Integrates Gemini smart model coding to automatically construct state machines from user descriptions.
                      </p>
                      <ul className="text-[10px] text-text-muted list-disc list-inside leading-relaxed flex flex-col gap-1 mt-1 border-t border-border-main/50 pt-1.5">
                        <li><span className="text-text-secondary font-medium">Find it at:</span> Tab <kbd className="px-1 bg-[#161b22] border border-[#21262d] rounded text-[9px]">AI Co-Designer</kbd> at top left.</li>
                        <li>Converts plain business terms to hard Turing rules.</li>
                        <li>Allows appending rule packages into existing drafts safely.</li>
                      </ul>
                    </div>

                    {/* TOOLS CARD */}
                    <div className="p-3 border border-[#21262d] rounded-lg bg-bg-surface hover:bg-[#161b22]/50 transition-all flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded bg-[#21262d] text-emerald-400">
                          <Wand2 size={12} />
                        </span>
                        <h4 className="text-xs font-bold text-text-primary">5. State Renovator Refactor</h4>
                      </div>
                      <p className="text-[11px] text-[#8892b0] leading-normal">
                        A bulk renaming utility. Changes state designations in rules instantly without losing transition flow coherence.
                      </p>
                      <ul className="text-[10px] text-text-muted list-disc list-inside leading-relaxed flex flex-col gap-1 mt-1 border-t border-border-main/50 pt-1.5">
                        <li><span className="text-text-secondary font-medium">Find it at:</span> Right sidebar box <span className="text-emerald-400 font-semibold">[State Renovator]</span>.</li>
                        <li>Avoids correcting states block-by-block individually.</li>
                        <li>Updates spreadsheet view immediately.</li>
                      </ul>
                    </div>

                    {/* LOGIC MATHS DICTIONARY CARD */}
                    <div className="p-3 border border-[#21262d] rounded-lg bg-bg-surface hover:bg-[#161b22]/50 transition-all flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded bg-[#21262d] text-sky-400">
                          <Sliders size={12} />
                        </span>
                        <h4 className="text-xs font-bold text-text-primary">6. Formal Definitions</h4>
                      </div>
                      <p className="text-[11px] text-[#8892b0] leading-normal">
                        A mathematically formal Turing Machine is represented as: <code className="text-amber-400 font-mono">b = ⟨Q, Σ, Γ, δ, q0, q_acc⟩</code>.
                      </p>
                      <ul className="text-[10px] text-text-muted list-disc list-inside leading-relaxed flex flex-col gap-1 mt-1 border-t border-border-main/50 pt-1.5">
                        <li><strong>States (Q)</strong>: Finite collection of nodes (e.g. q1, q2).</li>
                        <li><strong>Tape Alphabet (Γ)</strong>: Characters printed (e.g. 0, 1, _).</li>
                        <li><strong>Transition Function (δ)</strong>: Rules mapping cell inputs.</li>
                      </ul>
                    </div>
                  </div>

                  {/* CAPABILITIES DETAILS WORKSPACE */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                    {/* INTELLIGENT REAL-TIME LINTER CAPABILITIES */}
                    <div className="border border-border-main rounded-lg bg-[#11161d] p-3 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider pb-1.5 border-b border-[#21262d]">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>🔍 Real-Time Rule Diagnostics & Linter</span>
                      </div>
                      <p className="text-[11.5px] text-[#8892b0] leading-relaxed">
                        To simplify working with complex state machines and prevent bugs before they happen, our simulator runs a <span className="text-white font-bold">real-time constraints solver</span> that monitors the transition matrix live:
                      </p>
                      <div className="space-y-3 pl-1 text-[11px] leading-relaxed">
                        <div className="flex gap-2">
                          <span className="text-red-500 font-bold shrink-0 mt-0.5">●</span>
                          <div>
                            <strong className="text-text-primary">Overlapping Conflict Detection:</strong> Turing Machines are strictly deterministic. If two rules share the exact same starting <code className="bg-[#161b22] px-1 text-blue-400 rounded">Current State</code> and scan the same <code className="bg-[#161b22] px-1 text-amber-400 rounded">Read Symbol</code> but output different actions, the linter highlights both in red with pulsing indicator bubbles, displaying detailed diagnostics on hover.
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <span className="text-amber-500 font-bold shrink-0 mt-0.5">●</span>
                          <div>
                            <strong className="text-text-primary">Unreachable State Warnings:</strong> If you declare state rules that can never be reached (i.e., no other transitional rule points to them as the <code className="bg-[#161b22] px-1 text-green-400 rounded">Next State</code>, and it is not the starting state), they are underlined in orange so you can correct your routing logic.
                          </div>
                        </div>
                      </div>

                      <div className="mt-1 bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5 text-[10px] space-y-1">
                        <span className="text-amber-400 font-bold block uppercase tracking-wide">📍 Where to find:</span>
                        <p className="text-text-muted leading-relaxed">
                          1. Warnings HUD Banner directly above the grid list inside the Rule Editor.<br />
                          2. Warnings column tags and colored rows indicator inside the main workspace spreadsheet grid view.<br />
                          3. Real-time Health Diagnostics panel in rule popup right sidebar panel.
                        </p>
                      </div>
                    </div>

                    {/* DUAL AI GENERATIVE ENGINES COMPARED */}
                    <div className="border border-border-main rounded-lg bg-[#11161d] p-3 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider pb-1.5 border-b border-[#21262d]">
                        <Sparkles size={14} className="shrink-0" />
                        <span>🤖 Dual-Engine AI Capabilities</span>
                      </div>
                      
                      <p className="text-[11.5px] text-[#8892b0] leading-relaxed">
                        Our codebase provides <span className="text-white font-bold">two distinct AI generative systems</span> powered by Gemini to help model different aspects of Turing machines:
                      </p>

                      <div className="space-y-3.5 mt-1 text-[11px]">
                        <div className="flex gap-2">
                          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold py-0.5 px-1.5 rounded h-fit shrink-0 mt-0.5">Sidebar Engine</div>
                          <div>
                            <strong className="text-text-primary">AI Scenario Creator:</strong> Synthesizes a brand new computing challenge on-the-fly. It configures the scenario title, problem descriptions, custom prefilled initial tape memory elements, and state rules.
                            <br />
                            <span className="italic text-text-muted text-[10px]">📍 Find it at: Bottom of Scenario Library (Left Sidebar) under <code>"AI Scenario Creator"</code>.</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold py-0.5 px-1.5 rounded h-fit shrink-0 mt-0.5">Studio Engine</div>
                          <div>
                            <strong className="text-text-primary">AI Generative Co-Designer:</strong> Synthesizes deterministic rule drafts for your active sandbox. You describe logic, and Gemini generates transition arrays. You can then selectively Merge or Overwrite rules in the Draft space.
                            <br />
                            <span className="italic text-text-muted text-[10px]">📍 Find it at: Tab <code>AI Co-Designer</code> at the top left of the Rule Studio window.</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-2 text-[10px] text-text-faint italic leading-relaxed border-t border-[#21262d]/50">
                        Pro tip: Use the Scenario Creator to establish the environment parameters, and the Co-Designer to fine-tune sub-procedures!
                      </div>
                    </div>
                  </div>

                  {/* COMMON TAPE INSTRUCTIONS TABLE EXAMPLES */}
                  <div className="border border-border-main rounded-lg bg-bg-panel overflow-hidden mt-1 flex-shrink-0">
                    <div className="p-3 border-b border-border-main bg-[#161b22]">
                      <h4 className="text-xs font-bold text-text-primary font-sans">
                        Example Rule Execution Walkthrough
                      </h4>
                      <p className="text-[10px] text-text-faint font-sans leading-normal">
                        How rules execute inside the simulator in real-time step increments:
                      </p>
                    </div>
                    <div className="p-3 font-mono text-[10.5px] leading-relaxed select-text text-text-secondary flex flex-col gap-2 bg-[#090d12]">
                      <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-text-muted border-b border-border-main/40 pb-1.5 mb-1.5">
                        <span className="col-span-3">Step Context</span>
                        <span className="col-span-3">Scanner Scans</span>
                        <span className="col-span-3">Action Completed</span>
                        <span className="col-span-3">Next Machine State</span>
                      </div>
                      <div className="grid grid-cols-12 gap-2">
                        <span className="col-span-3 text-blue-400 font-bold">1. Current State: "q0"</span>
                        <span className="col-span-3 text-amber-400 font-bold">Reads: "1"</span>
                        <span className="col-span-3 text-indigo-400">Writes "0", Moves Right ("R")</span>
                        <span className="col-span-3 text-green-400 font-bold">State enters "q1"</span>
                      </div>
                      <div className="grid grid-cols-12 gap-2 mt-1 py-1 bg-bg-panel/30 border-y border-border-main/20">
                        <span className="col-span-3 text-blue-400 font-bold">2. Current State: "q1"</span>
                        <span className="col-span-3 text-amber-400 font-bold">Reads: "_" (Blank)</span>
                        <span className="col-span-3 text-indigo-400">Writes "1", Halts state ("S")</span>
                        <span className="col-span-3 text-green-400 font-bold">State enters "accept"</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT CONTEXT ZONE (HUD & UTILITIES - 30% WIDTH) */}
          <aside className="w-80 bg-bg-panel flex flex-col overflow-y-auto p-4 gap-4 scrollbar-thin shrink-0">
            {/* REALTIME SYSTEM HEALTH BADGE */}
            <div className="border border-[#21262d] rounded-lg p-3 bg-bg-surface flex flex-col gap-2">
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-extrabold font-sans">
                Real-time Health Report
              </span>
              
              {diagnostics.length === 0 ? (
                <div className="flex items-center gap-2 text-green-400 bg-green-950/20 px-2.5 py-1.5 rounded border border-green-500/10">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span className="text-[11px] font-medium font-sans">All deterministic constraints met!</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-amber-400 bg-amber-950/20 px-2.5 py-1.5 rounded border border-amber-500/10">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span className="text-[11px] font-bold font-sans">
                      {diagnostics.length} {diagnostics.length === 1 ? 'Diagnostic flag' : 'Diagnostic flags'} reported
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 overflow-y-auto max-h-32 text-[10px] leading-relaxed no-scrollbar text-text-secondary border-t border-[#21262d]/50 pt-1.5">
                    {diagnostics.map((err, i) => (
                      <div key={i} className="flex gap-1.5 items-start">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${err.type === 'error' ? 'bg-red-500' : 'bg-amber-400'}`} />
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QUICK MULTI-RENAME STATE RENOVATOR */}
            <div className="border border-[#21262d] rounded-lg p-3 bg-bg-surface flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-extrabold font-sans">
                  State Renovator
                </span>
                <span className="text-[8px] bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold px-1 py-0.2 rounded font-sans">
                  Refactor tool
                </span>
              </div>
              <p className="text-[10px] text-text-faint font-sans mb-1 leading-normal">
                Rename all instances of a specific state identifier inside rules instantly. Saves massive manual renaming.
              </p>

              <div className="flex gap-2 items-center">
                <div className="flex-1 flex flex-col">
                  <input
                    type="text"
                    value={renamerFrom}
                    onChange={(e) => setRenamerFrom(e.target.value)}
                    placeholder="From: e.g. state1"
                    className="w-full text-xs bg-bg-panel px-2 py-1 rounded outline-none border border-border-main focus:border-border-active transition-all"
                  />
                </div>
                <ArrowRight size={12} className="text-text-muted shrink-0" />
                <div className="flex-1 flex flex-col">
                  <input
                    type="text"
                    value={renamerTo}
                    onChange={(e) => setRenamerTo(e.target.value)}
                    placeholder="To: e.g. run"
                    className="w-full text-xs bg-bg-panel px-2 py-1 rounded outline-none border border-border-main focus:border-border-active transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={executeRenameRenovator}
                disabled={!renamerFrom || !renamerTo}
                className="text-[10px] uppercase tracking-wider text-black bg-[#e2e8f0] hover:bg-white font-bold p-1 rounded font-sans transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Apply Refactor Bulk
              </button>
              {renamerSuccess && (
                <span className="text-[9px] text-green-400 text-center select-none animate-pulse">✓ States updated successfully!</span>
              )}
            </div>

            {/* TRANSLATOR DICTIONARY SIDEBAR */}
            <div className="border border-[#21262d] rounded-lg p-3 bg-bg-surface flex flex-col gap-2">
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-extrabold font-sans">
                Quick Evaluator HUD
              </span>
              <div className="bg-bg-panel p-2 rounded border border-border-main flex flex-col gap-1.5">
                <span className="text-[9px] text-text-faint uppercase font-bold tracking-wider font-sans">Machines Active Status</span>
                <div className="text-[11px] font-mono leading-relaxed mt-1 text-text-primary">
                  Current State: <span className="text-blue-400 font-bold">{currentState}</span>
                </div>
                <div className="text-[11px] font-mono leading-relaxed text-text-primary mb-1">
                  Symbol Scanned: <span className="text-amber-400 font-bold">"{(tape[headPosition] || '_')}"</span>
                </div>

                <div className="h-[1px] bg-border-main my-1" />
                
                {/* Find current live active rule translation */}
                {(() => {
                  const currentSymbol = tape[headPosition] || '_';
                  const activeLiveRule = draftRules.find(r => r.currentState.trim() === currentState.trim() && (r.readSymbol.trim() || '_') === currentSymbol);
                  if (activeLiveRule) {
                    return (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-green-400 font-sans uppercase font-extrabold">▶ Evaluation Trace</span>
                        {translateToNaturalLanguage(activeLiveRule)}
                      </div>
                    );
                  }
                  return (
                    <div className="text-[10px] text-text-faint font-sans">
                      No active rule matching state <strong className="text-text-secondary">{currentState}</strong> and current head symbol <strong className="text-text-secondary">"{currentSymbol}"</strong>. Transition will halt if compiled.
                    </div>
                  );
                })()}
              </div>
            </div>
          </aside>
        </div>

        {/* DATA UTILITY DRAWER OVERLAY (FOR IMPORT/EXPORT JSON) */}
        {showDataPanel && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-[#1c2128] border border-border-main rounded-xl w-full max-w-xl p-5 flex flex-col gap-3 relative shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5 font-sans">
                  <Upload size={13} className="text-indigo-400" />
                  JSON Instruction Porter
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDataPanel(false)}
                  className="p-1 rounded bg-[#161B22] hover:bg-[#21262d] text-text-secondary"
                >
                  <X size={12} />
                </button>
              </div>

              <p className="text-[10px] text-text-muted font-sans leading-normal">
                Paste an array of transition rules containing <code>currentState</code>, <code>readSymbol</code>, <code>writeSymbol</code>, <code>moveDirection</code> and <code>nextState</code> to load them instantly. You can copy the exported codes below.
              </p>

              <textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder="Paste JSON syntax here..."
                rows={11}
                className="w-full text-[10px] font-mono bg-bg-panel p-2.5 outline-none border border-border-main rounded text-text-primary placeholder:text-text-faint focus:border-[#4d5c6e] resize-none"
              />

              {jsonError && (
                <div className="text-[10px] text-red-400 font-bold leading-normal font-sans bg-red-950/20 px-2 py-1 rounded border border-red-500/10">
                  ⚠️ Error: {jsonError}
                </div>
              )}

              <footer className="flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(jsonInput);
                  }}
                  className="px-3 py-1 bg-bg-element hover:bg-border-active text-[10px] rounded text-text-primary border border-border-main font-sans transition-colors"
                >
                  Copy to Clipboard
                </button>
                <button
                  type="button"
                  onClick={importJsonRules}
                  className="px-3 py-1 bg-primary-base hover:bg-primary-base/90 text-black font-extrabold text-[10px] rounded font-sans transition-all"
                >
                  Complete Import Load
                </button>
              </footer>
            </div>
          </div>
        )}

        <AnimatePresence>
          {previewState.isOpen && previewState.proposed && (
            <ScenarioDiffModal
              isOpen={previewState.isOpen}
              onClose={handleCancelPreview}
              onApply={handleApplyPreview}
              baseScenario={previewState.base}
              proposedScenario={previewState.proposed}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
