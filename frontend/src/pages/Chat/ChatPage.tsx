import React, { useEffect } from 'react';
import ChatSidebar from '../../components/Chat/ChatSidebar';
import ChatHeader from '../../components/Chat/ChatHeader';
import ChatMessages, { ChatMessage } from '../../components/Chat/ChatMessages';
import ChatInput from '../../components/Chat/ChatInput';
import { useSocket } from '../../context/SocketContext';
import { AppLayout } from '../../components/Layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useChatStore } from '../../store/useChatStore';

const ChatPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();

  // Chỉ subscribe các giá trị trạng thái thực sự cần thiết để trigger effects
  const selectedUserId = useChatStore((s) => s.selectedUserId);
  const activeTab = useChatStore((s) => s.activeTab);

  const currentUserId = currentUser?.id;

  // ── Fetch contacts & conversations khi có user ────────────────────────────
  useEffect(() => {
    if (currentUserId) {
      const store = useChatStore.getState();
      store.fetchContacts(Number(currentUserId));
      store.fetchConversations();
    }
  }, [currentUserId]);

  // ── Fetch lịch sử DM khi chọn user & xoá unread ───────────────────────────
  useEffect(() => {
    const store = useChatStore.getState();
    if (!selectedUserId) {
      store.setMessages([]);
      return;
    }
    store.fetchMessageHistory(selectedUserId);
    store.clearUnread(selectedUserId);
  }, [selectedUserId]);

  // ── Fetch lịch sử Forum khi chuyển tab & xoá forum unread ─────────────────
  useEffect(() => {
    if (activeTab === 'forum') {
      const store = useChatStore.getState();
      store.fetchForumHistory();
      store.clearForumUnread();
    }
  }, [activeTab]);

  // ── Socket event listeners (chỉ các sự kiện cục bộ, nhận tin đã có SocketContext) ──
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleMessageSent = (msg: ChatMessage) => {
      useChatStore.getState().addMessage(msg, Number(currentUserId));
    };

    const handleMessageRevoked = (data: { messageId: number | string }) => {
      useChatStore.getState().revokeMessage(data.messageId);
    };

    socket.on('message_sent', handleMessageSent);
    socket.on('message_revoked', handleMessageRevoked);

    return () => {
      socket.off('message_sent', handleMessageSent);
      socket.off('message_revoked', handleMessageRevoked);
    };
  }, [socket, currentUserId]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="h-[calc(100vh-6.5rem)] bg-white dark:bg-[#1d1c19] rounded-2xl overflow-hidden border border-gray-200 dark:border-[#332f2c] shadow-xs flex">
        <ChatSidebar />
        <div className="flex-1 flex flex-col bg-white dark:bg-[#171614] min-w-0">
          <ChatHeader />
          <ChatMessages />
          <ChatInput />
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
