import React, { useEffect } from 'react';
import ChatSidebar from '../../components/Chat/ChatSidebar';
import ChatHeader from '../../components/Chat/ChatHeader';
import ChatMessages, { ChatMessage } from '../../components/Chat/ChatMessages';
import ChatInput from '../../components/Chat/ChatInput';
import { useSocket } from '../../context/SocketContext';
import { Header } from '../../components/Header';
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
  const fetchMessageHistory = useChatStore((s) => s.fetchMessageHistory);
  const fetchForumHistory = useChatStore((s) => s.fetchForumHistory);

  // ── Fetch contacts khi có user ─────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      fetchContacts(Number(currentUser.id));
    }
  }, [currentUser, fetchContacts]);

  // ── Fetch lịch sử DM khi chọn user ────────────────────────────────────────
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }
    fetchMessageHistory(selectedUserId);
  }, [selectedUserId, fetchMessageHistory, setMessages]);

  // ── Fetch lịch sử Forum khi chuyển tab ────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'forum') {
      fetchForumHistory();
    }
  }, [activeTab, fetchForumHistory]);

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // DM: nhận tin nhắn từ người khác
    const handleReceiveMessage = (msg: ChatMessage) => {
      const storeState = useChatStore.getState();
      if (
        (Number(msg.sender_id) === storeState.selectedUserId && Number(msg.receiver_id) === Number(currentUser?.id)) ||
        (Number(msg.sender_id) === Number(currentUser?.id) && Number(msg.receiver_id) === storeState.selectedUserId)
      ) {
        addMessage(msg);
      } else if (Number(msg.receiver_id) === Number(currentUser?.id) && storeState.activeTab !== 'dm' || Number(msg.sender_id) !== storeState.selectedUserId) {
        // Increment unread if message is for me, but I don't have the chat open
        storeState.incrementUnread(Number(msg.sender_id));
      }
    };

    // DM: xác nhận tin nhắn đã gửi
    const handleMessageSent = (msg: ChatMessage) => {
      const storeState = useChatStore.getState();
      if (Number(msg.receiver_id) === storeState.selectedUserId) {
        addMessage(msg);
      }
    };

    // Forum: nhận tin nhắn diễn đàn
    const handleForumMessage = (msg: ChatMessage) => {
      const storeState = useChatStore.getState();
      if (storeState.activeTab === 'forum') {
        addForumMessage(msg);
      } else {
        storeState.incrementForumUnread();
      }
    };

    // Revoke
    const handleMessageRevoked = (data: { messageId: string }) => {
      const storeState = useChatStore.getState();
      storeState.revokeMessage(data.messageId);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('forum_message', handleForumMessage);
    socket.on('message_revoked', handleMessageRevoked);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('forum_message', handleForumMessage);
      socket.off('message_revoked', handleMessageRevoked);
    };
  }, [socket, currentUser, addMessage, addForumMessage]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#070b13] overflow-hidden">
      <div className="flex flex-col flex-1 w-full relative z-0">
        <Header />
        <div className="flex flex-1 overflow-hidden mt-20 px-6 pb-6 gap-6">
          <div className="glass-panel w-full flex rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <ChatSidebar />
            <div className="flex-1 flex flex-col bg-slate-950/80">
              <ChatHeader />
              <ChatMessages />
              <ChatInput />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
