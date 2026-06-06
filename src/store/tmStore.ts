import { create } from 'zustand';
import { TMRule, TMScenario, TMHistoryEntry, TMStatistics } from '../types/tm';

export interface TMState {
  // Scenario Data
  activeScenario: TMScenario | null;
  rules: TMRule[];
  
  // Machine State
  tape: Record<number, string>; // cellIndex -> symbol
  headPosition: number;
  currentState: string;
  isRunning: boolean;
  isPaused: boolean;
  status: 'idle' | 'running' | 'paused' | 'accepted' | 'rejected' | 'error';
  lastRuleId: string | null;
  errorMessage: string | null;
  
  // History & Debugging
  history: TMHistoryEntry[];
  stepCount: number;
  visitedStates: Set<string>;
  statistics: TMStatistics;

  // Actions
  loadScenario: (scenario: TMScenario) => void;
  setRules: (rules: TMRule[]) => void;
  updateTapeSymbol: (index: number, symbol: string) => void;
  updateHeadPosition: (position: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToStep: (stepNumber: number) => void;
  resetMachine: () => void;
  run: () => void;
  pause: () => void;
}

const initialStatistics: TMStatistics = {
  stepsExecuted: 0,
  tapeMovements: { R: 0, L: 0, S: 0 },
  symbolsWritten: 0,
  uniqueStatesVisited: 0,
};

export const useTMStore = create<TMState>((set, get) => ({
  activeScenario: null,
  rules: [],
  tape: {},
  headPosition: 0,
  currentState: 'q0',
  isRunning: false,
  isPaused: false,
  status: 'idle',
  lastRuleId: null,
  errorMessage: null,
  
  history: [],
  stepCount: 0,
  visitedStates: new Set(),
  statistics: { ...initialStatistics },

  loadScenario: (scenario) => {
    const initialTape: Record<number, string> = {};
    for (let i = 0; i < scenario.initialTape.length; i++) {
        initialTape[i] = scenario.initialTape[i];
    }
    
    set({
      activeScenario: scenario,
      rules: scenario.rules,
      tape: initialTape,
      headPosition: scenario.initialHeadPosition,
      currentState: scenario.initialState,
      status: 'idle',
      isRunning: false,
      isPaused: false,
      lastRuleId: null,
      errorMessage: null,
      history: [{
        tape: { ...initialTape },
        headPosition: scenario.initialHeadPosition,
        currentState: scenario.initialState,
        lastRuleId: null,
        stepCount: 0
      }],
      stepCount: 0,
      visitedStates: new Set([scenario.initialState]),
      statistics: { 
        ...initialStatistics,
        uniqueStatesVisited: 1
      }
    });
  },

  setRules: (rules) => set({ rules }),
  
  updateTapeSymbol: (index, symbol) => set((state) => ({
    tape: { ...state.tape, [index]: symbol }
  })),

  updateHeadPosition: (position) => set({ headPosition: position }),

  stepForward: () => {
    const { tape, headPosition, currentState, rules, activeScenario, history, stepCount, statistics, visitedStates, status } = get();
    
    if (status === 'accepted' || status === 'rejected' || status === 'error') return;

    const readSymbol = tape[headPosition] || '_';
    
    const matchingRule = rules.find(r => r.currentState === currentState && r.readSymbol === readSymbol);

    if (!matchingRule) {
      if (activeScenario?.acceptStates.includes(currentState)) {
        set({ status: 'accepted', isRunning: false });
      } else {
        set({ status: 'rejected', errorMessage: `No rule found for state '${currentState}' and symbol '${readSymbol}'`, isRunning: false });
      }
      return;
    }

    // Apply rule
    const newTape = { ...tape, [headPosition]: matchingRule.writeSymbol };
    let newHeadPosition = headPosition;
    
    if (matchingRule.moveDirection === 'R') newHeadPosition++;
    else if (matchingRule.moveDirection === 'L') newHeadPosition--;

    const newVisitedStates = new Set(visitedStates).add(matchingRule.nextState);
    
    const newStats = {
      stepsExecuted: statistics.stepsExecuted + 1,
      tapeMovements: { 
        ...statistics.tapeMovements, 
        [matchingRule.moveDirection]: statistics.tapeMovements[matchingRule.moveDirection] + 1 
      },
      symbolsWritten: statistics.symbolsWritten + (matchingRule.writeSymbol !== readSymbol ? 1 : 0),
      uniqueStatesVisited: newVisitedStates.size
    };

    const newState = {
      tape: newTape,
      headPosition: newHeadPosition,
      currentState: matchingRule.nextState,
      lastRuleId: matchingRule.id,
      stepCount: stepCount + 1,
      visitedStates: newVisitedStates,
      statistics: newStats
    };

    set({
      ...newState,
      history: [...history, newState],
      status: activeScenario?.acceptStates.includes(matchingRule.nextState) ? 'accepted' : 'idle'
    });
  },

  stepBackward: () => {
    const { history } = get();
    if (history.length <= 1) return;

    const previousHistory = history.slice(0, -1);
    const previousState = previousHistory[previousHistory.length - 1];

    set({
      tape: previousState.tape,
      headPosition: previousState.headPosition,
      currentState: previousState.currentState,
      lastRuleId: previousState.lastRuleId,
      stepCount: previousState.stepCount,
      history: previousHistory,
      status: 'idle',
      errorMessage: null
    });
  },

  jumpToStep: (stepNumber) => {
    const { history } = get();
    if (stepNumber < 0 || stepNumber >= history.length) return;

    const targetHistory = history.slice(0, stepNumber + 1);
    const targetState = targetHistory[targetHistory.length - 1];

    // Note: Re-calculating visitedStates and statistics efficiently from history could be complex,
    // for simplicity we keep the stats as they were, but reset to the target state logic.
    // To properly time travel stats, we would need to store statistics in TMHistoryEntry.
    // For now we'll just restore the core machine state.
    
    set({
      tape: targetState.tape,
      headPosition: targetState.headPosition,
      currentState: targetState.currentState,
      lastRuleId: targetState.lastRuleId,
      stepCount: targetState.stepCount,
      history: targetHistory,
      status: 'idle',
      errorMessage: null,
      isRunning: false,
      isPaused: true
    });
  },

  resetMachine: () => {
    const { activeScenario } = get();
    if (activeScenario) {
      get().loadScenario(activeScenario);
    }
  },

  run: () => set({ isRunning: true, isPaused: false }),
  pause: () => set({ isRunning: false, isPaused: true })
}));
