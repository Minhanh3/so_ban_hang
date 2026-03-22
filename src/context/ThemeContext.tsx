import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
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
  const [primaryColor, setPrimaryColorState] = useState(() => {
    return localStorage.getItem('primaryColor') || '#16a34a'; // Default green-600
  });

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    localStorage.setItem('primaryColor', color);
  };

  useEffect(() => {
    // Apply the primary color to CSS variables
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    
    // Calculate a light version (5% opacity)
    // We can use a helper to convert hex to rgba or just use a fixed light version if color is standard
    // For arbitrary colors, we can use a CSS color-mix or alpha hex
    document.documentElement.style.setProperty('--primary-light', `${primaryColor}0d`); // 0d is approx 5% opacity
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};
