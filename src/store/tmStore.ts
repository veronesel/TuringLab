import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TMRule, TMScenario, TMHistoryEntry, TMStatistics } from '../types/tm';
import { useScenariosStore } from './scenariosStore';

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
  executionSpeed: number;
  
  // Custom Data
  bookmarks: Record<number, string>; // cellIndex -> bookmark text
  diagramCheckpoints: { id: string; name: string; stepNumber: number; }[];
  symbolAliases: Record<string, string>;

  // History & Debugging
  history: TMHistoryEntry[];
  historyIndex: number;
  stepCount: number;
  visitedStates: Set<string>;
  statistics: TMStatistics;

  // Actions
  loadScenario: (scenario: TMScenario) => void;
  importConfiguration: (config: any) => void;
  setSymbolAliases: (aliases: Record<string, string>) => void;
  setRules: (rules: TMRule[]) => void;
  updateTapeSymbol: (index: number, symbol: string) => void;
  injectTapePattern: (pattern: string) => void;
  updateHeadPosition: (position: number) => void;
  addBookmark: (index: number, text: string) => void;
  removeBookmark: (index: number) => void;
  addDiagramCheckpoint: (name: string) => void;
  removeDiagramCheckpoint: (id: string) => void;
  stepForward: () => void;
  stepBackward: () => void;
  undo: () => void;
  redo: () => void;
  jumpToStep: (stepNumber: number) => void;
  resetMachine: () => void;
  run: () => void;
  pause: () => void;
  setExecutionSpeed: (speed: number) => void;
  updateScenarioPositions: (positions: Record<string, { x: number; y: number }>) => void;
}

const initialStatistics: TMStatistics = {
  stepsExecuted: 0,
  tapeMovements: { R: 0, L: 0, S: 0 },
  symbolsWritten: 0,
  uniqueStatesVisited: 0,
  sessionStartTimeMs: performance.now(),
  totalTimeMs: 0,
  memoryUsage: 0,
};

export const useTMStore = create<TMState>()(
  persist(
    (set, get) => ({
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
      executionSpeed: 500,
      
      history: [],
      historyIndex: 0,
      stepCount: 0,
      visitedStates: new Set(),
      bookmarks: {},
      diagramCheckpoints: [],
      symbolAliases: {},
      statistics: { ...initialStatistics },
      
      importConfiguration: (config) => {
        set({
           activeScenario: {
              id: config.id || 'imported',
              name: config.name || 'Imported Configuration',
              description: config.description || '',
              initialState: config.currentState || 'q0',
              acceptStates: config.acceptStates || [],
              initialTape: '',
              initialHeadPosition: config.headPosition || 0,
              rules: config.rules || []
           },
           rules: config.rules || [],
           tape: config.tape || {},
           headPosition: config.headPosition || 0,
           currentState: config.currentState || 'q0',
           status: 'idle',
           isRunning: false,
           isPaused: false,
           lastRuleId: null,
           errorMessage: null,
           history: [{
              tape: config.tape || {},
              headPosition: config.headPosition || 0,
              currentState: config.currentState || 'q0',
              lastRuleId: null,
              stepCount: 0
           }],
           historyIndex: 0,
           stepCount: 0,
           visitedStates: new Set([config.currentState || 'q0']),
           symbolAliases: config.symbolAliases || {},
           bookmarks: config.bookmarks || {},
           diagramCheckpoints: config.diagramCheckpoints || [],
           statistics: { 
             ...initialStatistics,
             sessionStartTimeMs: performance.now(),
             memoryUsage: Object.keys(config.tape || {}).length * 8,
             uniqueStatesVisited: 1
           }
        });
      },
      
      setSymbolAliases: (aliases) => set({ symbolAliases: aliases }),

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
          historyIndex: 0,
          stepCount: 0,
          visitedStates: new Set([scenario.initialState]),
          statistics: { 
            ...initialStatistics,
            sessionStartTimeMs: performance.now(),
            totalTimeMs: 0,
            memoryUsage: Object.keys(initialTape).length * 8,
            uniqueStatesVisited: 1
          }
        });
      },

      setRules: (rules) => set({ rules }),
      
      updateTapeSymbol: (index, symbol) => set((state) => ({
        tape: { ...state.tape, [index]: symbol }
      })),

      injectTapePattern: (pattern) => set((state) => {
        const newTape = { ...state.tape };
        let currentIndex = state.headPosition;
        for (let i = 0; i < pattern.length; i++) {
          newTape[currentIndex] = pattern[i] === ' ' ? '_' : pattern[i];
          currentIndex++;
        }
        return { tape: newTape };
      }),

      updateHeadPosition: (position) => set({ headPosition: position }),

      addBookmark: (index, text) => set((state) => ({
        bookmarks: { ...state.bookmarks, [index]: text }
      })),
      
      removeBookmark: (index) => set((state) => {
        const { [index]: _, ...rest } = state.bookmarks;
        return { bookmarks: rest };
      }),

      addDiagramCheckpoint: (name) => set((state) => ({
        diagramCheckpoints: [...state.diagramCheckpoints, {
             id: `cp-${Date.now()}`,
             name,
             stepNumber: state.historyIndex
        }]
      })),

      removeDiagramCheckpoint: (id) => set((state) => ({
        diagramCheckpoints: state.diagramCheckpoints.filter(cp => cp.id !== id)
      })),

      stepForward: () => {
        const { tape, headPosition, currentState, rules, activeScenario, history, historyIndex, stepCount, statistics, visitedStates, status } = get();
        
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
        const stepDuration = performance.now() - statistics.sessionStartTimeMs - statistics.totalTimeMs;
        
        const newStats = {
          stepsExecuted: statistics.stepsExecuted + 1,
          tapeMovements: { 
            ...statistics.tapeMovements, 
            [matchingRule.moveDirection]: statistics.tapeMovements[matchingRule.moveDirection] + 1 
          },
          symbolsWritten: statistics.symbolsWritten + (matchingRule.writeSymbol !== readSymbol ? 1 : 0),
          uniqueStatesVisited: newVisitedStates.size,
          sessionStartTimeMs: statistics.sessionStartTimeMs,
          totalTimeMs: statistics.totalTimeMs + stepDuration,
          memoryUsage: Object.keys(newTape).length * 8 // 8 bytes per cell heuristic
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

        // If we are computing a new step but are not at the end of the history array, trim the future history.
        const newHistory = history.slice(0, historyIndex + 1);
        
        const newStatus = activeScenario?.acceptStates.includes(matchingRule.nextState) ? 'accepted' : 'idle';

        set({
          ...newState,
          history: [...newHistory, newState],
          historyIndex: historyIndex + 1,
          status: newStatus as any
        });

        if (activeScenario) {
            if (newStatus === 'accepted') {
                useScenariosStore.getState().updateScenarioProgress(activeScenario.id, 'Completed');
            } else {
                const currentProgress = useScenariosStore.getState().scenarioProgress[activeScenario.id];
                if (currentProgress !== 'Completed' && currentProgress !== 'In-Progress') {
                    useScenariosStore.getState().updateScenarioProgress(activeScenario.id, 'In-Progress');
                }
            }
        }
      },

      stepBackward: () => {
        get().undo();
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;

        const newIndex = historyIndex - 1;
        const targetState = history[newIndex];

        set({
          tape: targetState.tape,
          headPosition: targetState.headPosition,
          currentState: targetState.currentState,
          lastRuleId: targetState.lastRuleId,
          stepCount: targetState.stepCount,
          historyIndex: newIndex,
          status: 'idle',
          errorMessage: null,
          isRunning: false
        });
      },

      redo: () => {
        const { history, historyIndex, activeScenario } = get();
        if (historyIndex >= history.length - 1) return;

        const newIndex = historyIndex + 1;
        const targetState = history[newIndex];

        set({
          tape: targetState.tape,
          headPosition: targetState.headPosition,
          currentState: targetState.currentState,
          lastRuleId: targetState.lastRuleId,
          stepCount: targetState.stepCount,
          historyIndex: newIndex,
          status: activeScenario?.acceptStates.includes(targetState.currentState) ? 'accepted' : 'idle',
          errorMessage: null
        });
      },

      jumpToStep: (stepNumber) => {
        const { history } = get();
        if (stepNumber < 0 || stepNumber >= history.length) return;

        const targetState = history[stepNumber];
        
        set({
          tape: targetState.tape,
          headPosition: targetState.headPosition,
          currentState: targetState.currentState,
          lastRuleId: targetState.lastRuleId,
          stepCount: targetState.stepCount,
          historyIndex: stepNumber,
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

      run: () => {
         // Check if we are at history end, if so we can just set isRunning
         set({ isRunning: true, isPaused: false });
      },
      pause: () => set({ isRunning: false, isPaused: true }),
      setExecutionSpeed: (speed) => set({ executionSpeed: speed }),
      updateScenarioPositions: (positions) => set((state) => {
        if (!state.activeScenario) return state;
        const newScenario = { ...state.activeScenario, customPositions: { ...state.activeScenario.customPositions, ...positions } };
        
        // Also update in scenariosStore if it exists
        if (state.activeScenario) {
            useScenariosStore.getState().updateScenario(newScenario);
        }

        return { activeScenario: newScenario };
      })
    }),
    {
      name: 'turing-machine-state',
      partialize: (state) => ({
        activeScenario: state.activeScenario,
        rules: state.rules,
        tape: state.tape,
        headPosition: state.headPosition,
        currentState: state.currentState,
        lastRuleId: state.lastRuleId,
        history: state.history,
        historyIndex: state.historyIndex,
        stepCount: state.stepCount,
        visitedStates: Array.from(state.visitedStates),
        status: state.status,
        statistics: state.statistics,
        bookmarks: state.bookmarks,
        diagramCheckpoints: state.diagramCheckpoints,
        symbolAliases: state.symbolAliases
      }),
      merge: (persistedState: any, currentState) => {
        return {
          ...currentState,
          ...persistedState,
          visitedStates: persistedState.visitedStates ? new Set(persistedState.visitedStates) : new Set(),
          isRunning: false,
          isPaused: persistedState.isRunning ? true : persistedState.isPaused
        };
      }
    }
  )
);
