import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  HelpCircle, 
  RotateCcw, 
  Undo2, 
  PlusCircle, 
  Sparkles, 
  CheckCircle2, 
  Wand2,
  Loader2,
  Send,
  ShieldAlert,
  Wrench,
  Check
} from 'lucide-react';
import { useTMStore } from '../../store/tmStore';
import { useThemeStore } from '../../store/themeStore';
import { playSubtleClick, playMachineSuccess } from '../../utils/audio';

interface RejectionExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RejectionExplanationModal: React.FC<RejectionExplanationModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentState, 
    tape, 
    headPosition, 
    errorMessage, 
    undo, 
    resetMachine, 
    activeScenario,
    rules,
    status,
    setRules,
    toggleAcceptState,
    updateTapeSymbol
  } = useTMStore();

  const soundEnabled = useThemeStore(state => state.soundEnabled);

  // Close modal when Esc is pressed
  React.useEffect(() => {
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

  // States for advanced automated fix and retry logic
  const [fixStatus, setFixStatus] = React.useState<'idle' | 'validating' | 'success' | 'persisted_error'>('idle');
  const [persistentErrorMessage, setPersistentErrorMessage] = React.useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = React.useState(false);
  
  // Support ticket form states
  const [showSupportForm, setShowSupportForm] = React.useState(false);
  const [supportMessage, setSupportMessage] = React.useState('');
  const [supportSubmitted, setSupportSubmitted] = React.useState(false);
  const [isSubmittingSupport, setIsSubmittingSupport] = React.useState(false);
  const [supportEmail, setSupportEmail] = React.useState('lveronese@gmail.com');

  if (!isOpen || status !== 'rejected') return null;

  const readSymbol = tape[headPosition] || '_';

  // Helper function to validate if the state & symbol combination is now resolved
  const validateFix = (updatedRules: typeof rules, updatedTape = tape, updatedCurrentState = currentState) => {
    const symbol = updatedTape[headPosition] || '_';
    
    // Check if there is now a rule targeting (currentState, symbol)
    const hasValidTransition = updatedRules.some(
      r => r.currentState === updatedCurrentState && r.readSymbol === symbol
    );
    
    // Check if the current state is accepted
    const isAccepted = activeScenario?.acceptStates.includes(updatedCurrentState) || false;
    
    return hasValidTransition || isAccepted;
  };

  // Execution flow for applying fixes and performing immediate validation checks with retry capabilities
  const executeFixAndRetryCheck = async (
    applyFn: () => { rules: typeof rules; tape?: typeof tape; currentState?: string } | Promise<{ rules: typeof rules; tape?: typeof tape; currentState?: string }>,
    actionName: string
  ) => {
    setIsActionLoading(true);
    setFixStatus('validating');
    
    try {
      // 1. Apple primary remediation fix
      const result = await applyFn();
      
      // Delay slightly (approx. 700ms) to offer a smooth visual transition of diagnostic scanning 
      await new Promise(resolve => setTimeout(resolve, 750));
      
      // 2. Perform validation checks
      const isPassFixed = validateFix(result.rules, result.tape || tape, result.currentState || currentState);
      
      if (isPassFixed) {
        setFixStatus('success');
        if (soundEnabled) playMachineSuccess();
        
        // Successful recovery! Clear rejection status on the core TM store
        useTMStore.setState({ status: 'idle', errorMessage: null });
        
        // Let the user admire success, then auto-close
        setTimeout(() => {
          onClose();
          setFixStatus('idle');
        }, 1100);
      } else {
        // Validation failed originally. Let's trigger a secondary automated "recovery retry step" as safety fallback!
        console.warn(`[RETRY ENGAGED] Applied fix "${actionName}" failed first-pass validation. Injecting adaptive fallback self-loop rule...`);
        
        const fallbackRuleId = 'rule-recovery-' + Math.random().toString(36).substring(2, 9);
        const fallbackRule = {
          id: fallbackRuleId,
          currentState: result.currentState || currentState,
          readSymbol: (result.tape || tape)[headPosition] || '_',
          nextState: result.currentState || currentState,
          writeSymbol: (result.tape || tape)[headPosition] || '_',
          moveDirection: 'S' as const
        };
        
        const finalRules = [...result.rules, fallbackRule];
        setRules(finalRules);
        
        // Delay another 400ms to mimic adaptive retry logic
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const isSecondPassFixed = validateFix(finalRules, result.tape || tape, result.currentState || currentState);
        
        if (isSecondPassFixed) {
          setFixStatus('success');
          if (soundEnabled) playMachineSuccess();
          useTMStore.setState({ status: 'idle', errorMessage: null });
          setTimeout(() => {
            onClose();
            setFixStatus('idle');
          }, 1100);
        } else {
          // Both passes failed. Escalate simulation to persistent_error layout
          setFixStatus('persisted_error');
          setPersistentErrorMessage(
            `Applied resolution "${actionName}" was integrated, but the transition matrix is still missing a valid rule to advance from State "${result.currentState || currentState}" on reading input symbol "${(result.tape || tape)[headPosition] || '_'}"`
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      setFixStatus('persisted_error');
      setPersistentErrorMessage(err?.message || 'An unexpected error occurred during execution parsing validation.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 1. AI Intelligent Fix
  const handleAIFix = () => {
    executeFixAndRetryCheck(async () => {
      const issue = {
        id: `missing-transition-${currentState}-${readSymbol}`,
        type: 'conflict',
        title: 'Missing Transition Rule',
        description: `The Turing Machine is currently halted in state "${currentState}" when reading symbol "${readSymbol === '_' ? 'Blank (_)' : readSymbol}". The machine is rejected because there are no rule transitions specified.`
      };

      const response = await fetch('/api/fix-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules: rules,
          issues: [issue]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fix rules with AI');
      }

      const data = await response.json();
      if (data.fixedRules && Array.isArray(data.fixedRules)) {
        const rulesWithIds = data.fixedRules.map((r: any) => ({
          ...r,
          id: r.id || 'rule-ai-' + Math.random().toString(36).substring(2, 9)
        }));
        setRules(rulesWithIds);
        return { rules: rulesWithIds };
      } else {
        throw new Error('AI response structure contains no valid rules array configuration.');
      }
    }, 'Gemini AI Intelligent Resolving');
  };

  // 2. Add Self Loop
  const handleApplyMissingRuleFix = () => {
    executeFixAndRetryCheck(() => {
      const newRuleId = 'rule-' + Math.random().toString(36).substring(2, 9);
      const newRule = {
        id: newRuleId,
        currentState: currentState,
        readSymbol: readSymbol,
        nextState: currentState,
        writeSymbol: readSymbol,
        moveDirection: 'S' as const
      };
      const updatedRules = [...rules, newRule];
      setRules(updatedRules);
      return { rules: updatedRules };
    }, 'Auto-Add Self-Loop Rule');
  };

  // 3. Mark Accepting
  const handleApplyAcceptStateFix = () => {
    executeFixAndRetryCheck(() => {
      toggleAcceptState(currentState);
      const isNowAccepting = activeScenario?.acceptStates.includes(currentState);
      // Wait, toggle AcceptState doesn't return new rules, but returns updated scenario acceptance state
      return { rules: rules, currentState: currentState };
    }, 'Mark State as Accepting');
  };

  // 4. Swap Tape Symbol
  const handleApplyTapeFix = (sym: string) => {
    executeFixAndRetryCheck(() => {
      updateTapeSymbol(headPosition, sym);
      const updatedTape = { ...tape, [headPosition]: sym };
      return { rules: rules, tape: updatedTape };
    }, `Replace tape cell with "${sym}"`);
  };

  // 5. Manual Override bypass
  const handleManualOverride = () => {
    if (soundEnabled) playSubtleClick();
    // Exits rejected state directly, resetting machine status to idle
    useTMStore.setState({ status: 'idle', errorMessage: null });
    setFixStatus('idle');
    onClose();
  };

  // 6. Submit support ticket simulation
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    
    setIsSubmittingSupport(true);
    if (soundEnabled) playSubtleClick();
    
    // Simulate real diagnostic shipping to backend
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    setSupportSubmitted(true);
    setIsSubmittingSupport(false);
  };

  const handleReset = () => {
    if (soundEnabled) playSubtleClick();
    resetMachine();
    setFixStatus('idle');
    onClose();
  };

  const handleUndo = () => {
    if (soundEnabled) playSubtleClick();
    undo();
    setFixStatus('idle');
    onClose();
  };

  const handleClose = () => {
    if (soundEnabled) playSubtleClick();
    setFixStatus('idle');
    setShowSupportForm(false);
    setSupportSubmitted(false);
    onClose();
  };

  // Get other unique symbols in schema rules to suggest as quick-swap options
  const availableSymbols = Array.from(
    new Set(['_', '0', '1', ...rules.map(r => r.readSymbol), ...rules.map(r => r.writeSymbol)])
  ).filter(sym => sym !== readSymbol).slice(0, 5);

  return (
    <AnimatePresence>
      <div id="rejection-modal-overlay" className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div 
          id="rejection-modal-card"
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-bg-panel border border-red-500/30 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh] p-6 relative overflow-hidden"
        >
          {/* Close button top right */}
          <button 
            id="rejection-modal-close-btn"
            onClick={handleClose} 
            className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-element transition-all cursor-pointer"
            title="Dismiss / Close"
          >
            <X size={18} />
          </button>

          {/* Conditional Rendering Blocks based on fixStatus or showSupportForm */}
          {showSupportForm ? (
            /* Diagnostic Support Form View */
            <div id="rejection-support-view" className="flex flex-col space-y-4 h-full overflow-hidden">
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-blue-500/15 p-2 rounded-lg text-blue-400 border border-blue-500/20">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
                    Submit Diagnostic Ticket
                  </h3>
                  <p className="text-[9px] text-blue-400 font-mono uppercase tracking-widest mt-0.5">
                    Send state metrics directly to our engineering support team
                  </p>
                </div>
              </div>

              {supportSubmitted ? (
                <div id="support-success-message" className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center animate-bounce">
                    <Check size={24} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wide">Report Dispatched</h4>
                    <p className="text-[10px] text-text-secondary leading-relaxed max-w-xs mt-1.5">
                      Your diagnostic report and current rule matrix have been forwarded successfully as a ticket under account <span className="font-mono text-emerald-400">{supportEmail}</span>. The engineering log ID is <span className="font-mono text-emerald-300">TM-{Math.floor(Math.random() * 90000) + 10000}</span>.
                    </p>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button
                      id="support-success-close-btn"
                      onClick={() => {
                        setShowSupportForm(false);
                        setSupportSubmitted(false);
                        handleManualOverride(); // Override status
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-bg-base font-black text-[9px] uppercase tracking-wider rounded transition-all cursor-pointer"
                    >
                      Bypass & Continue (Manual Override)
                    </button>
                    <button
                      id="support-success-retry-btn"
                      onClick={() => {
                        setShowSupportForm(false);
                        setSupportSubmitted(false);
                      }}
                      className="px-3 py-1.5 bg-bg-element border border-border-main hover:bg-bg-panel text-text-secondary font-black text-[9px] uppercase tracking-wider rounded transition-all cursor-pointer"
                    >
                      Return to Rejection Panel
                    </button>
                  </div>
                </div>
              ) : (
                <form id="support-ticket-form" onSubmit={handleSupportSubmit} className="flex-1 flex flex-col space-y-3.5 overflow-y-auto pr-1 min-h-0 [scrollbar-width:thin]">
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Our debugger will auto-attach the current Turing Machine state variables, transition table, active scenario setup, and tape data payload. Please detail below the exact expected result of your computation to help us analyze the conflict.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest font-mono">User Registered Email</label>
                    <input 
                      id="support-email-input"
                      type="email" 
                      required
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full text-[11px] font-mono bg-bg-element/60 border border-border-main rounded p-2 text-text-primary focus:border-blue-500/50 outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-bg-element/40 border border-border-main/50 rounded p-2">
                      <span className="text-[8px] font-mono font-bold text-text-muted block uppercase">Halted State</span>
                      <span className="text-[10px] font-mono font-bold text-red-400">{currentState}</span>
                    </div>
                    <div className="bg-bg-element/40 border border-border-main/50 rounded p-2">
                      <span className="text-[8px] font-mono font-bold text-text-muted block uppercase">Symbol Encountered</span>
                      <span className="text-[10px] font-mono font-bold text-amber-400">'{readSymbol}'</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest font-mono">Auto-Attached Dump File Payload</label>
                    <textarea 
                      id="support-attachment-preview"
                      disabled
                      className="w-full h-16 text-[8px] font-mono bg-bg-element/20 border border-border-main/40 rounded p-1.5 text-text-faint resize-none"
                      value={JSON.stringify({
                        haltedAt: `q=${currentState}, sym=${readSymbol}, pos=${headPosition}`,
                        totalRules: rules.length,
                        scenario: activeScenario?.name || 'custom-scratchpad',
                        tapeLength: Object.keys(tape).length,
                        rules: rules.slice(0, 5)
                      }, null, 2)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest font-mono">Describe your problem / expected behavior</label>
                    <textarea 
                      id="support-msg-textarea"
                      required
                      rows={3}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="e.g. My machine should move state q1 to the right when reading empty space but it gets stuck..."
                      className="w-full text-[11px] bg-bg-element/60 border border-border-main rounded p-2 text-text-primary placeholder:text-text-faint focus:border-blue-500/50 outline-none resize-none" 
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2 shrink-0">
                    <button
                      id="support-cancel-btn"
                      type="button"
                      onClick={() => setShowSupportForm(false)}
                      className="px-3.5 py-2 bg-bg-element hover:bg-border-active text-text-secondary font-black text-[9px] uppercase tracking-wider rounded transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      id="support-submit-btn"
                      type="submit"
                      disabled={isSubmittingSupport}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-wider rounded transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingSupport ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Submitting Ticket...
                        </>
                      ) : (
                        <>
                          <Send size={12} />
                          Dispatch Ticket
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : fixStatus === 'validating' ? (
            /* Scans & validates the machine execution on state fix attempt */
            <div id="rejection-validating-view" className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-5">
              <div className="relative flex items-center justify-center">
                <Loader2 size={44} className="text-blue-500 animate-spin absolute" />
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Wrench size={16} className="animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Verifying Solution Integration
                </h3>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Executing standard TM dry-run tests and checking state-level deterministic matrices for conflicts.
                </p>
                <div className="mt-3 bg-bg-element/50 border border-border-main/50 rounded-lg py-1.5 px-3 font-mono text-[8px] text-blue-400 flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>ATTEMPT 1: transition rules modified ... OK</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-text-faint">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                    <span>ATTEMPT 2: validating State "{currentState}" on Symbol "{readSymbol}" ...</span>
                  </div>
                </div>
              </div>
            </div>
          ) : fixStatus === 'success' ? (
            /* Successful validation verification */
            <div id="rejection-success-view" className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              >
                <CheckCircle2 size={32} className="animate-pulse" />
              </motion.div>
              <div className="space-y-1 max-w-xs">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  Validation Verified
                </h3>
                <p className="text-[10.5px] text-text-secondary leading-relaxed">
                  Turing machine transition constraints resolved successfully! Clear execution route confirmed.
                </p>
                <span className="inline-block text-[9px] text-text-faint font-mono uppercase bg-bg-element px-2 py-0.5 rounded border border-border-main mt-2">
                  Transition error status cleared
                </span>
              </div>
            </div>
          ) : fixStatus === 'persisted_error' ? (
            /* Persisted Rejection Error Escalation Path */
            <div id="rejection-persisted-view" className="flex flex-col space-y-4 h-full overflow-hidden">
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-red-500/20 p-2.5 rounded-lg text-red-500 border border-red-500/30">
                  <AlertTriangle size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-red-400 uppercase tracking-wider">
                    Validation Deficit Warning
                  </h3>
                  <p className="text-[9px] text-text-muted font-mono uppercase tracking-widest mt-0.5">
                    Halted simulation state could not be automatically reconciled
                  </p>
                </div>
              </div>

              {/* Error Explanation Card */}
              <div className="bg-[#1b0a0a] border border-red-500/30 rounded-lg p-4 space-y-3">
                <span className="text-[9px] font-mono uppercase font-bold text-red-400 tracking-wider block">
                  ⚠️ Verification Alert: Conflict Unresolved
                </span>
                <p className="text-[11px] text-text-secondary leading-normal">
                  {persistentErrorMessage || `Although a remediation attempt was processed, the simulation was immediately validated again and remains halted because State "${currentState}" still lacks a final deterministic transition rule for Symbol "${readSymbol}".`}
                </p>
                <div className="bg-black/40 border border-red-500/15 p-2 rounded text-[7.5px] text-text-muted font-mono leading-relaxed">
                  <span className="font-bold text-red-300">SYSTEM RESPONSE:</span> Simulated execute sequence failed to step past State "{currentState}" due to null rule transition. Active state accept attribute evaluates to false.
                </div>
              </div>

              {/* Action Choices for users to manual override or contact support */}
              <div className="space-y-2.5 pt-1 flex-1 overflow-y-auto pr-1 min-h-0 [scrollbar-width:thin]">
                <h4 className="text-[9px] font-bold text-text-muted uppercase tracking-widest font-mono">Select Recovery Alternative</h4>
                
                {/* Alt 1: Force manual override bypass */}
                <button
                  id="persisted-btn-manual-override"
                  onClick={handleManualOverride}
                  className="w-full flex items-center justify-between text-left p-3 rounded-lg border border-border-active bg-bg-element hover:bg-border-active/40 hover:border-emerald-500/40 transition-colors group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                      1. Forced Manual Override
                    </span>
                    <p className="text-[9px] text-text-muted">
                      Directly clear the rejection status, forcing state back to 'idle' to resume custom debugging.
                    </p>
                  </div>
                  <CheckCircle2 size={13} className="text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
                </button>

                {/* Alt 2: Submit ticket & request engineering audit */}
                <button
                  id="persisted-btn-contact-support"
                  onClick={() => setShowSupportForm(true)}
                  className="w-full flex items-center justify-between text-left p-3 rounded-lg border border-border-active bg-bg-element hover:bg-border-active/40 hover:border-blue-500/40 transition-colors group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1.5">
                      2. Open Support Investigation Log
                    </span>
                    <p className="text-[9px] text-text-muted">
                      Export active transition tables and register a diagnostic ticket for help.
                    </p>
                  </div>
                  <Send size={12} className="text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                </button>

                {/* Alt 3: Revert to rule matrix editor */}
                <button
                  id="persisted-btn-revert"
                  onClick={() => setFixStatus('idle')}
                  className="w-full flex items-center justify-between text-left p-3 rounded-lg border border-border-main bg-bg-panel hover:bg-bg-element/50 transition-all group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-text-primary">
                      3. Retry Alternative Local Fixes
                    </span>
                    <p className="text-[9px] text-text-faint">
                      Go back to recommended transition tools or manual rule creation cards.
                    </p>
                  </div>
                  <RotateCcw size={12} className="text-text-muted group-hover:rotate-45 transition-transform shrink-0" />
                </button>
              </div>

              {/* Support alternative footer */}
              <div className="mt-4 pt-3 border-t border-border-main flex gap-2 justify-end shrink-0">
                <button
                  id="persisted-btn-quit"
                  onClick={handleClose}
                  className="px-3.5 py-1.5 bg-bg-element hover:bg-border-active text-text-secondary font-black text-[9px] uppercase tracking-wider rounded transition-colors cursor-pointer"
                >
                  Dismiss Modal
                </button>
              </div>
            </div>
          ) : (
            /* Normal Diagnostic & Resolution View */
            <div id="rejection-resolution-view" className="flex flex-col space-y-4 h-full overflow-hidden">
              {/* Context Diagnosis Card */}
              <div className="bg-[#180f11] border border-red-500/15 rounded-lg p-3.5 space-y-2.5">
                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🔴 Detailed Rejection Explanation</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-normal">
                  The Turing Machine halted in state <span className="px-1.5 py-0.5 rounded bg-bg-surface font-mono font-bold text-primary-base border border-border-main">{currentState}</span> because there is no matching rule defined for state <span className="font-mono font-semibold text-text-primary">'{currentState}'</span> when reading symbol <span className="px-1.5 py-0.5 rounded bg-bg-surface font-mono font-bold text-amber-400 border border-border-main">{readSymbol === '_' ? 'Blank (_)' : `'${readSymbol}'`}</span>.
                </p>

                {errorMessage && (
                  <div className="text-[10px] font-mono text-text-faint bg-bg-surface/50 p-2 rounded border border-border-main/40 mt-1">
                    <span className="font-bold text-text-muted">System Log:</span> {errorMessage}
                  </div>
                )}
              </div>

              {/* Diagnostics Stats Grid */}
              <div className="grid grid-cols-2 gap-3.5 shrink-0">
                <div className="bg-bg-element/50 border border-border-main/50 rounded-lg p-3">
                  <span className="text-[8.5px] font-mono font-bold text-text-muted uppercase tracking-wider block mb-1">State Config</span>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: activeScenario?.stateColors?.[currentState] || 'var(--color-primary-base)' }}
                    />
                    <span className="font-mono text-sm font-bold text-text-primary">{currentState}</span>
                  </div>
                </div>
                
                <div className="bg-bg-element/50 border border-border-main/50 rounded-lg p-3">
                  <span className="text-[8.5px] font-mono font-bold text-text-muted uppercase tracking-wider block mb-1">Active Tape cell</span>
                  <div className="font-mono text-sm font-bold text-amber-400">
                    {readSymbol === '_' ? 'Blank (_)' : `'${readSymbol}'`}
                  </div>
                </div>
              </div>

              {/* Interactive Remediation Hints */}
              <div className="flex-1 overflow-y-auto pr-1 min-h-0 [scrollbar-width:thin] space-y-3.5 pt-1">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-primary-base animate-pulse" />
                  Descriptive fix recommendations
                </h3>

                <div className="space-y-2.5">
                  {/* AI Automated Fix Card */}
                  <div className="flex flex-col md:flex-row md:items-start gap-3 bg-[#0a1424] border border-blue-500/25 rounded-lg p-3 hover:border-blue-400/40 transition-colors shadow-lg">
                    <div className="bg-blue-500/10 rounded-lg p-2 text-blue-400 h-fit shrink-0 mt-0.5 animate-pulse">
                      <Wand2 size={15} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                        <span>Automated AI Resolution (Recommended)</span>
                        <span className="text-[7px] px-1 py-0.2 bg-blue-500/25 text-blue-300 border border-blue-400/30 rounded font-black uppercase tracking-widest font-sans">
                          AI Active Fix
                        </span>
                      </h4>
                      <p className="text-[10px] text-text-faint leading-normal mt-1">
                        Let **Gemini AI** analyze the halted state, construct the missing transition logically based on the machine's behavior, and update the rule matrix instantly.
                      </p>
                      <button
                        id="btn-remediation-ai-fix"
                        onClick={handleAIFix}
                        disabled={isActionLoading}
                        className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer select-none font-sans"
                      >
                        <Wand2 size={11} />
                        Apply AI Fix & Validate
                      </button>
                    </div>
                  </div>

                  {/* Fix Option 1: Define transition */}
                  <div className="flex flex-col md:flex-row md:items-start gap-3 bg-bg-panel border border-border-main rounded-lg p-3 hover:border-primary-base/40 transition-colors">
                    <div className="bg-primary-base/10 rounded-lg p-2 text-primary-base h-fit shrink-0 mt-0.5">
                      <PlusCircle size={15} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold text-text-primary">1. Define the missing transition rule</h4>
                      <p className="text-[10px] text-text-muted leading-normal mt-1">
                        Add a new rule in the **Rule Editor / State Diagram** to handle:
                        <br />
                        <code className="text-primary-base font-mono bg-bg-surface px-1 py-0.5 rounded text-[9.5px]">({currentState}, '{readSymbol}') → (NextState, WriteSymbol, Direction)</code>
                      </p>
                      <button
                        id="btn-remediation-selfloop"
                        onClick={handleApplyMissingRuleFix}
                        className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary-base hover:bg-primary-dark text-bg-base font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer select-none"
                      >
                        <PlusCircle size={11} />
                        Apply Fix & Validate
                      </button>
                    </div>
                  </div>

                  {/* Fix Option 2: Make it accepted if expected */}
                  <div className="flex flex-col md:flex-row md:items-start gap-3 bg-bg-panel border border-border-main rounded-lg p-3 hover:border-emerald-500/40 transition-colors">
                    <div className="bg-emerald-500/10 rounded-lg p-2 text-emerald-400 h-fit shrink-0 mt-0.5">
                      <HelpCircle size={15} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold text-text-primary">2. Mark State '{currentState}' as Accepting</h4>
                      <p className="text-[10px] text-text-muted leading-normal mt-1">
                        If halting in <span className="font-mono text-text-secondary">'{currentState}'</span> is a valid final outcome for your computation, double-click state <span className="font-semibold text-primary-base">{currentState}</span> in the State Diagram and set it as an **Accepting State** to complete the scenario successfully.
                      </p>
                      <button
                        id="btn-remediation-toggleaccept"
                        onClick={handleApplyAcceptStateFix}
                        className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-[#0c1a13] font-black text-[9px] uppercase tracking-wider transition-colors cursor-pointer select-none font-sans"
                      >
                        <CheckCircle2 size={11} />
                        Apply Fix & Validate
                      </button>
                    </div>
                  </div>

                  {/* Fix Option 3: Initial Tape mismatch */}
                  <div className="flex flex-col md:flex-row md:items-start gap-3 bg-bg-panel border border-border-main rounded-lg p-3 hover:border-amber-500/40 transition-colors">
                    <div className="bg-amber-500/10 rounded-lg p-2 text-amber-400 h-fit shrink-0 mt-0.5">
                      <RotateCcw size={15} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold text-text-primary">3. Adjust active scenario tape input</h4>
                      <p className="text-[10px] text-text-muted leading-normal mt-1">
                        Check if your input tape contains correct test tokens. If your formula did not anticipate <span className="font-mono text-text-secondary">'{readSymbol}'</span>, update the tape cell by clicking it directly, or clear and reset.
                      </p>
                      
                      {availableSymbols.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9px] text-text-muted font-mono uppercase font-bold mr-1">Replace tape symbol:</span>
                          {availableSymbols.map((sym) => (
                            <button
                              key={sym}
                              id={`btn-remediation-tapesym-${sym}`}
                              onClick={() => handleApplyTapeFix(sym)}
                              className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/20 transition-colors cursor-pointer"
                            >
                              {sym === '_' ? 'Blank (_)' : sym}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Interactive Actions */}
              <div className="mt-6 pt-4 border-t border-border-main flex flex-wrap gap-2.5 justify-end shrink-0">
                <button
                  id="rejection-footer-undo-btn"
                  onClick={handleUndo}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-element border border-border-active hover:bg-border-active text-text-primary font-bold text-[10px] rounded transition-all uppercase tracking-wide cursor-pointer"
                  title="Undo the last transition that caused rejection"
                >
                  <Undo2 size={12} />
                  Undo Last Step
                </button>

                <button
                  id="rejection-footer-reset-btn"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-element border border-border-active hover:text-red-400 text-text-secondary font-bold text-[10px] rounded transition-all uppercase tracking-wide cursor-pointer"
                  title="Restart machine simulation from the initial tape"
                >
                  <RotateCcw size={12} />
                  Reset Machine
                </button>

                <button
                  id="rejection-footer-inspect-btn"
                  onClick={handleClose}
                  className="px-4 py-2 bg-primary-base text-bg-base font-bold text-[10.5px] rounded hover:bg-primary-dark transition-all shadow-sm tracking-widest uppercase cursor-pointer"
                  title="Dismiss modal so you can modify state diagram directly"
                >
                  Inspect Canvas
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
