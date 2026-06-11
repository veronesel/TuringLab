import React, { useState } from 'react';
import { BookOpen, X, ChevronLeft, ChevronRight } from 'lucide-react';

export const HelpSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-[50%] bg-bg-element border border-r-0 border-border-active p-2 rounded-l-lg hover:bg-border-active transition-colors z-[100]"
        title="Open System Help"
      >
        <BookOpen size={16} className="text-text-secondary" />
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-12 bottom-[140px] w-80 bg-bg-panel border-l border-border-main flex flex-col z-50 transition-all duration-300 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
       <div className="px-4 py-3 bg-bg-surface border-b border-border-main flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary-base" />
            <span className="text-xs font-bold text-text-secondary tracking-wider">SYSTEM HELP</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 text-xs text-text-secondary space-y-6">
         
         <section>
           <h3 className="text-sm font-bold text-text-primary mb-2 border-b border-border-active pb-1">What is a Turing Machine?</h3>
           <p className="leading-relaxed">
             A conceptual model of computation proposed by Alan Turing in 1936. Despite its simplicity, it is mathematically capable of computing any computable function. It forms the foundation of modern computer science and theoretical logic.
           </p>
         </section>

         <section>
           <h3 className="text-sm font-bold text-text-primary mb-2 border-b border-border-active pb-1">Theoretical Components</h3>
           <ul className="space-y-2 leading-relaxed">
             <li><strong className="text-primary-base">Infinite Tape:</strong> Divided into cells, each holding one symbol (or blank '_'). It represents the machine's memory.</li>
             <li><strong className="text-primary-base">Read/Write Head:</strong> Reads the symbol on the current cell, then writes a new symbol and moves Left (L) or Right (R).</li>
             <li><strong className="text-primary-base">State Register:</strong> Holds the machine's current state, determining its next action.</li>
             <li><strong className="text-primary-base">Transition Table:</strong> A set of rules (State + Read Symbol &rarr; Write Symbol + Move Direction + Next State).</li>
           </ul>
         </section>

         <section>
           <h3 className="text-sm font-bold text-text-primary mb-2 border-b border-border-active pb-1">Platform Interface & Layout</h3>
           <ul className="space-y-2 leading-relaxed text-[11px]">
             <li>
               <span className="font-semibold text-text-primary">⬅ Left Panel [Scenario Library]</span>
               <p className="text-text-muted text-[10.5px]">
                 Browse scenario presets, or use the <span className="text-[#3b82f6] font-bold">AI Scenario Creator</span> at the bottom to design custom tape problems.
               </p>
             </li>
             <li>
               <span className="font-semibold text-text-primary">⚡ Top Bar [Tape Controls]</span>
               <p className="text-text-muted text-[10.5px]">
                 Watch cells update. Use speed sliders, <kbd className="px-1 bg-[#161b22] border border-[#21262d] rounded">Run</kbd>, <kbd className="px-1 bg-[#161b22] border border-[#21262d] rounded">Step</kbd>, <kbd className="px-1 bg-[#161b22] border border-[#21262d] rounded">Pause</kbd>, or change tape cells dynamically.
               </p>
             </li>
             <li>
               <span className="font-semibold text-text-primary">📊 Center Panel [State Diagram]</span>
               <p className="text-text-muted text-[10.5px]">
                 A responsive node diagram showing active states and transition lines which light up during CPU step cycles.
               </p>
             </li>
             <li>
               <span className="font-semibold text-text-primary">📝 Right Panel [Rule Editor]</span>
               <p className="text-text-muted text-[10.5px]">
                 Edit, add, and inspect execution tables. Launches the full <span className="text-amber-400 font-bold">Rule Workshop Studio</span> for complete algebraic matrix and AI builders.
               </p>
             </li>
           </ul>
         </section>

         <section className="bg-bg-panel/60 p-2.5 rounded border border-border-main space-y-3">
           <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
             🌟 Advanced Workspace Features
           </h3>

           <div>
             <div className="flex items-center gap-1 text-text-primary font-bold text-[11px]">
               <span className="text-red-400 font-mono text-xs">●</span>
               <span>Real-time Linter & Conflict HUD</span>
             </div>
             <p className="text-text-muted text-[10.5px] mt-0.5 leading-relaxed">
               Monitors rules dynamically. Highlights <span className="text-red-400 font-semibold border-b border-red-500/35">Non-deterministic Overlaps</span> in red showing a tooltip error dot, and highlights <span className="text-amber-400 font-semibold border-b border-amber-500/35">Unreachable States</span> in amber with warning badges.
               <br />
               <span className="text-[9.5px] italic text-[#888]">📍 UI Location: Header panel of Right Editor and State columns.</span>
             </p>
           </div>

           <div>
             <div className="flex items-center gap-1 text-text-primary font-bold text-[11px]">
               <span className="text-sky-400 font-bold">Renovator</span>
               <span>Instant State Refactoring</span>
             </div>
             <p className="text-text-muted text-[10.5px] mt-0.5 leading-relaxed">
               Bulk-updates across your entire active logic blueprint safely (e.g. rename <code className="bg-[#161b22] px-1 rounded text-blue-400">q0</code> into <code className="bg-[#161b22] px-1 rounded text-green-400">start</code>).
               <br />
               <span className="text-[9.5px] italic text-[#888]">📍 UI Location: Bottom card of Right Sidebar panel.</span>
             </p>
           </div>

           <div>
             <div className="flex items-center gap-1 text-text-primary font-bold text-[11px]">
               <span className="text-[#3b82f6] font-bold">Genie</span>
               <span>AI Co-Designer Studio</span>
             </div>
             <p className="text-text-muted text-[10.5px] mt-0.5 leading-relaxed">
               Opens a conversation terminal with Gemini. Type plain English requirements to instantly synthesize deterministic state transition matrices.
               <br />
               <span className="text-[9.5px] italic text-[#888]">📍 UI Location: "AI Co-Designer" tab inside the Rule Studio popup.</span>
             </p>
           </div>
         </section>

         <div className="mt-4 pt-4 border-t border-border-active italic text-[10px] text-text-muted text-center leading-relaxed">
           "A machine is a set of rules for manipulating symbols on a strip of tape according to a table of rules."
           <br />- Alan Turing, 1936
         </div>
       </div>
    </div>
  );
};
