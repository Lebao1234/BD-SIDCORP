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

  const selectedUserId = useChatStore((s) => s.selectedUserId);
  const activeTab = useChatStore((s) => s.activeTab);
  const setMessages = useChatStore((s) => s.setMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const addForumMessage = useChatStore((s) => s.addForumMessage);
  const fetchContacts = useChatStore((s) => s.fetchContacts);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const fetchMessageHistory = useChatStore((s) => s.fetchMessageHistory);
  const fetchForumHistory = useChatStore((s) => s.fetchForumHistory);

  const clearUnread = useChatStore((s) => s.clearUnread);
  const clearForumUnread = useChatStore((s) => s.clearForumUnread);

  // ── Fetch contacts & conversations khi có user ────────────────────────────
  useEffect(() => {
    if (currentUser) {
      fetchContacts(Number(currentUser.id));
      fetchConversations();
    }
  }, [currentUser, fetchContacts, fetchConversations]);

  // ── Fetch lịch sử DM khi chọn user & xoá unread ───────────────────────────
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }
    fetchMessageHistory(selectedUserId);
    clearUnread(selectedUserId);
  }, [selectedUserId, fetchMessageHistory, setMessages, clearUnread]);

  // ── Fetch lịch sử Forum khi chuyển tab & xoá forum unread ─────────────────
  useEffect(() => {
    if (activeTab === 'forum') {
      fetchForumHistory();
      clearForumUnread();
    }
  }, [activeTab, fetchForumHistory, clearForumUnread]);

  // ── Socket event listeners (chỉ các sự kiện cục bộ, nhận tin đã có SocketContext) ──
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleMessageSent = (msg: ChatMessage) => {
      addMessage(msg, Number(currentUser.id));
    };

    const handleMessageRevoked = (data: { messageId: number | string }) => {
      useChatStore.setState((state) => ({
        messages: state.messages.map((m) =>
          String(m.id) === String(data.messageId) ? { ...m, content: 'Tin nhắn đã bị thu hồi', is_revoked: true } : m
        ),
        forumMessages: state.forumMessages.map((m) =>
          String(m.id) === String(data.messageId) ? { ...m, content: 'Tin nhắn đã bị thu hồi', is_revoked: true } : m
        ),
      }));
    };

    socket.on('message_sent', handleMessageSent);
    socket.on('message_revoked', handleMessageRevoked);

    return () => {
      socket.off('message_sent', handleMessageSent);
      socket.off('message_revoked', handleMessageRevoked);
    };
  }, [socket, currentUser, addMessage]);

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
