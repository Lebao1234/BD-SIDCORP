import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'dark' | 'light' | 'luxury-dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as ThemeType) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    const root = document.documentElement;

    if (theme === 'dark' || theme === 'luxury-dark') {
      root.classList.add('dark', 'theme-luxury-dark');
      root.classList.remove('theme-light', 'light');
      document.body.classList.add('dark', 'theme-luxury-dark');
      document.body.classList.remove('theme-light', 'light');
    } else {
      root.classList.add('light', 'theme-light');
      root.classList.remove('dark', 'theme-luxury-dark');
      document.body.classList.add('light', 'theme-light');
      document.body.classList.remove('dark', 'theme-luxury-dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' || prev === 'luxury-dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
