'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'steel' | 'pink';

export interface ThemeConfig {
  name: string;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    gradient: {
      from: string;
      to: string;
    };
  };
}

const themes: Record<Theme, ThemeConfig> = {
  dark: {
    name: 'dark',
    displayName: '暗黑肅殺風',
    colors: {
      primary: 'red-600',
      secondary: 'gray-300',
      background: 'gray-900',
      surface: 'gray-800',
      text: 'white',
      textSecondary: 'gray-400',
      border: 'red-600',
      accent: 'red-400',
      gradient: {
        from: 'red-600',
        to: 'red-700',
      },
    },
  },
  steel: {
    name: 'steel',
    displayName: '鋼鐵冷酷風',
    colors: {
      primary: 'cyan-400',
      secondary: 'slate-300',
      background: 'slate-900',
      surface: 'slate-800',
      text: 'white',
      textSecondary: 'slate-400',
      border: 'cyan-500',
      accent: 'cyan-300',
      gradient: {
        from: 'cyan-500',
        to: 'blue-600',
      },
    },
  },
  pink: {
    name: 'pink',
    displayName: '粉嫩少女風',
    colors: {
      primary: 'pink-600',
      secondary: 'rose-500',
      background: 'pink-50',
      surface: 'white',
      text: 'gray-800',
      textSecondary: 'pink-500',
      border: 'pink-300',
      accent: 'pink-400',
      gradient: {
        from: 'pink-400',
        to: 'rose-400',
      },
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // 從 localStorage 讀取保存的主題
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && themes[savedTheme]) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const themeConfig = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { themes };
