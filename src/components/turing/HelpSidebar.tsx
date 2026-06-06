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
             <li><strong className="text-primary-base">Infinite Tape:</strong> Divided into cells, each holding one symbol (or blank 'B'). It represents the machine's memory.</li>
             <li><strong className="text-primary-base">Read/Write Head:</strong> Reads the symbol on the current cell, then writes a new symbol and moves Left or Right.</li>
             <li><strong className="text-primary-base">State Register:</strong> Holds the machine's current state, determining its next action.</li>
             <li><strong className="text-primary-base">Transition Table:</strong> A set of rules (State + Read Symbol &rarr; Write Symbol + Move Direction + Next State).</li>
           </ul>
         </section>

         <section>
           <h3 className="text-sm font-bold text-text-primary mb-2 border-b border-border-active pb-1">How the Simulator Works</h3>
           <ul className="space-y-2 leading-relaxed">
             <li><strong>Left Panel:</strong> Load pre-configured scenarios or generate new ones using AI.</li>
             <li><strong>Tape & Controls:</strong> Watch the memory tape. Use 'RESTART', 'RUN', 'PAUSE' and 'STEP' controls to manage execution.</li>
             <li><strong>State Diagram:</strong> A real-time visual representation of the machine's states (represented as standard UML states) and transitions.</li>
             <li><strong>Rule Editor:</strong> Modify the transition table directly to experiment with different logic.</li>
             <li><strong>Debugger Console:</strong> (Bottom) View a real-time trace of the machine's actions and statistics.</li>
           </ul>
         </section>

         <div className="mt-4 pt-4 border-t border-border-active italic text-[10px] text-text-muted text-center">
            "A machine is a set of rules for manipulating symbols on a strip of tape according to a table of rules."
            <br />- A. Turing, 1936
         </div>
       </div>
    </div>
  );
};
