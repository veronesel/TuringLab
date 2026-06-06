import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

export const DARK_SCHEMAS = ['gold', 'cyan', 'purple', 'rose', 'emerald'];
export const LIGHT_SCHEMAS = ['blue', 'violet', 'orange', 'teal', 'pink'];

interface ThemeState {
  themeMode: ThemeMode;
  colorSchema: string;
  setThemeMode: (mode: ThemeMode) => void;
  setColorSchema: (schema: string) => void;
  toggleThemeMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: 'dark',
      colorSchema: 'gold',
      setThemeMode: (mode) => set({ themeMode: mode }),
      setColorSchema: (schema) => set({ colorSchema: schema }),
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
