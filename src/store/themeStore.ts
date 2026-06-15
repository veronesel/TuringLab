import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';
export type DiagramTheme = 'classic' | 'high-contrast' | 'minimal' | 'vibrant';

export const DARK_SCHEMAS = ['gold', 'cyan', 'purple', 'rose', 'emerald'];
export const LIGHT_SCHEMAS = ['blue', 'violet', 'orange', 'teal', 'pink'];

interface ThemeState {
  themeMode: ThemeMode;
  colorSchema: string;
  diagramTheme: DiagramTheme;
  soundEnabled: boolean;
  autoArrangeEnabled: boolean;
  showExpectedOutcome: boolean;
  showExecutionTimeline: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setColorSchema: (schema: string) => void;
  setDiagramTheme: (theme: DiagramTheme) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAutoArrangeEnabled: (enabled: boolean) => void;
  setShowExpectedOutcome: (show: boolean) => void;
  setShowExecutionTimeline: (show: boolean) => void;
  toggleThemeMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: 'dark',
      colorSchema: 'gold',
      diagramTheme: 'classic',
      soundEnabled: true,
      autoArrangeEnabled: false,
      showExpectedOutcome: false,
      showExecutionTimeline: false,
      setThemeMode: (mode) => set({ themeMode: mode }),
      setColorSchema: (schema) => set({ colorSchema: schema }),
      setDiagramTheme: (theme) => set({ diagramTheme: theme }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setAutoArrangeEnabled: (enabled) => set({ autoArrangeEnabled: enabled }),
      setShowExpectedOutcome: (show) => set({ showExpectedOutcome: show }),
      setShowExecutionTimeline: (show) => set({ showExecutionTimeline: show }),
      toggleThemeMode: () => set((state) => {
        const newMode = state.themeMode === 'dark' ? 'light' : 'dark';
        const newSchema = newMode === 'dark' ? 'gold' : 'blue';
        return { themeMode: newMode, colorSchema: newSchema };
      }),
    }),
    {
      name: 'turing-theme-storage',
    }
  )
);
