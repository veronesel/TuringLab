import React, { useState, useRef, useEffect } from 'react';
import { useTMStore } from '../../store/tmStore';
import { useThemeStore } from '../../store/themeStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Terminal, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Plus, 
  Check, 
  FileCode, 
  Compass, 
  Activity, 
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Database,
  Wrench
} from 'lucide-react';
import { TMRule } from '../../types/tm';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  action?: {
    type: 'SET_RULES' | 'SET_TAPE' | 'SET_INITIAL_STATE';
    payload: any;
    applied?: boolean;
  };
}

interface TestCase {
  id: string;
  input: string;
  expected: 'accepted' | 'rejected' | 'halted';
  actual?: 'accepted' | 'rejected' | 'halted' | 'timeout';
  description: string;
  status?: 'pending' | 'running' | 'passed' | 'failed';
}

export function AiCopilotPanel() {
  const activeScenario = useTMStore(state => state.activeScenario);
  const rules = useTMStore(state => state.rules);
  const tape = useTMStore(state => state.tape);
  const headPosition = useTMStore(state => state.headPosition);
  const currentState = useTMStore(state => state.currentState);
  const status = useTMStore(state => state.status);
  
  const setRules = useTMStore(state => state.setRules);
  const injectTapePattern = useTMStore(state => state.injectTapePattern);
  const setInitialState = useTMStore(state => state.setInitialState);
  const resetMachine = useTMStore(state => state.resetMachine);
  const clearTapeAndResetHead = useTMStore(state => state.clearTapeAndResetHead);
  const autoFixUnreachableStates = useTMStore(state => state.autoFixUnreachableStates);
  const autoFixConnectUnreachableStates = useTMStore(state => state.autoFixConnectUnreachableStates);
  const autoFixSetInitialState = useTMStore(state => state.autoFixSetInitialState);

  const [activeTab, setActiveTab] = useState<'chat' | 'tests' | 'validate'>('chat');
  const [expandedFixId, setExpandedFixId] = useState(false);
  
  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I'm your **AI Turing Machine Copilot**. I can help you build transition rules, explain computation steps, diagnose infinite loops, or generate test cases.\n\nTry asking me: *'How do I create a palindrome detector?'* or click one of the quick actions below!",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Test Suite States
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Client-side Dry-Run Turing Machine Simulation
  const simulateTapeOnClient = (inputString: string): { status: 'accepted' | 'rejected' | 'halted' | 'timeout'; steps: number } => {
    const testTape: Record<number, string> = {};
    for (let i = 0; i < inputString.length; i++) {
      testTape[i] = inputString[i] === ' ' ? '_' : inputString[i];
    }

    let currentSimState = activeScenario?.initialState || 'q0';
    const acceptStates = new Set(activeScenario?.acceptStates || []);
    let simHead = 0;
    let steps = 0;
    const maxSteps = 400;

    while (steps < maxSteps) {
      if (acceptStates.has(currentSimState)) {
        return { status: 'accepted', steps };
      }

      const readSymbol = testTape[simHead] || '_';
      const matchingRule = rules.find(
        r => r.currentState === currentSimState && r.readSymbol === readSymbol && r.enabled !== false
      );

      if (!matchingRule) {
        return { 
          status: acceptStates.has(currentSimState) ? 'accepted' : 'rejected', 
          steps 
        };
      }

      testTape[simHead] = matchingRule.writeSymbol;
      currentSimState = matchingRule.nextState;

      if (matchingRule.moveDirection === 'R') simHead++;
      else if (matchingRule.moveDirection === 'L') simHead--;

      steps++;
    }

    return { status: 'timeout', steps };
  };

  // Validate Machine Engine
  const validateMachine = () => {
    const unreachable: string[] = [];
    const deadlocks: { state: string; type: 'severe' | 'partial'; missingSymbols?: string[] }[] = [];
    const nonDeterministic: { state: string; symbol: string; rules: TMRule[] }[] = [];
    
    // Gather all states
    const allStates = new Set<string>();
    const startState = activeScenario?.initialState || 'q0';
    allStates.add(startState);
    
    rules.forEach(rule => {
      allStates.add(rule.currentState);
      allStates.add(rule.nextState);
    });
    
    if (activeScenario?.acceptStates) {
      activeScenario.acceptStates.forEach(s => allStates.add(s));
    }

    // Helper to determine if a state is an accept/reject halting state
    const isAcceptOrRejectState = (state: string): boolean => {
      const s = state.toLowerCase();
      const isScenarioAccept = activeScenario?.acceptStates?.includes(state) || false;
      return (
        isScenarioAccept ||
        s.includes('accept') ||
        s.includes('reject') ||
        s.includes('error') ||
        s === 'h' ||
        s === 'halt' ||
        s.includes('halt')
      );
    };

    // 1. Unreachable States (Directed graph reachability from startState)
    const adj = new Map<string, Set<string>>();
    allStates.forEach(s => adj.set(s, new Set()));
    
    rules.forEach(rule => {
      if (rule.enabled !== false) {
        if (!adj.has(rule.currentState)) adj.set(rule.currentState, new Set());
        adj.get(rule.currentState)!.add(rule.nextState);
      }
    });

    const visited = new Set<string>();
    const queue = [startState];
    visited.add(startState);
    
    while (queue.length > 0) {
      const u = queue.shift()!;
      const neighbors = adj.get(u);
      if (neighbors) {
        for (const v of neighbors) {
          if (!visited.has(v)) {
            visited.add(v);
            queue.push(v);
          }
        }
      }
    }

    allStates.forEach(state => {
      if (!visited.has(state)) {
        unreachable.push(state);
      }
    });

    // 2. Deadlocks
    // Gather all symbols used on tape or in rules
    const allSymbols = new Set<string>(['_']); // Always include blank symbol
    rules.forEach(r => {
      allSymbols.add(r.readSymbol);
      allSymbols.add(r.writeSymbol);
    });
    Object.values(tape).forEach(sym => allSymbols.add(sym));

    // For every state, check its transition rules
    allStates.forEach(state => {
      // We only care about reachable states for deadlocks
      if (!visited.has(state)) return;

      if (isAcceptOrRejectState(state)) {
        // Correct termination/halt states - no deadlock
        return;
      }
      
      const stateRules = rules.filter(r => r.currentState === state && r.enabled !== false);
      
      if (stateRules.length === 0) {
        // Severe deadlock: reachable state that is not accept/reject, with 0 rules defined.
        deadlocks.push({ state, type: 'severe' });
      } else {
        // Check if there are missing transitions for symbols in the machine
        const definedSymbols = new Set(stateRules.map(r => r.readSymbol));
        const missing: string[] = [];
        allSymbols.forEach(sym => {
          if (!definedSymbols.has(sym)) {
            missing.push(sym);
          }
        });
        
        if (missing.length > 0) {
          deadlocks.push({ state, type: 'partial', missingSymbols: missing });
        }
      }
    });

    // 3. Non-deterministic Transitions
    const ruleGroups = new Map<string, TMRule[]>();
    rules.forEach(r => {
      if (r.enabled !== false) {
        const key = `${r.currentState}|||${r.readSymbol}`;
        if (!ruleGroups.has(key)) {
          ruleGroups.set(key, []);
        }
        ruleGroups.get(key)!.push(r);
      }
    });

    ruleGroups.forEach((groupRules, key) => {
      if (groupRules.length > 1) {
        const [state, symbol] = key.split('|||');
        nonDeterministic.push({ state, symbol, rules: groupRules });
      }
    });

    return {
      allStates: Array.from(allStates),
      unreachable,
      deadlocks,
      nonDeterministic
    };
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isGenerating) return;

    const userMsg: Message = {
      id: uuidv4(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          activeScenario,
          rules,
          tape,
          headPosition,
          currentState,
          status,
          chatHistory: messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })).slice(-8)
        })
      });

      if (!response.ok) throw new Error('Failed to fetch copilot response');
      const data = await response.json();

      const assistantMsg: Message = {
        id: uuidv4(),
        sender: 'assistant',
        text: data.response || "I couldn't process that. Let's try again.",
        timestamp: new Date(),
        action: data.action ? { ...data.action, applied: false } : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          sender: 'assistant',
          text: "Sorry, I ran into an error communicating with Gemini. Please verify your connection or try again.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyAiAction = (msgId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== msgId || !msg.action) return msg;

      const action = msg.action;
      if (action.type === 'SET_RULES') {
        const rulesWithIds = action.payload.map((r: any) => ({
          ...r,
          id: r.id || uuidv4(),
          enabled: true
        }));
        setRules(rulesWithIds);
      } else if (action.type === 'SET_TAPE') {
        clearTapeAndResetHead();
        setTimeout(() => {
          injectTapePattern(action.payload);
          resetMachine();
        }, 50);
      } else if (action.type === 'SET_INITIAL_STATE') {
        setInitialState(action.payload);
      }

      return {
        ...msg,
        action: { ...action, applied: true }
      };
    }));
  };

  const handleGenerateTests = async () => {
    if (!activeScenario) return;
    setIsGeneratingTests(true);

    try {
      const response = await fetch('/api/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: activeScenario, rules })
      });

      if (!response.ok) throw new Error('Failed to generate tests');
      const data = await response.json();

      if (data.testCases) {
        const formatted = data.testCases.map((tc: any) => ({
          id: uuidv4(),
          input: tc.input,
          expected: tc.expected,
          description: tc.description,
          status: 'pending'
        }));
        setTestCases(formatted);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingTests(false);
    }
  };

  const handleRunTests = async () => {
    if (testCases.length === 0) return;
    setIsRunningTests(true);

    // Simulate stepping through tests sequentially with small visual delays
    for (let i = 0; i < testCases.length; i++) {
      setTestCases(prev => prev.map((tc, idx) => idx === i ? { ...tc, status: 'running' } : tc));
      await new Promise(resolve => setTimeout(resolve, 300));

      const tc = testCases[i];
      const result = simulateTapeOnClient(tc.input);
      const isPass = result.status === tc.expected || (tc.expected === 'halted' && (result.status === 'accepted' || result.status === 'rejected'));

      setTestCases(prev => prev.map((item, idx) => idx === i ? {
        ...item,
        actual: result.status,
        status: isPass ? 'passed' : 'failed'
      } : item));
    }

    setIsRunningTests(false);
  };

  const loadTestInput = (inputVal: string) => {
    clearTapeAndResetHead();
    setTimeout(() => {
      injectTapePattern(inputVal);
      resetMachine();
    }, 50);
  };

  // Helper to safely format text with basic markdown support (bolding and code)
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Check for bullet list items
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Regular expressions for bold and code highlights
      const boldRegex = /\*\*(.*?)\*\*/g;
      const codeRegex = /`(.*?)`/g;

      let parts: React.ReactNode[] = [];
      let lastIndex = 0;
      
      // Combine regex replacement
      const segments: { start: number; end: number; type: 'bold' | 'code' | 'text'; text: string }[] = [];
      
      // Extract bold
      let match;
      while ((match = boldRegex.exec(cleanLine)) !== null) {
        segments.push({
          start: match.index,
          end: boldRegex.lastIndex,
          type: 'bold',
          text: match[1]
        });
      }
      
      // Reset regex index
      boldRegex.lastIndex = 0;
      
      // Extract inline code
      while ((match = codeRegex.exec(cleanLine)) !== null) {
        segments.push({
          start: match.index,
          end: codeRegex.lastIndex,
          type: 'code',
          text: match[1]
        });
      }
      
      codeRegex.lastIndex = 0;

      // Sort segments by starting index
      segments.sort((a, b) => a.start - b.start);

      // Reconstruct line with React tags
      let currentIdx = 0;
      segments.forEach((seg, segIdx) => {
        if (seg.start >= currentIdx) {
          // Add intervening plain text
          parts.push(<span key={`txt-${segIdx}`}>{cleanLine.substring(currentIdx, seg.start)}</span>);
          // Add styled node
          if (seg.type === 'bold') {
            parts.push(<strong key={`bld-${segIdx}`} className="font-extrabold text-text-primary">{seg.text}</strong>);
          } else if (seg.type === 'code') {
            parts.push(<code key={`cod-${segIdx}`} className="px-1 py-0.5 bg-[#161b22] border border-[#30363d] rounded text-[10px] text-primary-base font-mono font-bold">{seg.text}</code>);
          }
          currentIdx = seg.end;
        }
      });

      if (currentIdx < cleanLine.length) {
        parts.push(<span key="tail">{cleanLine.substring(currentIdx)}</span>);
      }

      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-[10.5px] leading-relaxed text-text-secondary mb-1">
            {parts.length > 0 ? parts : cleanLine}
          </li>
        );
      }

      return (
        <p key={lineIdx} className="text-[10.5px] leading-relaxed text-text-secondary mb-2">
          {parts.length > 0 ? parts : cleanLine}
        </p>
      );
    });
  };

  const getQuickPrompts = () => {
    if (!activeScenario) {
      return [
        { label: "Create palindrome machine", text: "How do I build a simple binary palindrome checker?" },
        { label: "Odd/even counter", text: "Suggest rules for counting if a binary number has an odd or even number of ones." },
        { label: "Turing basics", text: "Explain how transition rules work in a Turing Machine." }
      ];
    }
    return [
      { label: "Explain current machine", text: "Explain exactly how this Turing machine functions and what its transition logic computes." },
      { label: "Diagnose / Audit bugs", text: "Audit the active rules. Do you spot any infinite loops, redundant states, or missing transitions?" },
      { label: "Optimize state rules", text: "Optimize my active ruleset to use fewer transition rules or fewer total states." }
    ];
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-bg-surface font-sans">
      {/* Header Summary */}
      <div className="px-3 py-2 border-b border-border-main bg-bg-panel/40 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary-base animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-primary">Turing Copilot</span>
        </div>
        <div className="flex gap-1 bg-bg-element p-0.5 border border-border-main rounded-md w-52 shadow-inner">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1 text-[9px] font-extrabold rounded uppercase tracking-wider transition-all cursor-pointer text-center ${
              activeTab === 'chat' 
                ? 'bg-primary-base text-bg-base shadow-sm' 
                : 'text-text-muted hover:text-text-primary hover:bg-bg-panel/30'
            }`}
            title="Chat with AI Copilot"
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex-1 py-1 text-[9px] font-extrabold rounded uppercase tracking-wider transition-all cursor-pointer text-center ${
              activeTab === 'tests' 
                ? 'bg-primary-base text-bg-base shadow-sm' 
                : 'text-text-muted hover:text-text-primary hover:bg-bg-panel/30'
            }`}
            title="Automated Test Suite Runner"
          >
            Tests
          </button>
          <button
            onClick={() => setActiveTab('validate')}
            className={`flex-1 py-1 text-[9px] font-extrabold rounded uppercase tracking-wider transition-all cursor-pointer text-center ${
              activeTab === 'validate' 
                ? 'bg-primary-base text-bg-base shadow-sm' 
                : 'text-text-muted hover:text-text-primary hover:bg-bg-panel/30'
            }`}
            title="Validate Turing Machine Integrity"
          >
            Validate
          </button>
        </div>
      </div>

      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div className={`p-2.5 rounded-lg text-[10.5px] ${
                  msg.sender === 'user' 
                    ? 'bg-primary-base/15 border border-primary-base/20 text-text-primary rounded-tr-none' 
                    : 'bg-bg-panel border border-border-main text-text-secondary rounded-tl-none'
                }`}>
                  {renderMessageContent(msg.text)}

                  {/* Render special action panel if returned */}
                  {msg.action && (
                    <div className="mt-3 pt-2.5 border-t border-border-main flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-bold font-mono">
                        <Terminal size={11} className="text-primary-base" />
                        <span>ACTION: SET_{msg.action.type === 'SET_RULES' ? 'RULES' : msg.action.type === 'SET_TAPE' ? 'TAPE' : 'INITIAL_STATE'}</span>
                      </div>
                      
                      <button
                        onClick={() => applyAiAction(msg.id)}
                        disabled={msg.action.applied}
                        className={`w-full py-1 px-2 rounded font-bold text-[9.5px] flex items-center justify-center gap-1 transition-all ${
                          msg.action.applied
                            ? 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 cursor-not-allowed'
                            : 'bg-primary-base hover:bg-opacity-90 text-white shadow-md active:scale-[0.98] cursor-pointer'
                        }`}
                      >
                        {msg.action.applied ? (
                          <>
                            <Check size={11} />
                            APPLIED SUCCESSFULLY
                          </>
                        ) : (
                          <>
                            <Play size={10} fill="currentColor" />
                            EXECUTE ACTION IN SIMULATOR
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[7.5px] text-text-faint mt-1 px-1 font-mono">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex flex-col items-start max-w-[85%] mr-auto">
                <div className="bg-bg-panel border border-border-main p-3 rounded-lg text-xs flex items-center gap-2 text-text-muted">
                  <div className="w-1.5 h-1.5 bg-primary-base rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary-base rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary-base rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] font-mono text-text-faint">Gemini is processing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-1.5 bg-bg-panel/20 border-t border-border-main flex flex-wrap gap-1 shrink-0 overflow-x-auto select-none max-h-24">
            {getQuickPrompts().map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.text)}
                disabled={isGenerating}
                className="text-[8.5px] font-bold text-text-muted hover:text-text-primary bg-bg-panel border border-border-main px-2 py-1 rounded hover:border-primary-base transition-all flex items-center gap-1 active:scale-[0.97] cursor-pointer disabled:opacity-40"
              >
                <Lightbulb size={9} className="text-yellow-500/80" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-2 bg-bg-panel/30 border-t border-border-main shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1 bg-bg-panel border border-border-main focus-within:border-primary-base rounded px-2 py-1 transition-colors"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Ask Turing Copilot..."
                className="flex-1 bg-transparent border-0 outline-none text-[10.5px] text-text-primary placeholder:text-text-faint py-1"
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isGenerating}
                className="p-1 rounded bg-primary-base text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <Send size={11} />
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3">
          {/* Test Suite Controls */}
          <div className="flex gap-2 mb-3 shrink-0">
            <button
              onClick={handleGenerateTests}
              disabled={isGeneratingTests || isRunningTests || !activeScenario}
              className="flex-1 py-1.5 px-3 bg-primary-base hover:bg-opacity-90 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded text-[10px] font-bold flex items-center justify-center gap-1 shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {isGeneratingTests ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Suite...
                </>
              ) : (
                <>
                  <Database size={11} />
                  GENERATE SUITE
                </>
              )}
            </button>

            {testCases.length > 0 && (
              <button
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 rounded text-[10px] font-bold flex items-center justify-center gap-1 shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <Activity size={11} className={isRunningTests ? "animate-pulse" : ""} />
                RUN ALL TESTS
              </button>
            )}
          </div>

          {/* Test List Container */}
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
            {testCases.length === 0 ? (
              <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-6 bg-bg-panel/30 border border-border-main/50 rounded-xl">
                <Terminal size={32} className="opacity-15 text-text-muted mb-2.5" />
                <h4 className="text-[10.5px] font-extrabold text-text-secondary uppercase tracking-wider">No Tests Generated Yet</h4>
                <p className="text-[9.5px] text-text-faint max-w-[180px] mt-1 leading-relaxed">
                  {activeScenario 
                    ? "Generate a custom automated suite of test cases to verify your current Turing Machine transitions!"
                    : "Please load a preset scenario from the left library sidebar to generate test suites."}
                </p>
              </div>
            ) : (
              testCases.map((tc) => (
                <div 
                  key={tc.id} 
                  className={`p-2 bg-bg-panel border rounded-lg flex flex-col gap-1.5 transition-all ${
                    tc.status === 'passed' 
                      ? 'border-emerald-500/35 bg-emerald-500/5' 
                      : tc.status === 'failed' 
                        ? 'border-red-500/35 bg-red-500/5' 
                        : tc.status === 'running' 
                          ? 'border-primary-base/40 bg-primary-base/5 animate-pulse' 
                          : 'border-border-main'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-primary-base truncate">Tape: "{tc.input}"</span>
                      <p className="text-[9px] text-text-muted leading-tight">{tc.description}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {tc.status === 'pending' && (
                        <span className="text-[7.5px] font-extrabold px-1.5 py-0.5 rounded bg-bg-element border border-border-main text-text-muted uppercase tracking-wider">Pending</span>
                      )}
                      {tc.status === 'running' && (
                        <span className="text-[7.5px] font-extrabold px-1.5 py-0.5 rounded bg-primary-base/10 border border-primary-base/30 text-primary-base uppercase tracking-wider animate-pulse">Running</span>
                      )}
                      {tc.status === 'passed' && (
                        <span className="text-[7.5px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider flex items-center gap-0.5">
                          <CheckCircle size={9} />
                          Passed
                        </span>
                      )}
                      {tc.status === 'failed' && (
                        <span className="text-[7.5px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 uppercase tracking-wider flex items-center gap-0.5">
                          <XCircle size={9} />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Verification stats if run */}
                  {tc.actual && (
                    <div className="flex justify-between items-center bg-bg-surface/60 px-1.5 py-1 rounded text-[8.5px] font-mono border border-border-main/30">
                      <span className="text-text-muted">Expected: <strong className="text-text-primary capitalize">{tc.expected}</strong></span>
                      <span className="text-text-muted">Actual: <strong className={tc.status === 'passed' ? 'text-emerald-400 capitalize' : 'text-red-400 capitalize'}>{tc.actual}</strong></span>
                    </div>
                  )}

                  <div className="flex justify-end border-t border-border-main/40 pt-1.5 mt-0.5">
                    <button
                      onClick={() => loadTestInput(tc.input)}
                      className="text-[8.5px] font-bold text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus size={10} />
                      LOAD INTO SIMULATOR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'validate' && (() => {
        const valRes = validateMachine();
        const totalStates = valRes.allStates.length;
        const totalUnreachable = valRes.unreachable.length;
        const totalDeadlocks = valRes.deadlocks.length;
        const totalNonDeterministic = valRes.nonDeterministic.length;
        const hasAnyIssues = totalUnreachable > 0 || totalDeadlocks > 0 || totalNonDeterministic > 0;

        return (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 font-sans">
            {/* Bento-style summary cards */}
            <div className="grid grid-cols-3 gap-1.5 mb-3.5 shrink-0">
              <div className="bg-bg-panel/40 border border-border-main rounded-lg p-2 flex flex-col items-center justify-center text-center">
                <Compass size={14} className="text-primary-base mb-1" />
                <span className="text-[14px] font-extrabold text-text-primary leading-none">{totalUnreachable}</span>
                <span className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-1">Unreachable</span>
              </div>
              <div className="bg-bg-panel/40 border border-border-main rounded-lg p-2 flex flex-col items-center justify-center text-center">
                <HelpCircle size={14} className="text-amber-500 mb-1" />
                <span className="text-[14px] font-extrabold text-text-primary leading-none">{totalDeadlocks}</span>
                <span className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-1">Deadlocks</span>
              </div>
              <div className="bg-bg-panel/40 border border-border-main rounded-lg p-2 flex flex-col items-center justify-center text-center">
                <AlertTriangle size={14} className="text-red-400 mb-1" />
                <span className="text-[14px] font-extrabold text-text-primary leading-none">{totalNonDeterministic}</span>
                <span className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-1">Nondet.</span>
              </div>
            </div>

            {/* Scrolling results */}
            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
              {!hasAnyIssues ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                    <CheckCircle size={22} className="text-emerald-400" />
                  </div>
                  <h4 className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">Perfect Integrity!</h4>
                  <p className="text-[9.5px] text-text-muted max-w-[200px] mt-1.5 leading-relaxed">
                    All defined states are reachable, deterministic, and securely handled. No structural issues or deadlocks were detected.
                  </p>
                </div>
              ) : (
                <>
                  {/* Non-deterministic rules (Red Warning) */}
                  {totalNonDeterministic > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[9px] font-extrabold text-red-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1 h-3 bg-red-400 rounded-sm" />
                        Non-Deterministic Conflicts ({totalNonDeterministic})
                      </h4>
                      <div className="space-y-2">
                        {valRes.nonDeterministic.map((item, idx) => (
                          <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded-lg p-2 text-[10px] space-y-1.5 shadow-sm">
                            <div className="flex items-center gap-1.5 text-red-400 font-bold font-mono">
                              <XCircle size={12} />
                              <span>State "{item.state}" has multiple actions for Symbol "{item.symbol}"</span>
                            </div>
                            <div className="space-y-1 font-mono text-[9px] text-text-muted pl-3.5">
                              {item.rules.map((r, rIdx) => (
                                <div key={r.id} className="flex items-center gap-1 bg-bg-surface/50 px-1.5 py-0.5 rounded border border-border-main/50 text-[8.5px]">
                                  <span className="text-red-300">Rule {rIdx + 1}:</span>
                                  <span>{r.currentState} ➔ {r.nextState} (Write: {r.writeSymbol}, Move: {r.moveDirection})</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[8.5px] text-text-faint leading-tight pl-3.5">
                              Deterministic machines must have at most one rule per state-symbol pair. Please edit or delete duplicate rules.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deadlocks (Amber Warning) */}
                  {totalDeadlocks > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[9px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1 h-3 bg-amber-500 rounded-sm" />
                        Deadlock & Halt Hazards ({totalDeadlocks})
                      </h4>
                      <div className="space-y-2">
                        {valRes.deadlocks.map((item, idx) => (
                          <div key={idx} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2 text-[10px] space-y-1.5 shadow-sm">
                            <div className="flex items-center gap-1.5 text-amber-500 font-bold font-mono">
                              <AlertTriangle size={12} />
                              <span>
                                {item.type === 'severe' 
                                  ? `Absolute Deadlock: State "${item.state}"` 
                                  : `Halt Hazard: State "${item.state}"`}
                              </span>
                            </div>
                            <p className="text-[9px] text-text-muted leading-relaxed pl-3.5">
                              {item.type === 'severe' 
                                ? `This state is reachable but has NO outgoing transition rules defined, and is not an accept or reject state. The machine will freeze without accepting or rejecting.`
                                : `This state is missing transitions for symbol(s): ${item.missingSymbols?.map(s => `"${s}"`).join(', ')}. If any of these symbols are read in state "${item.state}", the machine will halt implicitly without a valid termination status.`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unreachable States (Gray Info) */}
                  {totalUnreachable > 0 && (() => {
                    // Find which of these unreachable states has the most outgoing rules defined
                    let bestInitialStateCandidate = '';
                    let bestInitialStateCount = 0;
                    valRes.unreachable.forEach(us => {
                      const usRulesCount = rules.filter(r => r.currentState === us).length;
                      if (usRulesCount > bestInitialStateCount) {
                        bestInitialStateCount = usRulesCount;
                        bestInitialStateCandidate = us;
                      }
                    });

                    return (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1 h-3 bg-text-muted rounded-sm" />
                            Unreachable States ({totalUnreachable})
                          </h4>
                          <button
                            onClick={() => {
                              setExpandedFixId(!expandedFixId);
                            }}
                            className={`flex items-center gap-1 px-1.5 py-0.5 text-[8.5px] font-bold rounded transition-all cursor-pointer shadow-sm select-none ${
                              expandedFixId 
                                ? 'bg-text-muted text-bg-base hover:bg-text-muted/90' 
                                : 'bg-primary-base text-bg-base hover:bg-primary-base/90'
                            }`}
                            title="Open quick-fix assistant"
                          >
                            <Wrench size={10} />
                            {expandedFixId ? 'Cancel' : 'Auto-Fix'}
                          </button>
                        </div>

                        {/* Expandable Safe Quick-Fix Options */}
                        {expandedFixId && (
                          <div className="bg-bg-panel/90 border border-border-main rounded-lg p-2.5 space-y-2.5 mt-1 shadow-md animate-fade-in text-[10px]">
                            <div className="flex justify-between items-center border-b border-border-main pb-1">
                              <span className="font-bold text-text-primary flex items-center gap-1 text-[9.5px]">
                                <Wrench size={11} className="text-primary-base animate-pulse" />
                                Turing Doctor Quick-Fix
                              </span>
                              <button 
                                onClick={() => setExpandedFixId(false)}
                                className="text-[8px] text-text-muted hover:text-text-primary underline cursor-pointer"
                              >
                                Close
                              </button>
                            </div>
                            
                            <p className="text-[8.5px] text-text-muted leading-relaxed">
                              Choose a resolution strategy. Rules and layout snapshots are recorded so you can undo at any time!
                            </p>
                            
                            <div className="space-y-1.5">
                              {/* Option 1: Set Initial State (If candidate exists) */}
                              {bestInitialStateCandidate && (
                                <button
                                  onClick={() => {
                                    autoFixSetInitialState(bestInitialStateCandidate);
                                    setExpandedFixId(false);
                                  }}
                                  className="w-full text-left p-1.5 rounded border border-primary-base/20 bg-primary-base/5 hover:bg-primary-base/10 transition-colors group cursor-pointer"
                                >
                                  <div className="font-bold text-primary-base flex items-center gap-1 text-[9px]">
                                    <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                    1. Set "{bestInitialStateCandidate}" as Initial State
                                  </div>
                                  <div className="text-[8px] text-text-muted pl-3 mt-0.5 leading-normal">
                                    Recommended: This state already has {bestInitialStateCount} transitions. Making it initial connects states instantly!
                                  </div>
                                </button>
                              )}

                              {/* Option 2: Connect with Rules */}
                              <button
                                onClick={() => {
                                  autoFixConnectUnreachableStates();
                                  setExpandedFixId(false);
                                }}
                                className="w-full text-left p-1.5 rounded border border-border-main bg-bg-panel/40 hover:bg-bg-panel/70 hover:border-text-muted transition-colors group cursor-pointer"
                              >
                                <div className="font-bold text-text-primary flex items-center gap-1 text-[9px]">
                                  <ArrowRight size={10} className="text-text-muted group-hover:translate-x-0.5 transition-transform" />
                                  {bestInitialStateCandidate ? '2' : '1'}. Connect with Transition Rules
                                </div>
                                <div className="text-[8px] text-text-muted pl-3 mt-0.5 leading-normal">
                                  Safe: Adds dummy transition rules from "{activeScenario?.initialState || 'q0'}" to keep all your states and work intact.
                                </div>
                              </button>

                              {/* Option 3: Prune (Delete) States & Rules */}
                              <button
                                onClick={() => {
                                  autoFixUnreachableStates();
                                  setExpandedFixId(false);
                                }}
                                className="w-full text-left p-1.5 rounded border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-colors group cursor-pointer"
                              >
                                <div className="font-bold text-red-500 flex items-center gap-1 text-[9px]">
                                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                                  {bestInitialStateCandidate ? '3' : '2'}. Prune (Delete) Unreachable States
                                </div>
                                <div className="text-[8px] text-text-muted pl-3 mt-0.5 leading-normal">
                                  Destructive: Permanently removes the {totalUnreachable} isolated states and their transition rules from the canvas.
                                </div>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          {valRes.unreachable.map((state, idx) => (
                            <div key={idx} className="bg-bg-panel/40 border border-border-main rounded-lg p-2 text-[10px] space-y-1 shadow-sm">
                              <div className="flex items-center gap-1.5 text-text-secondary font-bold font-mono">
                                <Compass size={12} className="text-text-muted" />
                                <span>State "{state}" is isolated</span>
                              </div>
                              <p className="text-[9px] text-text-muted leading-relaxed pl-3.5">
                                No active transition rule or path leads from the initial state <strong className="text-text-primary">"{activeScenario?.initialState || 'q0'}"</strong> to this state. It will never be visited during computation.
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
