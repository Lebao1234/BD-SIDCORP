import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeType = 'luxury-dark' | 'light';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('luxury-dark');

  // Currently, the application is strictly styled for 'luxury-dark' using index.css.
  // This provider acts as a foundational setup for future theme switching.
  
  useEffect(() => {
    // In the future, logic to apply theme class to body/html goes here
    if (theme === 'luxury-dark') {
      document.body.classList.add('theme-luxury-dark');
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-luxury-dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'luxury-dark' ? 'light' : 'luxury-dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
