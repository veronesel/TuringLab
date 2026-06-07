import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TMScenario } from '../types/tm';

export interface ScenariosState {
  activeScenarios: TMScenario[];
  scenarioProgress: Record<string, 'Not Started' | 'In-Progress' | 'Completed'>;
  addActiveScenario: (scenario: TMScenario) => void;
  removeActiveScenario: (id: string) => void;
  clearActiveScenarios: () => void;
  updateScenarioProgress: (id: string, progress: 'Not Started' | 'In-Progress' | 'Completed') => void;
}

export const useScenariosStore = create<ScenariosState>()(
  persist(
    (set) => ({
      activeScenarios: [],
      scenarioProgress: {},
      addActiveScenario: (scenario) => set((state) => {
        if (state.activeScenarios.some(s => s.id === scenario.id)) {
          return state;
        }
        return { 
          activeScenarios: [...state.activeScenarios, scenario],
          scenarioProgress: { ...state.scenarioProgress, [scenario.id]: state.scenarioProgress[scenario.id] || 'Not Started' }
        };
      }),
      removeActiveScenario: (id) => set((state) => ({
        activeScenarios: state.activeScenarios.filter(s => s.id !== id)
      })),
      clearActiveScenarios: () => set({ activeScenarios: [], scenarioProgress: {} }),
      updateScenarioProgress: (id, progress) => set((state) => ({
        scenarioProgress: { ...state.scenarioProgress, [id]: progress }
      }))
    }),
    {
      name: 'turing-active-scenarios',
    }
  )
);
