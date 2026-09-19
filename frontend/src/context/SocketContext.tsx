import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  const refreshNotifications = useCallback(async () => {
    await withErrorMessage(async () => {
      const response = await api.get('/notifications');
      setNotifications(response.data.map(mapNotification));
    }, 'Không thể tải danh sách thông báo.');
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    await withErrorMessage(async () => {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
    }, 'Không thể đánh dấu thông báo đã đọc.');
  }, []);

  const markAllAsRead = useCallback(async () => {
    await withErrorMessage(async () => {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    }, 'Không thể đánh dấu tất cả thông báo đã đọc.');
  }, []);

  const clearToast = useCallback(() => setToastNotification(null), []);

  // Chỉ phụ thuộc vào id chứ không vào cả object `user`: updateUser() (đổi tên,
  // đổi ảnh đại diện) tạo ra một object mới, và nếu effect này phụ thuộc vào đó
  // thì mỗi lần sửa hồ sơ là một lần ngắt rồi mở lại socket — kéo theo server
  // phát `online_users` cho toàn bộ client.
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !token) {
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
      const currentUid = Number(userId);
      const senderId = Number(msg.sender_id);
      const isFromMe = senderId === currentUid;

      const chatStore = useChatStore.getState();
      const isChattingWithSender =
        window.location.pathname === '/chat' &&
        chatStore.activeTab === 'dm' &&
        chatStore.selectedUserId === senderId;

      // Thêm tin nhắn TRƯỚC, kể cả khi do chính mình gửi từ một tab khác.
      // Bản cũ `return` ngay ở đây để khỏi hiện toast, nhưng như vậy là bỏ luôn
      // cả việc thêm vào store — nên mở CRM ở hai tab, nhắn ở tab này thì tab
      // kia không bao giờ thấy tin nhắn đó.
      chatStore.addMessage(msg, currentUid);

      // Toast thì mới cần bỏ qua: không ai muốn được báo về tin của chính mình
      if (!isFromMe && !isChattingWithSender) {
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
      const currentUid = Number(userId);
      const senderId = Number(msg.sender_id);
      const isFromMe = senderId === currentUid;

      const chatStore = useChatStore.getState();
      const isViewingForum =
        window.location.pathname === '/chat' && chatStore.activeTab === 'forum';

      // Kênh diễn đàn chỉ có một sự kiện duy nhất là `forum_message`, máy chủ
      // không gửi kèm `message_sent` như với tin nhắn riêng. Bản cũ `return`
      // ngay khi thấy tin của chính mình, nên tin nhắn bạn vừa gửi vào nhóm
      // KHÔNG hiện trong cửa sổ của chính bạn cho tới khi tải lại trang.
      // `addForumMessage` đã tự biết không tăng số chưa đọc cho tin của mình.
      chatStore.addForumMessage(msg, currentUid);

      if (!isFromMe && !isViewingForum) {
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
  }, [userId, token]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  // Provider này bọc TOÀN BỘ cây route. Không có useMemo thì object `value`
  // là một tham chiếu mới sau mỗi lần render, nên mọi component gọi useSocket()
  // — NotificationBell nằm trên header của mọi trang, GlobalToast, bốn thành
  // phần của trang Chat — đều render lại. Server phát `online_users` cho tất cả
  // client mỗi lần bất kỳ ai kết nối hay ngắt kết nối, nên chỉ cần một người
  // tải lại trang là toàn bộ trình duyệt còn lại vẽ lại cả cây component.
  const contextValue = useMemo(
    () => ({
      socket,
      onlineUsers,
      notifications,
      unreadCount,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      toastNotification,
      clearToast
    }),
    [
      socket,
      onlineUsers,
      notifications,
      unreadCount,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      toastNotification,
      clearToast
    ]
  );

  return (
    <SocketContext.Provider value={contextValue}>
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
