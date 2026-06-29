import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  X, 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Terminal, 
  HelpCircle, 
  Activity, 
  Settings2,
  List,
  CheckCircle2,
  Info,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Tag,
  Music,
  Play,
  Pause,
  BarChart4,
  RotateCcw
} from 'lucide-react';

export interface HelpSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const HelpSidebar: React.FC<HelpSidebarProps> = ({ isOpen, setIsOpen }) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'capabilities'>('docs');
  const [width, setWidth] = useState(420); // slightly wider default for better readability
  const isResizingRef = useRef(false);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = window.innerWidth - e.clientX;
      // Constrain sidebar width between 350px and 850px for dense info
      if (newWidth >= 350 && newWidth <= 850) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      id="help-sidebar-container"
      style={{ width: `${width}px` }}
      className="fixed right-0 top-12 bottom-0 bg-[#0d1117] border-l border-[#30363d] flex flex-col z-50 transition-shadow duration-300 shadow-[-15px_0_40px_rgba(0,0,0,0.7)] select-none"
    >
      {/* Horizontal Drag Resize Handle */}
      <div 
        id="help-sidebar-drag-handle"
        onMouseDown={startResize}
        className="absolute top-0 bottom-0 left-0 w-2.5 cursor-col-resize hover:bg-sky-500/50 transition-colors z-50 group flex items-center justify-center border-r border-[#21262d]"
        title="Drag left/right to resize sidebar"
      >
        <div className="w-[4px] h-12 bg-[#30363d] group-hover:bg-sky-400 rounded-full transition-colors" />
      </div>

      {/* Header Container */}
      <div className="pl-6 pr-4 py-3.5 bg-[#161b22] border-b border-[#30363d] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen id="help-sidebar-icon" size={16} className="text-sky-400" />
          <div>
            <span className="text-[10px] font-extrabold text-sky-400 tracking-wider block">TURING METAVERSE</span>
            <span className="text-[8px] text-[#8b949e] uppercase tracking-widest font-mono">Interactive IDE Companion</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 select-none">
          <span className="text-[8px] font-mono text-sky-400 px-1.5 py-0.5 bg-[#21262d] rounded border border-sky-500/10" title="Active width in pixels">
            {width} px
          </span>
          <button 
            id="close-help-sidebar-btn"
            onClick={() => setIsOpen(false)} 
            className="text-text-muted hover:text-text-primary hover:bg-[#30363d] p-1 rounded transition-colors"
            title="Hide Sidebar"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tab Navigation Controls */}
      <div className="grid grid-cols-2 shrink-0 bg-[#0d1117] border-b border-[#21262d] p-1 gap-1">
        <button
          id="help-tab-docs"
          onClick={() => setActiveTab('docs')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded transition-all duration-150 ${
            activeTab === 'docs' 
              ? 'bg-[#1f2937] text-white border border-[#3b82f6]/30 shadow-inner' 
              : 'text-text-muted hover:text-text-secondary hover:bg-[#161b22]'
          }`}
        >
          <Info size={12} className={activeTab === 'docs' ? 'text-sky-400' : 'text-text-muted'} />
          <span>General Manual</span>
        </button>
        <button
          id="help-tab-capabilities"
          onClick={() => setActiveTab('capabilities')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded transition-all duration-150 ${
            activeTab === 'capabilities' 
              ? 'bg-[#1f2937] text-white border border-[#3b82f6]/30 shadow-inner' 
              : 'text-text-muted hover:text-text-secondary hover:bg-[#161b22]'
          }`}
        >
          <Layers size={12} className={activeTab === 'capabilities' ? 'text-sky-400' : 'text-text-muted'} />
          <span>Simulator Engine Caps</span>
        </button>
      </div>
      
      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 text-xs text-[#c9d1d9] space-y-6 select-text scrollbar-thin scrollbar-thumb-gray-700">
        {activeTab === 'docs' ? (
          /* DOCS/GUIDE TAB */
          <div className="space-y-6">
            
            {/* Quick Context Block */}
            <div className="bg-gradient-to-r from-sky-950/20 to-indigo-950/20 border border-sky-900/40 p-3.5 rounded-lg">
              <h4 className="text-sky-400 font-bold text-[11px] mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles size={11} className="text-sky-400 animate-spin-slow" />
                <span>WHAT IS A TURING MACHINE?</span>
              </h4>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                Published by mathematician <span className="text-text-primary font-medium">Alan Turing</span> in 1936, a Turing Machine is a simple, abstract device that manipulates symbols on a strip of tape according to a table of rules. Despite its extreme minimalism, the machine successfully represents the ultimate upper limit of general-purpose computability: anything any software can solve on modern supercomputers can be simulated on this physical tape!
              </p>
            </div>

            {/* Academic Turing Components */}
            <div>
              <h3 className="text-[11px] font-extrabold text-[#f0f6fc] tracking-wider uppercase mb-3 border-b border-[#30363d] pb-1 flex items-center gap-1">
                <Cpu size={12} className="text-[#3b82f6]" />
                <span>Academic Core Components</span>
              </h3>
              <div className="space-y-3">
                <div className="pl-3 border-l-2 border-sky-500/50">
                  <strong className="text-sky-400 block mb-0.5 text-[11px]">1. The Infinite Tape</strong>
                  <p className="text-[11px] leading-relaxed text-[#8b949e]">
                    Acts as the computer's memory. Divided into sequential discrete cells containing discrete letters or blank spaces represented by the underscore character (<code className="font-mono bg-[#161b22] px-1 rounded text-emerald-400 font-semibold">_</code>).
                  </p>
                </div>

                <div className="pl-3 border-l-2 border-indigo-500/50">
                  <strong className="text-indigo-400 block mb-0.5 text-[11px]">2. Read/Write Head</strong>
                  <p className="text-[11px] leading-relaxed text-[#8b949e]">
                    An active cursor hovering over a cell. It can parse values, write over them dynamically, and shift mechanical coordinates <span className="text-[#f0f6fc] font-semibold bg-[#21262d] px-1 rounded text-[10px]">Left (L)</span>, <span className="text-[#f0f6fc] font-semibold bg-[#21262d] px-1 rounded text-[10px]">Right (R)</span>, or <span className="text-[#f0f6fc] font-semibold bg-[#21262d] px-1 rounded text-[10px]">Stay (S)</span>.
                  </p>
                </div>

                <div className="pl-3 border-l-2 border-purple-500/50">
                  <strong className="text-purple-400 block mb-0.5 text-[11px]">3. State Register</strong>
                  <p className="text-[11px] leading-relaxed text-[#8b949e]">
                    A register representing the memory block context of the controller. Begins state sequences at an initial state (usually <code className="font-mono bg-[#161b22] p-0.5 rounded text-sky-400 font-semibold">q0</code>) and immediately halts upon reaching any defined <span className="text-emerald-400 font-semibold font-mono bg-emerald-500/10 border border-emerald-500/20 px-1 rounded">Accept State</span>.
                  </p>
                </div>

                <div className="pl-3 border-l-2 border-amber-500/50">
                  <strong className="text-amber-400 block mb-0.5 text-[11px]">4. State Transition Algebra</strong>
                  <p className="text-[11px] leading-relaxed text-[#8b949e]">
                    The mathematical rules table. For each CPU tick, the machine evaluates instructions matching the current state and symbol:
                    <br />
                    <span className="font-mono text-emerald-400 block bg-[#161b22]/70 p-2 mt-1.5 rounded text-[10.5px] text-center border border-[#30363d] shadow-inner select-all">
                      [Current State, Read Symbol] &rarr; [Write Symbol, Move, Next State]
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Platform layout guide */}
            <div>
              <h3 className="text-[11px] font-extrabold text-[#f0f6fc] tracking-wider uppercase mb-3 border-b border-[#30363d] pb-1 flex items-center gap-1">
                <Settings2 size={12} className="text-indigo-400" />
                <span>Workspace Layout Mastery</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5.5 h-5.5 rounded bg-[#1f2937] flex items-center justify-center text-[10px] font-mono font-bold text-sky-400 shrink-0 border border-[#30363d] shadow">
                    L
                  </div>
                  <div>
                    <span className="font-bold text-[#f0f6fc] text-[11px] block">Left Panel &mdash; Problem Repository</span>
                    <p className="text-[#8b949e] leading-relaxed text-[10.5px] mt-0.5">
                      Explore active pre-configured Turing problems (unary math, busy beavers, mirror patterns). Below it resides the conversational **AI Scenario Maker** to instantly construct state-diagram nodes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5.5 h-5.5 rounded bg-[#1f2937] flex items-center justify-center text-[10px] font-mono font-bold text-indigo-400 shrink-0 border border-[#30363d] shadow">
                    T
                  </div>
                  <div>
                    <span className="font-bold text-[#f0f6fc] text-[11px] block">Top Deck &mdash; Interactive Ribbon</span>
                    <p className="text-[#8b949e] leading-relaxed text-[10.5px] mt-0.5">
                      The dynamic live tape simulator with step-forward/backward debugging cycles, run-speed frequency (Hertz slider), initial value pattern injector tools, and direct coordinate bookmarks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5.5 h-5.5 rounded bg-[#1f2937] flex items-center justify-center text-[10px] font-mono font-bold text-purple-400 shrink-0 border border-[#30363d] shadow">
                    C
                  </div>
                  <div>
                    <span className="font-bold text-[#f0f6fc] text-[11px] block">Center Panel &mdash; State Graph Canvas</span>
                    <p className="text-[#8b949e] leading-relaxed text-[10.5px] mt-0.5">
                      Renders state transitions dynamically as a sleek directed graph. Elements light up corresponding to execution states. Includes dragging nodes to layout spatial layouts recursively.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5.5 h-5.5 rounded bg-[#1f2937] flex items-center justify-center text-[10px] font-mono font-bold text-amber-400 shrink-0 border border-[#30363d] shadow">
                    R
                  </div>
                  <div>
                    <span className="font-bold text-[#f0f6fc] text-[11px] block">Right Panel &mdash; Multifunction Sidebar</span>
                    <p className="text-[#8b949e] leading-relaxed text-[10.5px] mt-0.5">
                      Contains several tabs: **Rules** for direct cell transitions; **Stats** for hardware charts; **Log** for tracing head state coordinates; and **Copilot** for real-time AI design assistance, live actions, and an automated test suite runner.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Creator vs meta-builder comparison */}
            <div className="bg-[#161b22]/60 border border-[#30363d] py-3.5 px-4 space-y-3.5 rounded-lg">
              <h3 className="text-[10.5px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-[#30363d]/60 pb-1.5">
                <span>🧠 WORKSPACE ARCHITECTURE CLARIFICATION</span>
              </h3>
              <p className="text-[10px] text-[#8b949e] leading-relaxed">
                It is crucial to understand the distinct roles of the two AI systems present in this workspace environment:
              </p>
              <div className="space-y-3 font-sans">
                <div className="bg-[#0d1117] p-3 rounded border border-[#21262d] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-400 text-[6.5px] font-extrabold px-1.5 py-0.5 rounded-bl tracking-wider">META-LEVEL</div>
                  <span className="text-[10px] font-bold text-[#f0f6fc] block">1. AI Studio Build (Antigravity Agent)</span>
                  <p className="text-[9.5px] text-[#8b949e] mt-1 leading-relaxed">
                    This is the external engineering environment where you are speaking directly to a coding assistant to build, style, debug, and expand software features of this React app.
                  </p>
                </div>
                
                <div className="bg-[#1b222c] p-3 rounded border border-sky-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-sky-500/20 text-sky-400 text-[6.5px] font-extrabold px-1.5 py-0.5 rounded-bl tracking-wider">SANDBOX-LEVEL</div>
                  <span className="text-[10px] font-bold text-sky-400 block">2. In-App AI Scenario & Rule Creator</span>
                  <p className="text-[9.5px] text-[#8b949e] mt-1 leading-relaxed">
                    This is the internal simulation utility found in the UI sidebars. It calls backend endpoints to construct localized state logic, coordinates, and tapes for execution tests on our virtual CPU deck.
                  </p>
                </div>
              </div>
            </div>

            {/* Inspirational Quote */}
            <div className="text-center italic text-[#8b949e] text-[10px] pt-4.5 border-t border-[#21262d] space-y-1">
              <p>"We can only see a short distance ahead, but we can see plenty there that needs to be done."</p>
              <span className="text-[8.5px] font-mono tracking-widest not-italic block mt-1.5 text-sky-500/75">&mdash; ALAN TURING (1950)</span>
            </div>

          </div>
        ) : (
          /* "CAPABILITIES" TAB: RECOLLECTING ALL SYSTEM ADVANCED simulator CAPABILITIES WITH GRAPHICS GRAPHICS SNIPPETS */
          <div className="space-y-6">
            
            <div className="text-center py-2.5 border-b border-[#21262d] mb-4">
              <h2 className="text-xs font-extrabold text-sky-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Cpu size={14} className="text-sky-400 animate-spin-slow" />
                <span>Simulation Stack Capabilities</span>
              </h2>
              <p className="text-[9.5px] text-text-muted mt-1 leading-relaxed">
                Touring the full mathematical hardware features of our local Turing Sandbox
              </p>
            </div>

            {/* 1. Dynamic Infinite Tape Engine */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded bg-sky-500/10 flex items-center justify-center border border-sky-500/20 shrink-0">
                  <Cpu size={12} className="text-sky-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-[#f0f6fc] leading-tight">1. Dynamic Infinite Tape Engine</h4>
                  <span className="text-[8px] uppercase tracking-widest text-[#8b949e] block mt-0.5">MEMORY BLOCK</span>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                A responsive memory storage component supporting live slide animations, clock frequencies up to infinite frames, explicit initial value injection strings, and custom blank cell placeholders (<code className="font-mono text-emerald-400 font-semibold bg-[#0d1117] p-0.5 rounded">_</code>).
              </p>
              
              {/* Graphics Snippet: Simulated Tape Controls */}
              <div className="p-2.5 bg-[#0d1117] border border-[#21262d] rounded font-mono text-[9.5px] space-y-2">
                <div className="flex justify-between items-center text-[7.5px] text-text-faint uppercase tracking-wider">
                  <span>TAP DECK MEMORY</span>
                  <span className="text-sky-400">CLK: 50.0 Hz</span>
                </div>
                <div className="flex items-center justify-center gap-1 py-1">
                  <span className="w-6 h-6 flex items-center justify-center bg-[#161b22] border border-[#30363d] rounded text-[#8b949e]">_</span>
                  <span className="w-6 h-6 flex items-center justify-center bg-[#161b22] border border-[#30363d] rounded text-sky-400 font-bold">1</span>
                  <span className="w-6 h-6 flex items-center justify-center bg-sky-500/20 border-2 border-sky-400 rounded text-sky-400 font-extrabold animate-pulse">0</span>
                  <span className="w-6 h-6 flex items-center justify-center bg-[#161b22] border border-[#30363d] rounded text-emerald-400">1</span>
                  <span className="w-6 h-6 flex items-center justify-center bg-[#161b22] border border-[#30363d] rounded text-[#8b949e]">_</span>
                </div>
                <div className="flex justify-between items-center text-[8px] text-[#8b949e] font-sans">
                  <span>&larr; Infinite Cells</span>
                  <span className="text-sky-400 font-bold text-[8.5px] animate-pulse">▲ Head @ cell [2]</span>
                  <span>Infinite Cells &rarr;</span>
                </div>
              </div>
            </div>

            {/* 2. State Design Graph & Layout Physics */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                  <Activity size={12} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-[#f0f6fc] leading-tight">2. Directed Graph Customizer</h4>
                  <span className="text-[8px] uppercase tracking-widest text-[#8b949e] block mt-0.5">STATE CANVAS</span>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                Translates abstract algebraic rulesets into responsive node networks. States customizable with hex colors (<code className="font-mono text-indigo-400 bg-[#0d1117] px-0.5 rounded">stateColors</code>), semantic labels (<code className="font-mono text-indigo-400 bg-[#0d1117] px-0.5 rounded">stateLabels</code>), and manual drag coordinates.
              </p>

              {/* Graphics Snippet: Simulated State Bubble & Transition */}
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded overflow-hidden">
                <div className="flex justify-between items-center text-[8px] font-mono text-text-faint pb-1.5 border-b border-[#21262d]">
                  <span>NODE MATRIX CANVAS</span>
                  <span className="text-emerald-400 font-bold">DRAGGABLE: ON</span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-[10px] font-mono">
                  {/* Bubble 1 */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border-2 border-blue-500/80 flex items-center justify-center text-blue-400 font-extrabold shadow-[0_0_10px_rgba(59,130,246,0.3)] text-[9px]">
                      q0
                    </div>
                    <span className="text-[7.5px] text-[#8b949e] mt-1.5 font-bold uppercase tracking-wide">Start Core</span>
                  </div>
                  {/* Transition line */}
                  <div className="flex-1 flex flex-col items-center px-1">
                    <span className="text-[7.5px] text-indigo-400 font-bold mb-0.5 bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d]">1 &rarr; 0, L</span>
                    <div className="w-full h-[1.5px] bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 relative">
                      <div className="absolute top-[-1.5px] right-0 border-t-[2.5px] border-b-[2.5px] border-l-[4.5px] border-l-purple-500 border-t-transparent border-b-transparent" />
                    </div>
                  </div>
                  {/* Bubble 2 */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400 text-[9px]">
                      q_sub
                    </div>
                    <span className="text-[7.5px] text-[#8b949e] mt-1.5 font-sans">Shift Stage</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Debugging Time Travel HUD */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <RotateCcw size={12} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-[#f0f6fc] leading-tight">3. Historical Walk & Checkpoints</h4>
                  <span className="text-[8px] uppercase tracking-widest text-[#8b949e] block mt-0.5">TIME TRAVEL DEBUGGING</span>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                Chronicles every single transition calculation cell-by-cell. Easily jump to designated checkpoints or rollback state tape memory backward to audit algorithm path branches.
              </p>

              {/* Graphics Snippet: Simulated Timeline Progress Tracker */}
              <div className="p-2.5 bg-[#0d1117] border border-[#21262d] rounded space-y-2">
                <div className="flex justify-between items-center text-[7.5px] font-mono text-text-faint">
                  <span>HISTORY TIMELINE</span>
                  <span className="text-amber-400 font-bold">Step 12 / 24</span>
                </div>
                
                {/* Visual slider tracker */}
                <div className="relative pt-1">
                  <div className="flex mb-1 items-center justify-between text-[7px] font-mono text-[#8b949e]">
                    <span>0 (Init)</span>
                    <span className="text-sky-400 font-semibold uppercase bg-sky-500/10 px-1 rounded">Active</span>
                    <span>24 (Halt)</span>
                  </div>
                  <div className="overflow-hidden h-1.5 text-xs flex rounded bg-[#21262d]">
                    <div style={{ width: "50%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-indigo-500" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-1 border-t border-[#21262d] justify-center">
                  <button className="p-1 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]">
                    <ArrowLeft size={10} />
                  </button>
                  <span className="font-mono text-[9px] text-[#f0f6fc] bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">STEP BY STEP</span>
                  <button className="p-1 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]">
                    <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Cell Bookmarks & Cell Comments */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <Bookmark size={12} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-[#f0f6fc] leading-tight">4. Coordinate Tape Bookmarks</h4>
                  <span className="text-[8px] uppercase tracking-widest text-[#8b949e] block mt-0.5">MEMORY BLOCK REMARKS</span>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                Annotate cell indices of interest on your tape. Bookmark specific coordinates (e.g. <code className="font-mono bg-[#0d1117] text-sky-400 px-0.5 rounded">cell[4]="Start marker"</code>) to visualize computational benchmarks in complex multi-pass algorithms.
              </p>

              {/* Graphics Snippet: Bookmarks list */}
              <div className="p-2.5 bg-[#0d1117] border border-[#21262d] rounded space-y-1.5 font-mono text-[9px]">
                <div className="text-[7.5px] text-[#8b949e] uppercase tracking-widest block font-bold">Active Memory Markers</div>
                <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] p-1.5 rounded-md hover:bg-[#21262d] transition-colors">
                  <Bookmark size={9} className="text-emerald-400 shrink-0 fill-emerald-400" />
                  <span className="text-sky-400 font-bold block shrink-0">CELL [4]:</span>
                  <span className="text-[#8b949e] truncate block">"End of palindrome checking string"</span>
                </div>
              </div>
            </div>

            {/* 5. Dynamic Tape Symbol Aliasing */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                  <Tag size={12} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-[#f0f6fc] leading-tight">5. Semantic Character Aliasing</h4>
                  <span className="text-[8px] uppercase tracking-widest text-[#8b949e] block mt-0.5">LEXICAL ALIASES</span>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                Assign human-readable semantic terms to abstract tape keys (e.g., interpret the cell key <code className="font-mono bg-[#0d1117] text-sky-400 px-0.5 rounded">A</code> as <span className="font-semibold text-sky-400">"Header start"</span> or <code className="font-mono bg-[#0d1117] text-[#8b949e] px-0.5 rounded">_</code> as <span className="font-semibold text-[#8b949e]">"Null void"</span>).
              </p>

              {/* Graphics Snippet: Aliases Table */}
              <div className="p-2 bg-[#0d1117] border border-[#21262d] rounded overflow-hidden">
                <table className="w-full text-[8.5px] font-mono text-left">
                  <thead>
                    <tr className="border-b border-[#21262d] text-text-faint text-[7.5px] uppercase">
                      <th className="pb-1">SYMBOL</th>
                      <th className="pb-1">ALIAS INJECTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#21262d]/40">
                      <td className="py-1 text-emerald-400 font-bold font-mono">1</td>
                      <td className="py-1 text-[#8b949e] font-sans">Increment Bit</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-red-400 font-bold font-mono">#</td>
                      <td className="py-1 text-[#8b949e] font-sans">Delimiter Tag</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. Static Conflict HUD & Linter Warning Rules */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                  <AlertTriangle size={12} className="text-red-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-[#f0f6fc] leading-tight">6. Matrix Diagnostics & Linter warning</h4>
                  <span className="text-[8px] uppercase tracking-widest text-[#8b949e] block mt-0.5">COMPILER SAFETY SANITY CHECKS</span>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                Highlights <span className="text-red-400 font-semibold">Non-deterministic Overlaps</span> (multiple rules matching identical states and read cells) and <span className="text-amber-400 font-semibold">Unreachable states</span> (states not referenced by any nextState vector).
              </p>

              {/* Graphics Snippet: Warning HUD */}
              <div className="p-2.5 bg-red-950/20 border border-red-900/40 rounded-md text-[9.5px] space-y-2">
                <div className="flex items-center gap-1 text-red-400 font-bold">
                  <AlertTriangle size={11} className="shrink-0" />
                  <span className="uppercase tracking-widest text-[7.5px] font-mono">NON-DETERMINISM ALARM TRIGGERED</span>
                </div>
                <div className="text-[#8b949e] text-[9px] leading-relaxed bg-[#0d1117] p-2 rounded border border-red-900/10">
                  State <code className="text-blue-400 font-normal">q0</code> has overlapping rules matching key <code className="text-amber-400 font-normal">"1"</code>.
                  <div className="mt-1 pl-2 border-l border-red-500/30 font-mono text-[8.5px] text-text-faint space-y-0.5">
                    <div>#1 &rarr; Write "0", Next q1</div>
                    <div className="text-red-400 font-semibold">#4 &rarr; Write "1", Next q2 (Overlap Conflict!)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Refactoring State Renovator */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <RefreshCw size={12} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-[#f0f6fc] leading-tight">7. Dynamic Token Refactoring (Renovator)</h4>
                  <span className="text-[8px] uppercase tracking-widest text-[#8b949e] block mt-0.5">MASS TOKEN REPLACEMENTS</span>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                Easily rename and refactor state designations (e.g. from <code className="font-mono bg-[#0d1117] text-indigo-400 px-0.5 rounded">q0</code> to <code className="font-mono bg-[#0d1117] text-emerald-400 px-0.5 rounded">startup_evaluate</code>) globally across your entire matrix dynamically without introducing syntax bugs.
              </p>

              {/* Graphics Snippet: Renovative State Flow */}
              <div className="grid grid-cols-5 gap-1.5 items-center bg-[#0d1117] border border-[#21262d] rounded-md p-2.5 text-center text-[10px] font-mono shadow-inner select-none">
                <div className="col-span-2 py-1 bg-red-500/10 border border-red-500/25 rounded text-red-400 font-bold">
                  q_start
                </div>
                <div className="text-sky-500 text-[8px] font-sans font-extrabold uppercase animate-pulse">REFACTORED TO</div>
                <div className="col-span-2 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded text-emerald-400 font-bold">
                  init_scan
                </div>
              </div>
            </div>

            {/* 8. Co-Design AI Genie & Copilot Suite */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                  <Sparkles size={12} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-[#f0f6fc] leading-tight">8. AI Genie & Copilot Suite</h4>
                  <span className="text-[8px] uppercase tracking-widest text-[#8b949e] block mt-0.5">INTELLIGENT RECONSTRUCTORS</span>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                This IDE embeds a sophisticated, context-aware AI suite powered by Gemini to help you design, audit, and verify Turing algorithms:
              </p>

              <div className="space-y-3 pl-1.5 border-l border-purple-500/30">
                <div>
                  <span className="text-[10.5px] font-bold text-[#f0f6fc] block">📍 AI Scenario Studio (Left Sidebar bottom)</span>
                  <p className="text-[9.5px] text-[#8b949e] mt-0.5 leading-relaxed">
                    Instantly construct complete scenarios from a prompt. Renders a side-by-side transition rules differential model, allowing you to preview and cherry-pick rules before applying them to the graph canvas.
                  </p>
                </div>

                <div>
                  <span className="text-[10.5px] font-bold text-sky-400 block">📍 AI Copilot Chat (Right Sidebar &rarr; Copilot)</span>
                  <p className="text-[9.5px] text-[#8b949e] mt-0.5 leading-relaxed">
                    A real-time expert conversation partner! Ask questions about your current simulator states, request audits for infinite loops, or optimize rules. Best of all: it can inject **live commands** directly into your active simulator (updating rules, initial states, or tapes) with a single click.
                  </p>
                </div>

                <div>
                  <span className="text-[10.5px] font-bold text-emerald-400 block">📍 Automated Test Suite (Right Sidebar &rarr; Copilot &rarr; Test Suite)</span>
                  <p className="text-[9.5px] text-[#8b949e] mt-0.5 leading-relaxed">
                    Verify compliance of your rules with ease! Click to generate complex, customized valid and boundary test cases. Click <strong className="text-[#f0f6fc]">Run All Tests</strong> to execute background sandboxed dry-runs and verify expected transition outcomes.
                  </p>
                </div>

                <div>
                  <span className="text-[10.5px] font-bold text-amber-400 block">📍 Custom Preset Tags & Search</span>
                  <p className="text-[9.5px] text-[#8b949e] mt-0.5 leading-relaxed">
                    When saving a custom workspace (using "Save Custom Preset"), a rich modal prompts you for semantic metadata tags. These custom tags are integrated into the main Preset Library search index.
                  </p>
                </div>
              </div>

              {/* Graphics Snippet: Genie Dialogue */}
              <div className="p-2.5 bg-[#0d1117] rounded border border-[#21262d] text-[10px] space-y-2 select-text">
                <div className="flex items-start gap-1 text-[#8b949e]">
                  <span className="font-extrabold text-blue-400 uppercase text-[8px] bg-blue-500/10 px-1 rounded block shrink-0">USER REQUEST</span>
                  <p className="italic text-[9.5px]">"Audit my active rules for infinite loops..."</p>
                </div>
                <div className="flex items-start gap-1 pb-1 border-t border-[#21262d]/50 pt-2 text-[#c9d1d9] font-mono text-[9px]">
                  <Sparkles size={11} className="text-purple-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-sans font-extrabold text-[#f0f6fc] uppercase text-[8px] block tracking-wide text-sky-400">COPILOT AUDITOR FEEDBACK:</span>
                    <p className="text-[8.5px] mt-0.5 text-emerald-400 leading-normal">
                      &bull; State q0 has no halt transition. Injecting fix...
                    </p>
                    <button className="mt-1.5 w-full bg-primary-base text-white text-[8px] font-bold py-0.5 px-1 rounded hover:bg-opacity-90 flex items-center justify-center gap-1 transition-colors">
                      <Play size={8} fill="currentColor" />
                      EXECUTE ACTION IN SIMULATOR
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 9. Audio Sound FX */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                  <Music size={12} className="text-sky-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-[#f0f6fc] leading-tight">9. Synchronized Tactile Audio FX</h4>
                  <span className="text-[8px] uppercase tracking-widest text-[#8b949e] block mt-0.5">TACTILE HARDWARE CLICKERS</span>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                Hear operational cycles real-time. Features satisfying hardware relays, clock ticks, startup hums, success alarms upon accepting, or failure buzzing frequencies upon rejecting.
              </p>

              {/* Graphics Snippet: Simulated audio wave */}
              <div className="flex items-center justify-between p-2 bg-[#0d1117] border border-[#21262d] rounded text-[8px] tracking-wide font-mono font-bold text-sky-400">
                <span className="font-sans text-text-faint text-[7.5px]">CLK TRANSISTOR FEEDBACK Waveform</span>
                <span className="animate-pulse flex items-center gap-0.5 select-none">
                  <span className="inline-block w-[2px] h-3 bg-sky-500" />
                  <span className="inline-block w-[2px] h-4 bg-sky-500" />
                  <span className="inline-block w-[2px] h-2 bg-sky-500" />
                  <span className="inline-block w-[2px] h-5 bg-sky-500" />
                  <span className="inline-block w-[2px] h-3 bg-sky-500" />
                </span>
              </div>
            </div>

            {/* 10. Memory Telemetry Engine */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded bg-lime-500/10 flex items-center justify-center border border-lime-500/20 shrink-0">
                  <BarChart4 size={12} className="text-lime-400" />
                </div>
                <div>
                  <h4 className="text-[11.5px] font-semibold text-[#f0f6fc] leading-tight">10. Dynamic Run-time Telemetry Metrics</h4>
                  <span className="text-[8px] uppercase tracking-widest text-[#8b949e] block mt-0.5">CPU STATISTICS TRACKING</span>
                </div>
              </div>
              <p className="text-[10.5px] leading-relaxed text-[#8b949e]">
                Deep statistics tracking monitors total elapsed execution steps, cellular tape movements (R/L/S write coordinates counters), and estimates memory bandwidth overhead byte heuristics.
              </p>

              {/* Graphics Snippet: Telemetry HUD */}
              <div className="p-2.5 bg-[#0d1117] border border-[#21262d] rounded-md overflow-hidden grid grid-cols-2 gap-2 text-left font-mono">
                <div className="bg-[#161b22] p-1.5 rounded text-[8.5px] border border-[#21262d]">
                  <span className="text-[7.5px] text-text-faint block uppercase">TOTAL STEPS</span>
                  <span className="text-lime-400 font-extrabold text-[10px]">1,284 steps</span>
                </div>
                <div className="bg-[#161b22] p-1.5 rounded text-[8.5px] border border-[#21262d]">
                  <span className="text-[7.5px] text-text-faint block uppercase">MEMORY ESTIMATE</span>
                  <span className="text-sky-400 font-extrabold text-[10px]">10.27 KB RAM</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Static Footer Indicator Bar */}
      <div className="px-4 py-2 bg-[#161b22] border-t border-[#30363d] flex justify-between items-center shrink-0 font-mono text-[8px] text-[#8b949e]">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span className="uppercase font-bold tracking-wider text-emerald-400">ENGINE COMPILED</span>
        </span>
        <span className="text-[7.5px] text-[#8b949e] select-none">
          V1.9.0 // COMPILER SECURE SANDBOX
        </span>
      </div>
    </div>
  );
};
