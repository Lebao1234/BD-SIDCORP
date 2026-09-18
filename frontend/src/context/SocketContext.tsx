import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { withErrorMessage } from '../lib/errors';
import { useChatStore } from '../store/useChatStore';

// Định dạng thông báo nhận được
export interface AppNotification {
  id: string;
  title: string;
  content: string;
  noteContent?: string;      // preview nội dung ghi chú
  authorName?: string;       // tên người tag
  type: string;
  customerId?: string;
  customerName?: string;
  chatUserId?: number;       // id người gửi tin nhắn trực tiếp
  chatTab?: 'dm' | 'forum';  // tab chat (dm hoặc forum)
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
  const { user, token, logout } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastNotification, setToastNotification] = useState<AppNotification | null>(null);

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapNotification = (n: any): AppNotification => ({
    id: n._id || n.id,
    title: n.title || 'Thông báo',
    content: n.content,
    noteContent: n.note_content || undefined,
    authorName: n.author_name || undefined,
    type: n.type,
    customerId: n.ref_customer_id?.toString() || n.customerId?.toString(),
    customerName: n.ref_customer_name || n.customerName || undefined,
    isRead: n.is_read !== undefined ? n.is_read : n.isRead,
    createdAt: n.created_at || n.createdAt,
  });

  // Ba hàm dưới đây NÉM LỖI ra ngoài thay vì nuốt bằng console.error.
  // Trước đây thất bại là im lặng hoàn toàn: người dùng bấm "Đã đọc", không có
  // gì xảy ra, và không có cách nào biết là do mạng hay do bản thân thao tác.
  // Nơi gọi tự quyết định hiển thị lỗi thế nào cho hợp ngữ cảnh của mình.
  const refreshNotifications = async () => {
    if (!user) return;
    await withErrorMessage(async () => {
      const response = await api.get('/notifications');
      setNotifications(response.data.map(mapNotification));
    }, 'Không thể tải danh sách thông báo.');
  };

  const markAsRead = async (id: string) => {
    await withErrorMessage(async () => {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
    }, 'Không thể đánh dấu thông báo đã đọc.');
  };

  const markAllAsRead = async () => {
    await withErrorMessage(async () => {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    }, 'Không thể đánh dấu tất cả thông báo đã đọc.');
  };

  const clearToast = () => setToastNotification(null);

  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(null);
      }
      setNotifications([]);
      setOnlineUsers([]);
      return;
    }

    // Kết nối Socket.io kèm JWT — server tự suy ra danh tính từ token,
    // client không còn tự khai báo userId nữa.
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Token sai/hết hạn: server từ chối bắt tay -> buộc đăng nhập lại
    newSocket.on('connect_error', (err: Error) => {
      console.error('Không thể kết nối Socket.io:', err.message);
      if (/token|xác thực/i.test(err.message)) {
        newSocket.disconnect();
        logout();
      }
    });

    // Lấy thông báo cũ từ Database Postgres.
    // Lần nạp nền này không có chỗ nào để báo lỗi cho người dùng, nên chỉ ghi log;
    // nút "Làm mới" ở trang Thông báo mới là chỗ hiển thị lỗi tử tế.
    refreshNotifications().catch(err =>
      console.error('Không thể nạp thông báo ban đầu:', err)
    );

    // Lắng nghe sự kiện Online/Offline từ Server
    newSocket.on('connect', () => {
      console.log('Đã kết nối Socket.io với Server');
      newSocket.emit('register');
      // Lấy danh sách online ngay khi kết nối
      newSocket.emit('get_online_users');
    });

    // Nhận danh sách user đang online từ server
    newSocket.on('online_users', (userIds: string[]) => {
      setOnlineUsers(userIds);
    });

    // Nhận thông báo Realtime (Mention, Hệ thống, v.v.)
    newSocket.on('notification', (rawNotif: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const newNotif = mapNotification(rawNotif);
      setNotifications(prev => [newNotif, ...prev]);
      setToastNotification(newNotif);
      // Auto-clear toast sau 6 giây
      setTimeout(() => {
        setToastNotification(current => current?.id === newNotif.id ? null : current);
      }, 6000);
    });

    // Nhận tin nhắn chat trực tiếp (DM) Realtime
    newSocket.on('receive_message', (msg: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const currentUid = Number(user.id);
      const senderId = Number(msg.sender_id);

      // Không hiện toast với tin nhắn do chính mình gửi từ tab khác
      if (senderId === currentUid) return;

      const chatStore = useChatStore.getState();
      const isChattingWithSender =
        window.location.pathname === '/chat' &&
        chatStore.activeTab === 'dm' &&
        chatStore.selectedUserId === senderId;

      chatStore.addMessage(msg, currentUid);

      // Nếu không phải đang mở đúng đoạn chat đó thì bật toast thông báo
      if (!isChattingWithSender) {
        const senderName = msg.sender_name || 'Đồng nghiệp';
        const rawContent = msg.content || (msg.file_url ? 'Đã gửi một tệp đính kèm' : 'Tin nhắn mới');
        const preview = rawContent.length > 70 ? `${rawContent.slice(0, 70)}...` : rawContent;

        const chatNotif: AppNotification = {
          id: `msg-${msg.id || msg._id || Date.now()}`,
          title: `Tin nhắn mới từ ${senderName}`,
          content: `${senderName} đã gửi tin nhắn cho bạn: "${preview}"`,
          authorName: senderName,
          type: 'chat_message',
          chatUserId: senderId,
          isRead: false,
          createdAt: msg.created_at || new Date().toISOString(),
        };

        setToastNotification(chatNotif);
        setTimeout(() => {
          setToastNotification(current => current?.id === chatNotif.id ? null : current);
        }, 7000);
      }
    });

    // Nhận tin nhắn nhóm Diễn đàn (Forum) Realtime
    newSocket.on('forum_message', (msg: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const currentUid = Number(user.id);
      const senderId = Number(msg.sender_id);
      if (senderId === currentUid) return;

      const chatStore = useChatStore.getState();
      const isViewingForum =
        window.location.pathname === '/chat' && chatStore.activeTab === 'forum';

      chatStore.addForumMessage(msg, currentUid);

      if (!isViewingForum) {
        const senderName = msg.sender_name || 'Đồng nghiệp';
        const rawContent = msg.content || (msg.file_url ? 'Đã gửi một tệp đính kèm' : 'Tin nhắn mới');
        const preview = rawContent.length > 70 ? `${rawContent.slice(0, 70)}...` : rawContent;

        const forumNotif: AppNotification = {
          id: `forum-${msg.id || msg._id || Date.now()}`,
          title: `Tin nhắn nhóm Design Team`,
          content: `${senderName} nhắn tới nhóm Design Team: "${preview}"`,
          authorName: senderName,
          type: 'chat_forum',
          chatTab: 'forum',
          isRead: false,
          createdAt: msg.created_at || new Date().toISOString(),
        };

        setToastNotification(forumNotif);
        setTimeout(() => {
          setToastNotification(current => current?.id === forumNotif.id ? null : current);
        }, 7000);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

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
