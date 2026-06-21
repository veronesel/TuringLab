import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTMStore } from '../../store/tmStore';
import { TMScenario } from '../../types/tm';
import { useScenariosStore } from '../../store/scenariosStore';
import { ScenarioDiffModal } from "./ScenarioDiffModal";
import { AnimatePresence, motion } from "motion/react";
import { 
  BrainCircuit, X, Loader2, Sparkles, AlertTriangle, ArrowRight, CheckCircle2, HelpCircle, Wand2
} from 'lucide-react';

interface AiScenarioStudioProps {
  isOpen?: boolean;
  onClose?: () => void;
  inline?: boolean;
}

export const AiScenarioStudio: React.FC<AiScenarioStudioProps> = ({ isOpen = false, onClose, inline = false }) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modifyActive, setModifyActive] = useState(false);
  const [previewState, setPreviewState] = useState<{
    isOpen: boolean;
    base: TMScenario | null;
    proposed: TMScenario | null;
    formatted: TMScenario | null;
  }>({ isOpen: false, base: null, proposed: null, formatted: null });

  const activeInstanceDetails = useTMStore(state => state.activeScenario);
  const loadScenario = useTMStore(state => state.loadScenario);
  const tape = useTMStore(state => state.tape);
  const rules = useTMStore(state => state.rules);

  const { addActiveScenario, addCustomScenario } = useScenariosStore();

  const handleGenerateIdea = async () => {
    setIsGeneratingIdea(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-scenario-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate scenario description");
      if (data.idea) {
        setPrompt(data.idea);
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate scenario description");
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      let baseScenarioContext;
      if (modifyActive && activeInstanceDetails) {
        let initialTapeStr = activeInstanceDetails.initialTape;
        const indices = Object.keys(tape).map(Number).sort((a,b)=>a-b);
        if (indices.length > 0) {
           const min = Math.min(...indices);
           const max = Math.max(...indices);
           let t = "";
           for(let i=min; i<=max; i++) t += tape[i] || '_';
           initialTapeStr = t;
        }

        baseScenarioContext = {
          ...activeInstanceDetails,
          rules: rules,
          initialTape: initialTapeStr,
          customPositions: activeInstanceDetails?.customPositions,
          stateColors: activeInstanceDetails.stateColors,
          stateLabels: activeInstanceDetails.stateLabels
        };
      }

      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          description: prompt,
          baseScenario: baseScenarioContext
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      const newScenario = data.configuration as TMScenario;
      
      const formattedScenario: TMScenario = {
        ...newScenario,
        id: (modifyActive && activeInstanceDetails) ? activeInstanceDetails.id : `ai-gen-${Date.now()}`,
        category: "AI Generated",
        name: (modifyActive && activeInstanceDetails) ? activeInstanceDetails.name : newScenario.name
      };

      setPreviewState({
        isOpen: true,
        base: (modifyActive && activeInstanceDetails && baseScenarioContext) ? (baseScenarioContext as TMScenario) : null,
        proposed: newScenario,
        formatted: formattedScenario
      });

    } catch (e: any) {
      setError(e.message);
      setIsGenerating(false);
    }
  };

  const handleApplyPreview = () => {
    if (!previewState.formatted) return;
    const formattedScenario = previewState.formatted;

    if (modifyActive && activeInstanceDetails) {
      addActiveScenario(formattedScenario);
      loadScenario(formattedScenario); 
    } else {
      addActiveScenario(formattedScenario);
      addCustomScenario(formattedScenario);
      loadScenario(formattedScenario);
    }
    
    setPrompt("");
    setPreviewState({ isOpen: false, base: null, proposed: null, formatted: null });
    setIsGenerating(false);
    if (onClose) onClose();
  };

  const handleCancelPreview = () => {
    setPreviewState({ isOpen: false, base: null, proposed: null, formatted: null });
    setIsGenerating(false);
  };

  if (inline) {
    return (
      <div className="flex flex-col h-full bg-[#0d1117]/10">
        <div className="p-3 border-b border-border-[#21262d]/50 bg-[#161b22]/30 flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-purple-500/10 text-purple-450">
              <BrainCircuit size={13} className="text-purple-400" />
            </span>
            <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
              AI Synthesizer
            </span>
          </div>
          <p className="text-[10px] text-text-muted leading-snug">
            Describe custom Turing Machine behaviors to automatically synthesize states, custom rules, initial tape, and full state-diagram positions.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-[10px] font-bold text-text-secondary tracking-wide uppercase flex items-center gap-1">
                  Scenario Prompt
                  <div className="group relative inline-flex">
                    <HelpCircle size={11} className="text-text-muted cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 rounded bg-bg-surface border border-border-main shadow-xl text-[9px] hidden group-hover:block text-left whitespace-normal z-[100] font-normal leading-normal text-text-primary pointer-events-none">
                      Describe what your machine should do, what the tape contains, and output states.
                    </div>
                  </div>
                </label>
                
                <button
                  type="button"
                  onClick={handleGenerateIdea}
                  disabled={isGeneratingIdea}
                  className="flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 px-2 py-0.5 rounded text-[9px] font-bold text-purple-400 cursor-pointer transition-colors"
                >
                  {isGeneratingIdea ? (
                    <>
                      <Loader2 size={9} className="animate-spin text-purple-400" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={9} className="text-purple-400" />
                      Try New Idea
                    </>
                  )}
                </button>
              </div>

              {activeInstanceDetails && (
                <label className="flex items-center gap-1.5 cursor-pointer bg-blue-500/5 hover:bg-blue-500/10 px-2 py-1 rounded transition-colors border border-blue-500/15 w-fit">
                  <input 
                    type="checkbox" 
                    checked={modifyActive} 
                    onChange={(e) => setModifyActive(e.target.checked)}
                    className="accent-blue-500 cursor-pointer w-3 h-3"
                  />
                  <span className="text-[9px] font-bold text-blue-400 font-sans select-none tracking-wide uppercase">
                    Modify active machine base
                  </span>
                </label>
              )}
            </div>

            <textarea
              placeholder="e.g. Check if a string on the tape is a binary palindrome..."
              className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded p-2.5 text-[11px] h-28 outline-none text-text-primary placeholder:text-text-faint resize-none leading-relaxed transition-colors shadow-inner"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <div className="flex items-center gap-1 text-[9px] text-text-faint mt-0.5 leading-tight">
              <Sparkles size={10} className="text-amber-400/50 shrink-0" />
              <span>Pro Tip: Mention starting tape strings (e.g. '101') for custom starting conditions.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 py-1">
             <div className="flex-1 border-t border-border-main/50" />
             <span className="text-[8px] text-text-muted font-bold tracking-wider uppercase">Quick Sandbox Examples</span>
             <div className="flex-1 border-t border-border-main/50" />
          </div>

          <div className="flex flex-col gap-1.5">
             {[
               { title: "Binary Shift", desc: "Shift a binary string one cell right" },
               { title: "Palindrome", desc: "Check if a string is a palindrome" },
               { title: "Unary Multiplier", desc: "Multiply a unary number by 2" }
             ].map((idea, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(idea.desc)}
                  className="text-left text-[10px] p-2 rounded border border-[#21262d] hover:border-[#4d5c6e] bg-[#161b22] text-text-secondary hover:text-text-primary transition-all flex flex-col gap-0.5 group shadow-sm cursor-pointer"
                >
                  <span className="font-bold text-blue-400 group-hover:text-blue-300">{idea.title}</span>
                  <span className="text-[9px] text-text-faint">{idea.desc}</span>
                </button>
             ))}
          </div>

          {error && (
            <div className="text-red-400 text-[10px] break-words font-sans bg-red-950/20 border border-red-500/15 p-2 rounded flex items-start gap-1.5">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="mt-2 text-center">
            <button
               onClick={handleGenerate}
               disabled={isGenerating || !prompt.trim()}
               className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-2.5 rounded disabled:opacity-45 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow uppercase tracking-wider cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={11} className="animate-spin text-white/70" />
                  {modifyActive ? "Modifying..." : "Synthesizing..."}
                </>
              ) : modifyActive ? (
                <>
                  <Sparkles size={11} />
                  Modify Active Machine
                </>
              ) : (
                <>
                  <Sparkles size={11} />
                  Synthesize Machine
                </>
              )}
            </button>
          </div>
        </div>

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
    );
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9900] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-bg-surface border border-border-main rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#21262d] bg-[#161b22] shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <BrainCircuit size={18} className="animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-primary font-sans tracking-tight">AI Scenario Studio</h2>
              <p className="text-[11px] text-text-muted mt-0.5">Synthesize a complete new sandbox scenario from scratch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-bg-element text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#0d1117]">
          {/* Hero Prompt */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <label className="text-sm font-bold text-text-secondary tracking-wide flex items-center gap-2">
                Scenario Prompt
                <div className="group relative inline-flex">
                  <HelpCircle size={14} className="text-text-muted cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 rounded-lg bg-bg-surface border border-border-main shadow-xl text-xs hidden group-hover:block text-left whitespace-normal z-[100] font-normal leading-relaxed text-text-primary pointer-events-none">
                    Describe exactly what your machine should do, what the initial tape should contain, and what state it should halt in if it succeeds.
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-border-main" />
                  </div>
                </div>
              </label>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateIdea}
                  disabled={isGeneratingIdea}
                  className="flex items-center gap-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-3 py-1 rounded text-[11px] font-bold text-purple-400 font-sans cursor-pointer transition-colors"
                >
                  {isGeneratingIdea ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-purple-400" />
                      Generating Idea...
                    </>
                  ) : (
                    <>
                      <Wand2 size={12} className="text-purple-400 animate-pulse" />
                      Generate AI Scenario Idea
                    </>
                  )}
                </button>

                {activeInstanceDetails && (
                  <label className="flex items-center gap-2 cursor-pointer bg-blue-500/5 hover:bg-blue-500/10 px-2 py-1 rounded transition-colors border border-blue-500/20">
                    <input 
                      type="checkbox" 
                      checked={modifyActive} 
                      onChange={(e) => setModifyActive(e.target.checked)}
                      className="accent-blue-500 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-bold text-blue-400 font-sans select-none tracking-wide uppercase">
                      Modify Active Base
                    </span>
                  </label>
                )}
              </div>
            </div>

            <textarea
              placeholder="e.g. A busy beaver machine that halts quickly... Or a machine that adds two unary numbers separated by a zero..."
              className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded-lg p-4 text-xs h-32 outline-none text-text-primary placeholder:text-text-faint resize-none leading-relaxed transition-colors shadow-inner"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex items-center gap-2 text-[10px] text-text-faint mt-1 pl-1">
              <Sparkles size={12} className="text-amber-400/50" />
              <span>Pro Tip: Mention the starting string for the initial tape to get exactly the starting conditions you want.</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex-1 border-t border-border-main/50" />
             <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Or try an example</span>
             <div className="flex-1 border-t border-border-main/50" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             {[
               { title: "Binary Shift", desc: "Shift a binary string one cell right" },
               { title: "Palindrome", desc: "Check if a string is a palindrome" },
               { title: "Unary Multiplier", desc: "Multiply a unary number by 2" }
             ].map((idea, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(idea.desc)}
                  className="text-left text-[11px] p-3 rounded-lg border border-[#21262d] hover:border-[#4d5c6e] bg-[#161b22] text-text-secondary hover:text-text-primary transition-all flex flex-col gap-1 group shadow-sm hover:shadow-md"
                >
                  <span className="font-bold font-sans text-blue-400 group-hover:text-blue-300">{idea.title}</span>
                  <span className="text-[10px] text-text-faint font-sans">{idea.desc}</span>
                </button>
             ))}
          </div>

        </div>

        <div className="p-4 border-t border-[#21262d] bg-[#161b22] shrink-0 flex flex-col gap-3">
          {error && (
            <div className="text-red-400 text-xs break-words font-sans bg-red-950/30 border border-red-500/20 p-3 rounded flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 rounded font-bold text-xs border border-border-main text-text-secondary hover:text-text-primary hover:bg-bg-element transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
               onClick={handleGenerate}
               disabled={isGenerating || !prompt.trim()}
               className="px-5 py-2 bg-[#1d4ed8] hover:bg-blue-600 text-white font-bold text-xs rounded disabled:opacity-45 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow md-button"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white/70" />
                  {modifyActive ? "Modifying Scenario..." : "Synthesizing Scenario..."}
                </>
              ) : modifyActive ? (
                "Modify Scenario"
              ) : (
                <>
                  <Sparkles size={14} />
                  Create New Scenario
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

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
    </div>,
    document.body
  );
};
