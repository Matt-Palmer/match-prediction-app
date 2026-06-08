import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  bgBody: string;
  bgCard: string;
  bgInput: string;
  border: string;
  borderHover: string;
  textPrimary: string;
  textSecondary: string;
  textHeading: string;
  accent: string;
  accentHover: string;
  accentBg: string;
  green: string;
  greenText: string;
  greenBg: string;
  red: string;
  redText: string;
  redBg: string;
  grey: string;
  headerBgStart: string;
  headerBgEnd: string;
  headerBorder: string;
  hoverRow: string;
  skeletonA: string;
  skeletonB: string;
  amber: string;
}

export const darkColors: ThemeColors = {
  bgBody: '#0f1923',
  bgCard: '#161b22',
  bgInput: '#0d1117',
  border: '#30363d',
  borderHover: '#58a6ff',
  textPrimary: '#e1e4e8',
  textSecondary: '#8b949e',
  textHeading: '#c9d1d9',
  accent: '#58a6ff',
  accentHover: '#388bfd',
  accentBg: '#1f6feb',
  green: '#238636',
  greenText: '#3fb950',
  greenBg: 'rgba(35,134,54,0.15)',
  red: '#da3633',
  redText: '#f85149',
  redBg: 'rgba(218,54,51,0.15)',
  grey: '#6e7681',
  headerBgStart: '#1a2a3a',
  headerBgEnd: '#0d1b2a',
  headerBorder: '#1f6feb',
  hoverRow: '#1c2533',
  skeletonA: '#21262d',
  skeletonB: '#30363d',
  amber: '#d29922',
};

export const lightColors: ThemeColors = {
  bgBody: '#f6f8fa',
  bgCard: '#ffffff',
  bgInput: '#f0f2f5',
  border: '#d0d7de',
  borderHover: '#0969da',
  textPrimary: '#1f2328',
  textSecondary: '#656d76',
  textHeading: '#24292f',
  accent: '#0969da',
  accentHover: '#0550ae',
  accentBg: '#0969da',
  green: '#1a7f37',
  greenText: '#1a7f37',
  greenBg: 'rgba(26,127,55,0.1)',
  red: '#cf222e',
  redText: '#cf222e',
  redBg: 'rgba(207,34,46,0.1)',
  grey: '#6e7781',
  headerBgStart: '#24292f',
  headerBgEnd: '#1c2128',
  headerBorder: '#0969da',
  hoverRow: '#f3f4f6',
  skeletonA: '#e1e4e8',
  skeletonB: '#d0d7de',
  amber: '#d29922',
};

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: darkColors,
  toggle: () => {},
});

const STORAGE_KEY = '@theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
  }, []);

  const toggle = useCallback(() => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
