import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  type ThemeType,
  THEME_STORAGE_KEY,
  DEFAULT_THEME,
  DARK_CLASSES,
  LIGHT_CLASSES,
  isDarkTheme,
  isLightOnlyPath,
} from '../lib/themeConfig';

export type { ThemeType };

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved as ThemeType) || DEFAULT_THEME;
  });
  const { pathname } = useLocation();

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Trang đăng nhập/đăng ký luôn sáng; rời khỏi đó thì tự trả về lựa chọn đã lưu.
  // Cùng quy tắc với đoạn script trong index.html (sinh từ lib/themeConfig).
  const dark = isDarkTheme(theme) && !isLightOnlyPath(pathname);

  useEffect(() => {
    const [add, remove] = dark ? [DARK_CLASSES, LIGHT_CLASSES] : [LIGHT_CLASSES, DARK_CLASSES];
    for (const el of [document.documentElement, document.body]) {
      el.classList.add(...add);
      el.classList.remove(...remove);
    }
  }, [dark]);

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
