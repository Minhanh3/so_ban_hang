import React, { createContext, useContext, useEffect, useState } from 'react';
import { getScopedStorageKey } from '../../services/auth';
import { useAuth } from './AuthContext';

type ThemeContextType = {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [primaryColor, setPrimaryColorState] = useState('#16a34a');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    const scopedKey = getScopedStorageKey('primaryColor', user?.id);
    localStorage.setItem(scopedKey, color);
  };

  useEffect(() => {
    const scopedKey = getScopedStorageKey('primaryColor', user?.id);
    const storedColor = localStorage.getItem(scopedKey) || localStorage.getItem('primaryColor') || '#16a34a';
    setPrimaryColorState(storedColor);

    const scopedThemeKey = getScopedStorageKey('themeMode', user?.id);
    const storedTheme = localStorage.getItem(scopedThemeKey) || localStorage.getItem('themeMode') || 'light';
    setThemeMode(storedTheme === 'dark' ? 'dark' : 'light');
  }, [user?.id]);

  useEffect(() => {
    // Apply the primary color to CSS variables
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    
    // Calculate a light version (5% opacity)
    // We can use a helper to convert hex to rgba or just use a fixed light version if color is standard
    // For arbitrary colors, we can use a CSS color-mix or alpha hex
    document.documentElement.style.setProperty('--primary-light', `${primaryColor}0d`); // 0d is approx 5% opacity
  }, [primaryColor]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    const scopedThemeKey = getScopedStorageKey('themeMode', user?.id);
    localStorage.setItem(scopedThemeKey, themeMode);
  }, [themeMode, user?.id]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor, themeMode, toggleThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
