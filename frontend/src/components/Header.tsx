import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from './ThemeProvider';
import { Home, MessageSquare, Users, Sun, Moon, LogOut, BarChart2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import logo1 from '../assets/logo-1.png';

interface HeaderProps {
  isAdminPage?: boolean;
  onSelectCustomer?: (customerId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ isAdminPage = false, onSelectCustomer }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return (location.pathname === '/customers' || location.pathname === '/admin/dashboard') && !location.search.includes('tab=company');
    }
    if (path === '/chat') {
      return location.pathname === '/chat';
    }
    if (path === '/customers') {
      return location.pathname === '/customers' && !location.search.includes('tab=company');
    }
    if (path === '/companies') {
      return location.search.includes('tab=company');
    }
    if (path === '/reports') {
      return location.pathname === '/reports';
    }
    return location.pathname === path;
  };

  const getHomeLink = () => {
    return user?.role === 'admin' || user?.role === 'ADMIN' ? '/admin/dashboard' : '/customers';
  };

  return (
    <header className="h-20 bg-[#0d1f33] border-b border-slate-900 flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-50">
      {/* Brand Logo & Info */}
      <div className="flex items-center gap-3 select-none">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-[#e8732c]/20 overflow-hidden p-1">
          <img src={logo1} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-white font-extrabold text-sm tracking-wider uppercase leading-none">SIDCORP</h1>
          <p className="text-[9px] text-yellow-500 font-extrabold tracking-widest mt-1.5 uppercase leading-none">Hệ Thống Nội Bộ</p>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800/80 rounded-full shadow-inner">
        <Link 
          to={getHomeLink()} 
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
            isActive('/dashboard') 
              ? 'bg-[#e8732c]/15 text-[#e8732c] shadow-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Home className="w-4 h-4" />
          Trang chủ
        </Link>
        <Link 
          to="/chat" 
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
            isActive('/chat') 
              ? 'bg-[#e8732c]/15 text-[#e8732c] shadow-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Thảo luận
        </Link>
        <Link 
          to="/customers" 
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
            isActive('/customers') 
              ? 'bg-[#e8732c]/15 text-[#e8732c] shadow-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Users className="w-4 h-4" />
          Khách hàng
        </Link>
        <Link 
          to="/reports" 
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
            isActive('/reports') 
              ? 'bg-[#e8732c]/15 text-[#e8732c] shadow-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Báo cáo
        </Link>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-4">
        {/* User Info */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 group transition-all duration-300"
          onClick={() => navigate(user?.role === 'admin' || user?.role === 'ADMIN' ? '/admin/profile' : '/user/profile')}
          title="Xem hồ sơ cá nhân"
        >
          <div className="w-8 h-8 rounded-full border border-slate-700/80 bg-slate-800/80 text-xs font-semibold text-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:border-[#e8732c]/50 transition">
            {user?.avatar_url || user?.avatarUrl ? (
              <img src={user.avatar_url || user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : user?.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              'U'
            )}
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-white leading-none group-hover:text-yellow-400 transition-colors duration-300">{user?.name || 'Tài khoản'}</div>
            <div className="text-[9px] text-slate-500 font-extrabold tracking-widest mt-1.5 uppercase leading-none">
              @{user?.email || 'EMAIL'} • {user?.role || 'USER'}
            </div>
          </div>
        </div>
        
        {/* Toggle Theme */}
        <button 
          onClick={toggleTheme} 
          className="w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-yellow-400 hover:border-yellow-500/50 hover:bg-slate-900 transition-all duration-300"
          title={theme === 'dark' || theme === 'luxury-dark' ? 'Chuyển sang Giao diện Sáng (Light)' : 'Chuyển sang Giao diện Tối (Dark)'}
        >
          {theme === 'dark' || theme === 'luxury-dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
        </button>

        {/* Realtime Notifications */}
        <NotificationBell 
          onSelectCustomer={onSelectCustomer} 
          isAdminPage={isAdminPage} 
        />

        {/* Logout */}
        <button 
          onClick={handleLogout} 
          className="w-10 h-10 rounded-xl bg-rose-950/10 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-rose-950/30 flex items-center justify-center transition-all duration-300" 
          title="Đăng xuất"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
