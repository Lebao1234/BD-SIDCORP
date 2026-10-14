import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  /** Thay token hiện tại mà không điều hướng — dùng sau khi tự đổi mật khẩu. */
  replaceToken: (token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Chỉ nhận khi có đủ cả token lẫn user; dữ liệu hỏng (JSON lỗi) coi như chưa đăng nhập.
function readStoredAuth(): { token: string; user: User } | null {
  const token = localStorage.getItem('crm_token');
  const storedUser = localStorage.getItem('crm_user');
  if (!token || !storedUser) return null;
  try {
    return { token, user: JSON.parse(storedUser) as User };
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Đọc thông tin đăng nhập từ localStorage ngay lúc khởi tạo state (khi reload trang),
  // không cần effect + một lượt render rỗng trước khi có dữ liệu.
  const [user, setUser] = useState<User | null>(() => readStoredAuth()?.user ?? null);
  const [token, setToken] = useState<string | null>(() => readStoredAuth()?.token ?? null);
  const loading = false;
  const navigate = useNavigate();

  // Bọc trong useCallback để tránh tạo hàm mới mỗi render → tránh re-render
  // toàn bộ cây component dùng useAuth() không cần thiết.
  const login = useCallback((newToken: string, userData: User) => {
    localStorage.setItem('crm_token', newToken);
    localStorage.setItem('crm_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    
    if (userData.role === 'admin' || userData.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  }, [navigate]);

  /**
   * Đổi mật khẩu của chính mình làm vô hiệu mọi token cũ, kể cả token đang
   * dùng. Máy chủ cấp lại một token mới trong cùng response; đổi chỗ nó ở đây
   * để người dùng không bị đá về màn hình đăng nhập ngay sau khi thao tác
   * thành công. Các thiết bị khác vẫn bị đăng xuất, đúng như mong muốn.
   */
  const replaceToken = useCallback((newToken: string) => {
    localStorage.setItem('crm_token', newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...userData };
      localStorage.setItem('crm_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  // useMemo tránh tạo object context mới mỗi render khi các giá trị không đổi.
  // Không có memo này, MỌI component dùng useAuth() bị re-render mỗi lần
  // AuthProvider render (kể cả khi chỉ loading thay đổi).
  const contextValue = useMemo(
    () => ({ user, token, loading, login, replaceToken, logout, updateUser }),
    [user, token, loading, login, replaceToken, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng trong AuthProvider');
  }
  return context;
};
