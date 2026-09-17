import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'sidebar_collapsed';

interface SidebarContextType {
  collapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const readStored = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // localStorage có thể bị chặn (private mode) — mặc định mở rộng sidebar
    return false;
  }
};

/**
 * Trạng thái thu gọn sidebar được chia sẻ giữa Sidebar và AppLayout.
 *
 * Trước đây mỗi component tự đọc localStorage và AppLayout phải setInterval
 * 300ms để dò thay đổi. Dùng context thì hai bên luôn đồng bộ tức thì và
 * không còn timer chạy nền suốt vòng đời trang.
 */
export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsedState] = useState<boolean>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Không lưu được thì bỏ qua, trạng thái vẫn đúng trong phiên hiện tại
    }
  }, [collapsed]);

  // Đồng bộ khi người dùng mở nhiều tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        setCollapsedState(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleSidebar = useCallback(() => setCollapsedState(prev => !prev), []);
  const setCollapsed = useCallback((value: boolean) => setCollapsedState(value), []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar phải được dùng trong SidebarProvider');
  }
  return context;
};
