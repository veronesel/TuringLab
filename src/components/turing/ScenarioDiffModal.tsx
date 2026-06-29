import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TMScenario, TMRule } from '../../types/tm';
import { X, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScenarioDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  baseScenario: TMScenario | null;
  proposedScenario: TMScenario;
}

export function ScenarioDiffModal({ isOpen, onClose, onApply, baseScenario, proposedScenario }: ScenarioDiffModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-bg-surface border border-border-main rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border-main bg-bg-panel/50 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-text-primary tracking-wide">Review Proposed Scenario</h2>
            <p className="text-[10px] text-text-muted mt-0.5">Please review the AI's proposed changes before applying them to your machine.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-bg-element text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-[#0d1117]">
          {/* Metadata */}
          <div className="flex gap-4">
            <div className="flex-1 border border-border-main rounded-lg p-3 bg-bg-panel/40">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 block">Name</span>
              <div className="text-secondary font-sans text-xs flex items-center gap-2">
                 <span className="line-through text-red-400 opacity-70">{baseScenario?.name || "None"}</span>
                 <ArrowRight size={12} className="text-text-faint" />
                 <span className="text-green-400 font-bold">{proposedScenario.name}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 border border-border-main rounded-lg p-3 bg-bg-panel/40">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 block">Initial Tape</span>
              <div className="text-secondary font-mono text-xs flex items-center gap-2">
                 <span className="line-through text-red-400 opacity-70 break-all">{baseScenario?.initialTape || "_"}</span>
                 <ArrowRight size={12} className="text-text-faint shrink-0" />
                 <span className="text-green-400 font-bold break-all">{proposedScenario.initialTape}</span>
              </div>
            </div>
          </div>

          {/* Rules Diff */}
          <div className="flex flex-col gap-2">
             <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider pl-1">Rule Differences</span>
             <div className="border border-border-main rounded-lg bg-bg-panel overflow-hidden">
                <div className="grid grid-cols-2 text-[10px] font-bold text-text-secondary bg-[#161b22] border-b border-border-main divide-x divide-border-main">
                  <div className="p-2">Current Rules</div>
                  <div className="p-2">Proposed Rules</div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border-main">
                  <div className="p-2 flex flex-col gap-1.5 flex-1 max-h-[300px] overflow-y-auto bg-red-950/10">
                     {baseScenario?.rules?.length ? baseScenario.rules.map((rule, idx) => (
                       <div key={idx} className="bg-bg-surface border border-red-500/20 p-1.5 rounded text-[10px] font-mono text-red-300">
                          ({rule.currentState}, "{rule.readSymbol || '_'}) ➔ ({rule.nextState}, "{rule.writeSymbol || '_'}", {rule.moveDirection})
                       </div>
                     )) : (
                       <div className="text-[10px] text-text-muted italic opacity-50 p-2">No current rules.</div>
                     )}
                  </div>
                  <div className="p-2 flex flex-col gap-1.5 flex-1 max-h-[300px] overflow-y-auto bg-green-950/10">
                     {proposedScenario.rules?.length ? proposedScenario.rules.map((rule, idx) => (
                       <div key={idx} className="bg-bg-surface border border-green-500/20 p-1.5 rounded text-[10px] font-mono text-green-300">
                          ({rule.currentState}, "{rule.readSymbol || '_'}) ➔ ({rule.nextState}, "{rule.writeSymbol || '_'}", {rule.moveDirection})
                       </div>
                     )) : (
                       <div className="text-[10px] text-text-muted italic opacity-50 p-2">No proposed rules.</div>
                     )}
                  </div>
                </div>
             </div>
          </div>
          
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-border-main bg-bg-panel/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded font-bold text-xs border border-border-main text-text-secondary hover:text-text-primary hover:bg-bg-element transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 rounded font-bold text-xs bg-[#1d4ed8] hover:bg-blue-600 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Check size={14} />
            Apply & Load Scenario
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
