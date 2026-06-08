import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TMScenario } from '../types/tm';

export interface ScenariosState {
  activeScenarios: TMScenario[];
  customScenarios: TMScenario[];
  scenarioProgress: Record<string, 'Not Started' | 'In-Progress' | 'Completed'>;
  addActiveScenario: (scenario: TMScenario) => void;
  removeActiveScenario: (id: string) => void;
  clearActiveScenarios: () => void;
  updateScenarioProgress: (id: string, progress: 'Not Started' | 'In-Progress' | 'Completed') => void;
  updateScenario: (scenario: TMScenario) => void;
  addCustomScenario: (scenario: TMScenario) => void;
}

export const useScenariosStore = create<ScenariosState>()(
  persist(
    (set) => ({
      activeScenarios: [],
      customScenarios: [],
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
      })),
      updateScenario: (scenario) => set((state) => ({
        activeScenarios: state.activeScenarios.map(s => s.id === scenario.id ? scenario : s)
      })),
      addCustomScenario: (scenario) => set((state) => ({
        customScenarios: [...state.customScenarios, scenario]
      }))
    }),
    {
      name: 'turing-active-scenarios',
    }
  )
);
