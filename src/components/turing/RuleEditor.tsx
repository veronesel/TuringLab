import React, { useState } from 'react';
import { useTMStore } from '../../store/tmStore';
import { TMRule, Direction } from '../../types/tm';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, Wand2, Maximize2, AlertTriangle, FileText, Table, Search, X, GripVertical } from 'lucide-react';
import { AutocompleteInput } from './AutocompleteInput';

interface RuleEditorProps {
  onOpenStudio?: () => void;
}

// Utility to convert rule list to aligned multi-line text representation
const rulesToText = (rulesList: TMRule[]): string => {
  return rulesList.map(r => {
    const cur = r.currentState.padEnd(12);
    const readSym = (r.readSymbol || '_').padEnd(6);
    const writeSym = (r.writeSymbol || '_').padEnd(6);
    const dir = r.moveDirection.padEnd(5);
    const nextSt = r.nextState;
    return `${cur} ${readSym} ${writeSym} ${dir} ${nextSt}`;
  }).join('\n');
};

// Utility to parse aligned text or CSV back to structured TMRules
const textToRules = (text: string): { rulesList: TMRule[], errors: string[] } => {
  const lines = text.split('\n');
  const parsedRules: TMRule[] = [];
  const errorsList: string[] = [];
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      return; // Skip comments and empty lines
    }
    
    // Support tabs, multiple spaces, or commas as delimiters
    let parts: string[] = [];
    if (trimmed.includes(',')) {
      parts = trimmed.split(',').map(p => p.trim());
    } else {
      parts = trimmed.split(/\s+/).map(p => p.trim());
    }

    if (parts.length < 5) {
      errorsList.push(`Line ${lineNumber}: Invalid rule format (Expected 5 columns, got ${parts.length})`);
      return;
    }

    const [currentState, readSymbol, writeSymbol, moveDirection, nextState] = parts;
    const dir = moveDirection.toUpperCase();
    
    if (dir !== 'L' && dir !== 'R' && dir !== 'S') {
      errorsList.push(`Line ${lineNumber}: Invalid move direction "${moveDirection}" (MUST be L, R, or S)`);
      return;
    }

    parsedRules.push({
      id: uuidv4(),
      currentState,
      readSymbol: readSymbol === '_' ? '_' : readSymbol,
      writeSymbol: writeSymbol === '_' ? '_' : writeSymbol,
      moveDirection: dir as Direction,
      nextState
    });
  });

  return { rulesList: parsedRules, errors: errorsList };
};

export const RuleEditor: React.FC<RuleEditorProps> = ({ onOpenStudio }) => {
  const rules = useTMStore(state => state.rules);
  const setRules = useTMStore(state => state.setRules);
  const lastRuleId = useTMStore(state => state.lastRuleId);
  const isRunning = useTMStore(state => state.isRunning);
  const activeScenario = useTMStore(state => state.activeScenario);
  const currentState = useTMStore(state => state.currentState);
  const headPosition = useTMStore(state => state.headPosition);
  const tape = useTMStore(state => state.tape);
  const executionSpeed = useTMStore(state => state.executionSpeed);

  const [localRules, setLocalRules] = useState<TMRule[]>(rules);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [highlightedRuleId, setHighlightedRuleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFixingRules, setIsFixingRules] = useState<boolean>(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragRowId, setDragRowId] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const symbolAliases = useTMStore(state => state.symbolAliases);

  // Find the currently active executing rule based on the TM state
  const executingRuleId = React.useMemo(() => {
    const currentReadSymbol = (tape[headPosition] || '_').trim() || '_';
    const match = localRules.find(rule => 
      rule.currentState.trim() === currentState.trim() && 
      (rule.readSymbol.trim() || '_') === currentReadSymbol
    );
    return match ? match.id : null;
  }, [localRules, currentState, headPosition, tape]);

  // Auto-scroll to center the currently executing rule if it falls out of view
  React.useEffect(() => {
    if (!executingRuleId || !autoScroll) return;

    // Use shorter/longer debounce depending on speed
    const delay = isRunning && executionSpeed < 100 ? 5 : 30;
    const timer = setTimeout(() => {
      const container = scrollContainerRef.current;
      const element = document.getElementById(`rule-row-${executingRuleId}`);
      if (container && element) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        // Check if element is above, below, or near boundaries
        const isAbove = elementRect.top < containerRect.top + 15;
        const isBelow = elementRect.bottom > containerRect.bottom - 15;

        if (isAbove || isBelow || isRunning) {
          const elementRelativeTop = elementRect.top - containerRect.top + container.scrollTop;
          const targetScrollTop = elementRelativeTop - (container.clientHeight / 2) + (element.offsetHeight / 2);

          // Use instant auto-scroll if simulation speed is fast to prevent stuttering/inertia lag
          const useInstant = isRunning && executionSpeed < 300;

          container.scrollTo({
            top: targetScrollTop,
            behavior: useInstant ? 'auto' : 'smooth'
          });
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [executingRuleId, autoScroll, isRunning, executionSpeed]);

  // Compute unique states parsed from current rules, scenario settings and presets
  const uniqueStates = React.useMemo(() => {
    const states = new Set<string>(['q0', 'halt', 'accept', 'reject']);
    if (activeScenario) {
      states.add(activeScenario.initialState);
      activeScenario.acceptStates.forEach(s => states.add(s));
    }
    localRules.forEach(r => {
      if (r.currentState.trim()) states.add(r.currentState.trim());
      if (r.nextState.trim()) states.add(r.nextState.trim());
    });
    return Array.from(states);
  }, [localRules, activeScenario]);

  // Compute unique symbols found on tape, in rules, or defined as custom aliases
  const uniqueSymbols = React.useMemo(() => {
    const syms = new Set<string>(['_', '0', '1']);
    Object.values(tape).forEach(s => { if (s) syms.add(s); });
    localRules.forEach(r => {
      if (r.readSymbol) syms.add(r.readSymbol);
      if (r.writeSymbol) syms.add(r.writeSymbol);
    });
    Object.keys(symbolAliases).forEach(s => { if (s) syms.add(s); });
    return Array.from(syms);
  }, [localRules, tape, symbolAliases]);

  // Sync when store rules change (like loading a new scenario)
  React.useEffect(() => {
    setLocalRules(rules);
    if (isBulkMode) {
      setBulkText(rulesToText(rules));
      setBulkErrors([]);
    }
  }, [rules]);

  // Real-time linter for conflicting transitions and unreachable states
  const { conflicts, unreachableStates, conflictMessages } = React.useMemo(() => {
    const conflictsSet = new Set<string>();
    const unreachableStatesSet = new Set<string>();
    const conflictMsgs: Record<string, string> = {};

    // 1. Identify starting state
    const startState = (activeScenario?.initialState || 'q0').trim();

    // 2. Compute reachable states using simple target discovery
    const allStatesSet = new Set<string>();
    const reachedSet = new Set<string>();
    reachedSet.add(startState);

    localRules.forEach(r => {
      const cur = r.currentState.trim();
      const nxt = r.nextState.trim();
      if (cur) allStatesSet.add(cur);
      if (nxt) {
        allStatesSet.add(nxt);
        reachedSet.add(nxt);
      }
    });

    allStatesSet.forEach(s => {
      if (!reachedSet.has(s)) {
        unreachableStatesSet.add(s);
      }
    });

    // 3. Scan for non-deterministic conflicts (same current state and read symbol but different outputs)
    const keyMap = new Map<string, string[]>();
    localRules.forEach(r => {
      const cur = r.currentState.trim();
      const sym = (r.readSymbol.trim() || '_');
      const key = `${cur}|${sym}`;
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push(r.id);
    });

    keyMap.forEach((ids, key) => {
      if (ids.length > 1) {
        const [state, symbol] = key.split('|');
        ids.forEach(id => {
          conflictsSet.add(id);
          const otherRules = localRules.filter(r => ids.includes(r.id) && r.id !== id);
          const details = otherRules.map(o => {
            const num = localRules.findIndex(r => r.id === o.id) + 1;
            return `#${num} (NST: ${o.nextState}, OUT: ${o.writeSymbol || '_'}, MV: ${o.moveDirection})`;
          }).join(', ');
          conflictMsgs[id] = `Conflict with rule ${details}. Deterministic machines cannot handle multiple behaviors for state "${state}" on input "${symbol}".`;
        });
      }
    });

    return {
      conflicts: conflictsSet,
      unreachableStates: unreachableStatesSet,
      conflictMessages: conflictMsgs
    };
  }, [localRules, activeScenario]);

  // Map conflicts and unreachable states to precise transition rules for clickable list interaction
  const validationIssues = React.useMemo(() => {
    const issues: {
      id: string;
      type: 'conflict' | 'unreachable';
      title: string;
      description: string;
      ruleId: string;
      ruleNum: number;
    }[] = [];

    // Process deterministic conflicts
    localRules.forEach((rule, idx) => {
      if (conflicts.has(rule.id)) {
        issues.push({
          id: `conflict-${rule.id}`,
          type: 'conflict',
          title: `Deterministic Conflict`,
          description: conflictMessages[rule.id] || `Conflicts with another state/symbol transition configuration.`,
          ruleId: rule.id,
          ruleNum: idx + 1
        });
      }
    });

    // Process unreachable states where rules are defined as "dead code"
    unreachableStates.forEach(st => {
      localRules.forEach((rule, idx) => {
        if (rule.currentState.trim() === st) {
          issues.push({
            id: `unreachable-${rule.id}`,
            type: 'unreachable',
            title: `Unreachable Code`,
            description: `State "${st}" has no incoming transitions and cannot be executed in code path.`,
            ruleId: rule.id,
            ruleNum: idx + 1
          });
        }
      });
    });

    return issues;
  }, [localRules, conflicts, unreachableStates, conflictMessages]);

  const jumpToRule = (ruleId: string) => {
    const element = document.getElementById(`rule-row-${ruleId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedRuleId(ruleId);
      setTimeout(() => {
        setHighlightedRuleId(null);
      }, 1500);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || isRunning || searchQuery) return;

    const updated = [...localRules];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, removed);

    setLocalRules(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragRowId(null);
  };

  const updateRule = (id: string, field: keyof TMRule, value: string) => {
    setLocalRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRule = () => {
    setLocalRules(prev => [...prev, {
      id: uuidv4(),
      currentState: "q0",
      readSymbol: "0",
      nextState: "q0",
      writeSymbol: "0",
      moveDirection: "R"
    }]);
  };

  const fixWithAI = async () => {
    if (validationIssues.length === 0) return;
    setIsFixingRules(true);
    try {
      const response = await fetch('/api/fix-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules: localRules,
          issues: validationIssues
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fix rules with AI');
      }

      const data = await response.json();
      if (data.fixedRules && Array.isArray(data.fixedRules)) {
        // preserve new UUIDs or old ones
        const rulesWithIds = data.fixedRules.map((r: any) => ({
          ...r,
          id: r.id || uuidv4()
        }));
        setLocalRules(rulesWithIds);
        setRules(rulesWithIds);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to apply AI fix');
    } finally {
      setIsFixingRules(false);
    }
  };

  const removeRule = (id: string) => {
    setLocalRules(prev => prev.filter(r => r.id !== id));
  };

  const autoFormatRules = () => {
    const cleanAndFormatList = (list: TMRule[]): TMRule[] => {
      const keysWithSeen = new Set<string>();
      const result: TMRule[] = [];

      list.forEach(r => {
        const cur = r.currentState.trim();
        const read = r.readSymbol.trim() || '_';
        const write = r.writeSymbol.trim() || '_';
        // Ensure standard uppercase string direction
        const dir = (r.moveDirection || 'S').trim().toUpperCase() as Direction;
        const nxt = r.nextState.trim();

        // Remove completely empty/incomplete rules (e.g. empty current and next states)
        if (!cur && !nxt) {
          return;
        }

        // Create a unique compound signature to identify and prune exact redundant lines
        const signature = `${cur}|${read}|${write}|${dir}|${nxt}`;
        if (!keysWithSeen.has(signature)) {
          keysWithSeen.add(signature);
          result.push({
            ...r,
            currentState: cur,
            readSymbol: read,
            writeSymbol: write,
            moveDirection: dir,
            nextState: nxt
          });
        }
      });

      // Sort alphabetically by current state, then by read symbol
      return result.sort((a, b) => {
        const stateComp = a.currentState.localeCompare(b.currentState);
        if (stateComp !== 0) return stateComp;
        return a.readSymbol.localeCompare(b.readSymbol);
      });
    };

    if (isBulkMode) {
      const parsed = textToRules(bulkText);
      const cleaned = cleanAndFormatList(parsed.rulesList);
      setBulkText(rulesToText(cleaned));
      setBulkErrors([]);
    } else {
      setLocalRules(prev => cleanAndFormatList(prev));
    }
  };

  const handleTextChange = (val: string) => {
    setBulkText(val);
    const { errors } = textToRules(val);
    setBulkErrors(errors);
  };

  const saveRules = () => {
    if (isBulkMode) {
      const { rulesList, errors } = textToRules(bulkText);
      if (errors.length > 0) {
        setBulkErrors(errors);
        return;
      }
      setRules(rulesList);
      setLocalRules(rulesList);
      setIsBulkMode(false);
    } else {
      setRules(localRules);
    }
  };

  const hasChanges = isBulkMode 
    ? rulesToText(rules) !== bulkText 
    : JSON.stringify(rules) !== JSON.stringify(localRules);

  const filteredRules = React.useMemo(() => {
    if (!searchQuery.trim()) return localRules;
    const query = searchQuery.toLowerCase().trim();
    return localRules.filter(r => 
      r.currentState.toLowerCase().includes(query) ||
      (r.readSymbol || '_').toLowerCase().includes(query) ||
      (r.writeSymbol || '_').toLowerCase().includes(query) ||
      r.nextState.toLowerCase().includes(query)
    );
  }, [localRules, searchQuery]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden font-mono min-w-0 h-full">
      <div className="p-3 bg-bg-panel border-b border-border-main flex justify-between items-center shrink-0 min-w-0 overflow-x-auto no-scrollbar gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-sans shrink-0">Instructions / Rules</span>
        <div className="flex gap-2 font-sans shrink-0">
          <button 
            type="button"
            onClick={() => onOpenStudio?.()} 
            className="px-2 py-0.5 bg-primary-base/10 text-primary-base text-[9px] border border-primary-base/40 rounded hover:bg-primary-base/20 transition-colors flex items-center gap-1 font-bold"
            title="Open Advanced Rule Studio modal"
          >
            <Maximize2 size={10} /> Studio ↗
          </button>
          <button 
            onClick={autoFormatRules} 
            disabled={isRunning} 
            className="px-2 py-0.5 text-primary-base text-[9px] border border-primary-base/30 rounded hover:bg-primary-base/10 disabled:opacity-50 transition-colors flex items-center gap-1 font-bold"
            title="Auto-sort rules alphabetically by state and symbol, and prune redundant lines"
          >
            <Wand2 size={10} /> Format
          </button>
          {!isBulkMode && (
            <button 
              onClick={addRule} 
              disabled={isRunning} 
              className="px-2 py-0.5 bg-green-900/30 text-green-500 text-[9px] border border-green-500/30 rounded hover:bg-green-900/50 disabled:opacity-50 transition-colors"
            >
              + Add Rule
            </button>
          )}
          <button 
            onClick={() => {
              if (isBulkMode) {
                const { rulesList, errors } = textToRules(bulkText);
                if (errors.length > 0) {
                  setBulkErrors(errors);
                  return;
                }
                setLocalRules(rulesList);
                setIsBulkMode(false);
              } else {
                setBulkText(rulesToText(localRules));
                setBulkErrors([]);
                setIsBulkMode(true);
              }
            }}
            disabled={isRunning}
            className={`px-2 py-0.5 text-[9px] border rounded transition-all duration-150 flex items-center gap-1 font-bold uppercase tracking-wide ${
              isBulkMode 
                ? 'bg-blue-900/40 text-blue-400 border-blue-500/40 hover:bg-blue-900/60' 
                : 'bg-[#1c2128] text-text-secondary border-border-main hover:bg-[#252c36]'
            }`}
            title="Toggle between structural card editor and plain text bulk edit"
          >
            {isBulkMode ? <Table size={10} /> : <FileText size={10} />}
            {isBulkMode ? 'Card Grid' : 'Bulk Edit'}
          </button>
          <button 
            onClick={saveRules} 
            disabled={(!hasChanges && !isBulkMode) || isRunning} 
            className={`px-2 py-0.5 text-[9px] border rounded transition-colors ${hasChanges ? 'bg-amber-900/30 text-primary-base border-primary-base/30 hover:bg-amber-900/50' : 'bg-transparent text-text-faint border-transparent'}`}
          >
            Save Changes
          </button>
        </div>
      </div>

      {isBulkMode ? (
        <div className="flex-1 flex flex-col p-3 overflow-hidden gap-2 bg-bg-surface/50 h-full">
          <div className="flex justify-between items-center bg-[#11141a]/95 p-2.5 rounded border border-border-main text-[10px] shrink-0 leading-normal">
            <div className="text-text-secondary">
              <span className="font-bold text-[#3b82f6]">📝 Bulk Multi-line Rule Editor</span>
              <p className="text-text-muted mt-0.5">
                Paste or write rules line-by-line. Columns: <code className="bg-neutral-800 px-1 py-0.5 rounded text-blue-400 font-mono">CurrentState ReadSymbol WriteSymbol MoveDirection(L/R/S) NextState</code>
              </p>
              <p className="text-text-muted mt-0.5 leading-relaxed">
                Separated by tabs, commas or any spaces. Blanks are represented with <code className="text-amber-400 font-bold border border-amber-500/20 px-0.5 py-0.2 rounded font-mono">_</code>. Lines starting with <code className="text-text-faint">#</code> are comments.
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            <textarea
              className="w-full h-full bg-[#0d1117] text-text-primary border border-border-main rounded-lg p-3 font-mono text-[11px] leading-relaxed resize-none h-full outline-none focus:border-[#4d5c6e] focus:ring-1 focus:ring-[#4d5c6e] hover:border-text-faint/30 transition-all font-semibold"
              value={bulkText}
              onChange={(e) => handleTextChange(e.target.value)}
              disabled={isRunning}
              placeholder={`# Add custom Turing rules here:\n# State   Read  Write  Dir  NextState\nq0        0     1      R    q0\nq0        1     0      L    q1\nq1        _     A      S    halt`}
            />
          </div>

          {/* Action and Error HUD for Bulk Edit */}
          <div className="flex flex-col gap-2 shrink-0">
            {bulkErrors.length > 0 ? (
              <div className="bg-red-950/20 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-[10px] max-h-24 overflow-y-auto font-sans font-semibold">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-red-300">
                  <AlertTriangle size={12} className="text-red-400" />
                  <span>Formatting Errors Detected ({bulkErrors.length})</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {bulkErrors.slice(0, 3).map((e, idx) => (
                    <li key={idx} className="break-words font-mono text-[10.5px]">{e}</li>
                  ))}
                  {bulkErrors.length > 3 && <li key="more">...and {bulkErrors.length - 3} more errors.</li>}
                </ul>
              </div>
            ) : (
              <div className="bg-emerald-950/20 border border-emerald-500/15 text-emerald-400 p-2.5 rounded-lg text-[10px] flex items-center gap-2 font-sans font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Format rules configuration parsed flawlessly! Ready to apply.</span>
              </div>
            )}

            <div className="flex gap-2 text-[10px] font-sans">
              <button
                type="button"
                onClick={() => {
                  const { rulesList, errors } = textToRules(bulkText);
                  if (errors.length > 0) {
                    setBulkErrors(errors);
                    return;
                  }
                  setLocalRules(rulesList);
                  setIsBulkMode(false);
                }}
                disabled={bulkErrors.length > 0 || isRunning}
                className="flex-1 bg-blue-900/35 hover:bg-blue-900/50 text-blue-400 border border-blue-500/30 font-bold py-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase tracking-wider text-[9px]"
                title="Saves and parses rules into the simulator table view"
              >
                Apply & Return to Cards
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(bulkText).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="px-4 bg-[#1c2128] hover:bg-[#252c36] text-text-primary border border-border-main font-bold rounded-md transition-colors flex items-center gap-1 text-[9px] uppercase tracking-wider"
                title="Copies raw text rules to clipboard"
              >
                {copied ? 'Copied ✅' : 'Copy Content'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsBulkMode(false);
                  setBulkErrors([]);
                }}
                className="px-4 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-500/20 font-bold rounded-md transition-colors text-[9px] uppercase tracking-wider"
                title="Discard text corrections"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search Input Bar and Auto-Scroll at the top */}
          <div className="px-3 py-2 bg-bg-panel/90 shrink-0 border-b border-border-main flex items-center justify-between gap-3 font-sans shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0 bg-[#0d1117] border border-border-main focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/20 rounded-md px-2.5 py-1 transition-all">
              <Search size={12} className="text-amber-500 shrink-0" />
              <input 
                type="text" 
                placeholder="Filter rules by state, read, or write symbol..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[10.5px] text-text-primary placeholder:text-text-muted/50 font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="text-text-muted hover:text-text-primary transition-colors flex items-center justify-center w-4 h-4 rounded hover:bg-bg-element"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-border-main text-[9px] font-semibold text-text-muted h-5">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-secondary select-none transition-colors" title="Toggle automatic scrolling to active rule during simulation execution">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border border-border-main bg-bg-surface text-amber-500 focus:ring-0 w-3 h-3 cursor-pointer accent-amber-500"
                />
                <span className={autoScroll ? "text-amber-500 font-bold" : ""}>Auto-Scroll</span>
              </label>
            </div>
          </div>

          {/* Validation Summary Panel */}
          {validationIssues.length > 0 && (
            <div className="mx-3 mt-2 bg-[#1c1212]/60 border border-red-500/20 rounded-lg overflow-hidden flex flex-col text-[10px] font-sans shadow-lg animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-3 py-1.5 bg-red-950/30 border-b border-red-500/10">
                <div className="flex items-center gap-1.5 font-bold text-red-400">
                  <AlertTriangle size={12} className="text-red-400 shrink-0" />
                  <span>Validation Summary ({validationIssues.length} issues)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[8px] text-text-faint font-semibold uppercase tracking-wider hidden sm:inline">Click to locate issue</span>
                  <button 
                    onClick={fixWithAI}
                    disabled={isFixingRules}
                    className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isFixingRules ? (
                      <>
                        <Wand2 size={10} className="animate-pulse" /> Fixing...
                      </>
                    ) : (
                      <>
                        <Wand2 size={10} /> Fix with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="max-h-[140px] overflow-y-auto divide-y divide-[#1c1212] select-none">
                {validationIssues.map(issue => {
                  const isConflict = issue.type === 'conflict';
                  return (
                    <div
                      key={issue.id}
                      onClick={() => jumpToRule(issue.ruleId)}
                      className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-red-950/20 cursor-pointer transition-colors font-mono text-[10px]"
                    >
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide leading-none font-sans ${
                        isConflict 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {isConflict ? 'Conflict' : 'Unreachable'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-text-primary font-bold flex items-center gap-1">
                          <span className={`${isConflict ? 'text-red-300' : 'text-amber-300'}`}>{issue.title}</span>
                          <span className="text-[8px] text-text-faint font-sans font-semibold">Row #{issue.ruleNum} ➜</span>
                        </div>
                        <p className="text-text-muted text-[9px] leading-relaxed mt-0.5 break-words">
                          {issue.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto text-[10px] p-2 overflow-x-auto w-full">
            <table className="w-full table-fixed min-w-[300px]">
              <thead className="text-text-muted border-b border-border-main text-left sticky top-0 bg-bg-surface z-10">
                <tr>
                  <th className="pb-1 font-normal w-6"></th>
                  <th className="pb-1 font-normal w-6 text-center text-text-faint">#</th>
                  <th className="pb-1 font-normal w-1/5 pl-2">ST</th>
                  <th className="pb-1 font-normal w-[15%]">IN</th>
                  <th className="pb-1 font-normal w-[15%]">OUT</th>
                  <th className="pb-1 font-normal w-[15%]">MV</th>
                  <th className="pb-1 font-normal w-1/5">NST</th>
                  <th className="pb-1 font-normal w-[10%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161B22]">
                {filteredRules.map((rule, displayIndex) => {
                  const originalIndex = localRules.findIndex(r => r.id === rule.id);
                  const index = originalIndex !== -1 ? originalIndex : displayIndex;
                  const isLastRule = lastRuleId === rule.id;
                  const currentReadSymbol = (tape[headPosition] || '_').trim() || '_';
                  const isMatching = rule.currentState.trim() === currentState.trim() && 
                                     (rule.readSymbol.trim() || '_') === currentReadSymbol;
                  const isActive = isMatching || isLastRule;

                  const isConflicting = conflicts.has(rule.id);
                  const curStateTrimmed = rule.currentState.trim();
                  const isUnreachable = unreachableStates.has(curStateTrimmed) && curStateTrimmed !== '';
                  const isHighlighted = highlightedRuleId === rule.id;
                  
                  const getStateClass = (s: string) => {
                    const isInitial = s === activeScenario?.initialState || s === 'q0';
                    const lower = s.toLowerCase();
                    const isHalt = lower.includes('halt') || lower.includes('accept') || lower.includes('reject') || s === 'H';
                    if (isHalt) {
                      return 'bg-red-950/40 text-red-400 border-red-500/20 focus:bg-red-950/60 focus:border-red-400/80';
                    }
                    if (isInitial) {
                      return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20 focus:bg-emerald-950/60 focus:border-emerald-400/80';
                    }
                    return 'bg-blue-950/40 text-blue-400 border-blue-500/20 focus:bg-blue-950/60 focus:border-blue-400/80';
                  };

                  const getSymbolClass = (s: string) => {
                    const sym = (s || '').trim();
                    if (sym === '_' || sym === '') {
                      return 'bg-neutral-900/50 text-text-faint border-neutral-800/40 focus:bg-neutral-800/50 focus:border-text-muted';
                    }
                    if (sym === '1') {
                      return 'bg-amber-950/40 text-amber-400 border-amber-500/20 focus:bg-amber-950/60 focus:border-amber-400/80';
                    }
                    if (sym === '0') {
                      return 'bg-orange-950/40 text-orange-400 border-orange-500/20 focus:bg-orange-950/60 focus:border-orange-400/80';
                    }
                    return 'bg-yellow-950/30 text-yellow-300 border-yellow-500/20 focus:bg-yellow-950/50 focus:border-yellow-300/80';
                  };

                  const getDirClass = (d: string) => {
                    if (d === 'L') {
                      return 'bg-purple-950/40 text-purple-400 border-purple-500/20 focus:bg-purple-950/60 focus:border-purple-400/80';
                    }
                    if (d === 'R') {
                      return 'bg-cyan-950/40 text-cyan-400 border-cyan-500/20 focus:bg-cyan-950/60 focus:border-cyan-400/80';
                    }
                    return 'bg-slate-900/50 text-slate-400 border-slate-800/30 focus:bg-slate-800/60 focus:border-slate-300';
                  };

                  return (
                    <tr 
                      key={rule.id} 
                      id={`rule-row-${rule.id}`}
                      draggable={!isRunning && !searchQuery && dragRowId === rule.id}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`transition-all duration-300 relative ${
                        draggedIndex === index
                          ? 'opacity-40 bg-[#161B22]/30 border-l-2 border-dashed border-primary-base'
                          : isHighlighted
                            ? 'bg-amber-500/25 ring-1 ring-amber-500/60 border-l-2 border-amber-500 shadow-md font-semibold scale-[1.01] z-10'
                            : isMatching 
                              ? 'bg-primary-base/20 border-l-4 border-primary-base shadow-md shadow-primary-base/30 font-bold scale-[1.01] z-10 duration-150' 
                              : (isLastRule ? 'bg-primary-base/5 shadow-sm' : 'hover:bg-bg-panel/40')
                      }`}
                    >
                      <td className="py-1.5 text-center text-text-faint select-none">
                        {!isRunning && !searchQuery ? (
                          <div 
                            onMouseDown={() => setDragRowId(rule.id)}
                            onMouseUp={() => setDragRowId(null)}
                            className="cursor-grab active:cursor-grabbing hover:text-text-primary transition-colors py-1"
                            title="Drag to reorder rules"
                          >
                            <GripVertical size={12} className="mx-auto" />
                          </div>
                        ) : (
                          <div title={isRunning ? "Cannot reorder while running" : "Cannot reorder while searching"}>
                            <GripVertical size={12} className="mx-auto opacity-20 cursor-not-allowed" />
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 text-center text-text-faint border-r border-[#161B22]/50 relative">
                        {isMatching && (
                          <>
                            <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary-base rounded-full animate-ping opacity-60" />
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary-base rounded-full shadow-[0_0_8px_var(--color-primary-base)]" />
                          </>
                        )}
                        {isConflicting ? (
                          <span 
                            className="absolute right-1 top-[5px] w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse cursor-help" 
                            title={conflictMessages[rule.id]} 
                          />
                        ) : isUnreachable ? (
                          <span 
                            className="absolute right-1 top-[5px] w-1.5 h-1.5 rounded-full bg-amber-500 cursor-help" 
                            title={`Unreachable state: No transitions lead to state "${curStateTrimmed}"`} 
                          />
                        ) : null}
                        <span className={isMatching ? 'text-primary-base font-bold pl-2.5' : ''}>{index + 1}</span>
                      </td>
                      <td className="py-1.5 pl-2 pr-1">
                        <AutocompleteInput 
                          value={rule.currentState} 
                          onChange={val => updateRule(rule.id, 'currentState', val)}
                          disabled={isRunning}
                          field="currentState"
                          title={isConflicting ? conflictMessages[rule.id] : isUnreachable ? `Unreachable State Warning: No transitions lead to state "${curStateTrimmed}". This code block cannot execute.` : undefined}
                          className={`w-full bg-transparent border focus:outline-none rounded px-2 py-0.5 text-[11px] font-mono leading-normal transition-all duration-150 ${
                            isConflicting 
                              ? 'border-red-500 text-red-200 bg-red-950/40 focus:bg-red-950/60 shadow-[0_0_4px_rgba(239,68,68,0.3)]' 
                              : isUnreachable 
                                ? 'border-amber-500 border-b-2 border-x-transparent border-t-transparent text-amber-300 bg-amber-950/20 focus:bg-amber-950/40' 
                                : getStateClass(rule.currentState)
                          }`}
                          suggestions={uniqueStates}
                          symbolAliases={symbolAliases}
                          stateColor={activeScenario?.stateColors?.[rule.currentState]}
                          stateColors={activeScenario?.stateColors}
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <AutocompleteInput 
                          value={rule.readSymbol} 
                          onChange={val => updateRule(rule.id, 'readSymbol', val)}
                          disabled={isRunning}
                          maxLength={1}
                          field="readSymbol"
                          title={isConflicting ? conflictMessages[rule.id] : undefined}
                          className={`w-full bg-transparent border focus:outline-none rounded px-1 py-0.5 text-center text-[11px] font-mono font-bold transition-all duration-150 ${
                            isConflicting 
                              ? 'border-red-500 text-red-200 bg-red-950/40 focus:bg-red-950/60 shadow-[0_0_4px_rgba(239,68,68,0.3)]' 
                              : getSymbolClass(rule.readSymbol)
                          }`}
                          suggestions={uniqueSymbols}
                          symbolAliases={symbolAliases}
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <AutocompleteInput 
                          value={rule.writeSymbol} 
                          onChange={val => updateRule(rule.id, 'writeSymbol', val)}
                          disabled={isRunning}
                          maxLength={1}
                          field="writeSymbol"
                          className={`w-full bg-transparent border border-transparent focus:outline-none rounded px-1 py-0.5 text-center text-[11px] font-mono font-bold transition-all duration-150 ${getSymbolClass(rule.writeSymbol)}`}
                          suggestions={uniqueSymbols}
                          symbolAliases={symbolAliases}
                        />
                      </td>
                      <td className="py-1.5 px-1">
                        <select 
                          value={rule.moveDirection}
                          onChange={e => updateRule(rule.id, 'moveDirection', e.target.value as Direction)}
                          disabled={isRunning}
                          className={`w-full bg-transparent border border-transparent focus:outline-none rounded px-1 py-0.5 text-center text-[11px] font-mono font-bold transition-all duration-150 cursor-pointer appearance-none ${getDirClass(rule.moveDirection)}`}
                        >
                          <option className="bg-[#0f141c] text-purple-400" value="L">L</option>
                          <option className="bg-[#0f141c] text-cyan-400" value="R">R</option>
                          <option className="bg-[#0f141c] text-slate-400" value="S">-</option>
                        </select>
                      </td>
                      <td className="py-1.5 pl-1 pr-2">
                        <AutocompleteInput 
                          value={rule.nextState} 
                          onChange={val => updateRule(rule.id, 'nextState', val)}
                          disabled={isRunning}
                          field="nextState"
                          className={`w-full bg-transparent border border-transparent focus:outline-none rounded px-2 py-0.5 text-[11px] font-mono leading-normal transition-all duration-150 ${getStateClass(rule.nextState)}`}
                          suggestions={uniqueStates}
                          symbolAliases={symbolAliases}
                          stateColor={activeScenario?.stateColors?.[rule.nextState]}
                          stateColors={activeScenario?.stateColors}
                        />
                      </td>
                      <td className="py-1 text-right pr-1">
                        <button onClick={() => removeRule(rule.id)} disabled={isRunning} className="text-red-900/50 hover:text-red-500 disabled:opacity-50 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
