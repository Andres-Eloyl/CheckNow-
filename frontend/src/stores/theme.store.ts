'use client';

import { create } from 'zustand';

interface ThemeState {
  primaryColor: string | null;
  secondaryColor: string | null;
  setTheme: (primary: string | null, secondary: string | null) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  primaryColor: null,
  secondaryColor: null,
  setTheme: (primaryColor, secondaryColor) => set({ primaryColor, secondaryColor }),
}));
