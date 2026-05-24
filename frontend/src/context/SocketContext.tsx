import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

// Định dạng thông báo nhận được
export interface AppNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  customerId?: string;
  isRead: boolean;
  createdAt: string;
}

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  notifications: AppNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  toastNotification: AppNotification | null;
  clearToast: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastNotification, setToastNotification] = useState<AppNotification | null>(null);

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      const mapped = response.data.map((n: any) => ({
        id: n._id || n.id,
        title: n.title || 'Thông báo',
        content: n.content,
        type: n.type,
        customerId: n.ref_customer_id?.toString() || n.customerId?.toString(),
        isRead: n.is_read !== undefined ? n.is_read : n.isRead,
        createdAt: n.created_at || n.createdAt,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Không thể lấy danh sách thông báo:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
      );
    } catch (err) {
      console.error('Không thể đọc thông báo:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (err) {
      console.error('Không thể đọc tất cả thông báo:', err);
    }
  };

  const clearToast = () => setToastNotification(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(null);
      }
      setNotifications([]);
      setOnlineUsers([]);
      return;
    }

    // Kết nối Socket.io với tham số userId
    const newSocket = io(socketUrl, {
      query: { userId: user.id },
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Lấy thông báo cũ từ Database Postgres
    refreshNotifications();

    // Lắng nghe sự kiện Online/Offline từ Server
    newSocket.on('connect', () => {
      console.log('Đã kết nối Socket.io với Server');
      newSocket.emit('register', user.id);
      // Lấy danh sách online ngay khi kết nối
      newSocket.emit('get_online_users');
    });

    // Nhận danh sách user đang online từ server
    newSocket.on('online_users', (userIds: string[]) => {
      setOnlineUsers(userIds);
    });

    // Nhận thông báo Realtime
    newSocket.on('notification', (rawNotif: any) => {
      const newNotif: AppNotification = {
        id: rawNotif._id || rawNotif.id,
        title: rawNotif.title || 'Thông báo mới',
        content: rawNotif.content,
        type: rawNotif.type,
        customerId: rawNotif.ref_customer_id?.toString() || rawNotif.customerId?.toString(),
        isRead: rawNotif.is_read !== undefined ? rawNotif.is_read : rawNotif.isRead,
        createdAt: rawNotif.created_at || rawNotif.createdAt,
      };

      setNotifications(prev => [newNotif, ...prev]);
      setToastNotification(newNotif);
      
      // Auto-clear toast sau 5 giây
      setTimeout(() => {
        setToastNotification(current => current?.id === newNotif.id ? null : current);
      }, 5000);
    });

    return () => {
      newSocket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SocketContext.Provider value={{
      socket,
      onlineUsers,
      notifications,
      unreadCount,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      toastNotification,
      clearToast
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket phải được dùng trong SocketProvider');
  }
  return context;
};
