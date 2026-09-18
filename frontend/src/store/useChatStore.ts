import { create } from 'zustand';
import api from '../services/api';
import { User } from '../types';
import { ChatMessage } from '../components/Chat/ChatMessages';
import { persist } from 'zustand/middleware';

export type ChatTab = 'dm' | 'forum';

export interface ConversationItem {
  content: string;
  created_at: string;
  sender_id: number;
  receiver_id: number;
  file_url?: string | null;
  is_revoked?: boolean;
}

interface ChatState {
  // ── DM State ───────────────────────────────────────────────────────────────
  contacts: User[];
  selectedUserId: number | null;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  unreadCounts: Record<number, number>;
  conversations: Record<number, ConversationItem>;

  // ── Forum State ────────────────────────────────────────────────────────────
  activeTab: ChatTab;
  forumMessages: ChatMessage[];
  isLoadingForum: boolean;
  unreadForumCount: number;
  lastForumMessage: ChatMessage | null;

  // ── Setters ────────────────────────────────────────────────────────────────
  setContacts: (contacts: User[]) => void;
  setSelectedUserId: (id: number | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage, currentUserId?: number) => void;
  revokeMessage: (messageId: string | number) => void;
  setIsLoadingMessages: (isLoading: boolean) => void;
  incrementUnread: (userId: number) => void;
  clearUnread: (userId: number) => void;

  setActiveTab: (tab: ChatTab) => void;
  setForumMessages: (messages: ChatMessage[]) => void;
  addForumMessage: (message: ChatMessage, currentUserId?: number) => void;
  incrementForumUnread: () => void;
  clearForumUnread: () => void;

  // ── Async Actions ──────────────────────────────────────────────────────────
  fetchContacts: (currentUserId?: number) => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchMessageHistory: (userId: number) => Promise<void>;
  fetchForumHistory: () => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // ── DM State ───────────────────────────────────────────────────────────────
      contacts: [],
      selectedUserId: null,
      messages: [],
      isLoadingMessages: false,
      unreadCounts: {},
      conversations: {},

      // ── Forum State ────────────────────────────────────────────────────────────
      activeTab: 'dm',
      forumMessages: [],
      isLoadingForum: false,
      unreadForumCount: 0,
      lastForumMessage: null,

      // ── Setters ────────────────────────────────────────────────────────────────
      setContacts: (contacts) => set({ contacts }),
      setSelectedUserId: (id) => set({ selectedUserId: id }),
      setMessages: (messages) => set({ messages }),

      addMessage: (message, currentUserId) =>
        set((state) => {
          const senderId = Number(message.sender_id);
          const receiverId = Number(message.receiver_id);

          const isSelectedContact =
            state.activeTab === 'dm' &&
            state.selectedUserId !== null &&
            (senderId === state.selectedUserId || receiverId === state.selectedUserId);

          const newMessages = isSelectedContact ? [...state.messages, message] : state.messages;

          // Xác định đối phương trong DM để cập nhật tin nhắn cuối cùng
          const otherId =
            state.selectedUserId !== null && (senderId === state.selectedUserId || receiverId === state.selectedUserId)
              ? (senderId === state.selectedUserId ? senderId : receiverId)
              : currentUserId && senderId === Number(currentUserId)
              ? receiverId
              : senderId;

          const updatedConversations = {
            ...state.conversations,
            [otherId]: {
              content: message.is_revoked
                ? 'Tin nhắn đã bị thu hồi'
                : message.content || 'Đã gửi tệp đính kèm',
              created_at: message.created_at,
              sender_id: message.sender_id,
              receiver_id: message.receiver_id,
              file_url: message.file_url,
              is_revoked: message.is_revoked,
            },
          };

          // Tự động tăng unread nếu là tin nhắn từ người khác gửi tới mà không mở chat với người đó
          let newUnreadCounts = state.unreadCounts;
          if (currentUserId && senderId !== Number(currentUserId) && !isSelectedContact) {
            newUnreadCounts = {
              ...state.unreadCounts,
              [senderId]: (state.unreadCounts[senderId] || 0) + 1,
            };
          }

          return {
            messages: newMessages,
            conversations: updatedConversations,
            unreadCounts: newUnreadCounts,
          };
        }),

      revokeMessage: (messageId) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            String(m.id) === String(messageId) || (m._id && String(m._id) === String(messageId))
              ? { ...m, content: 'Tin nhắn đã bị thu hồi', is_revoked: true }
              : m
          ),
          forumMessages: state.forumMessages.map((m) =>
            String(m.id) === String(messageId) || (m._id && String(m._id) === String(messageId))
              ? { ...m, content: 'Tin nhắn đã bị thu hồi', is_revoked: true }
              : m
          ),
        })),

      setIsLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),

      incrementUnread: (userId) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, [userId]: (state.unreadCounts[userId] || 0) + 1 },
        })),

      clearUnread: (userId) =>
        set((state) => {
          const newCounts = { ...state.unreadCounts };
          delete newCounts[userId];
          return { unreadCounts: newCounts };
        }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setForumMessages: (messages) => set({ forumMessages: messages }),

      addForumMessage: (message, currentUserId) =>
        set((state) => {
          const isFromMe = currentUserId ? Number(message.sender_id) === Number(currentUserId) : false;
          const isViewingForum = state.activeTab === 'forum';

          return {
            forumMessages: [...state.forumMessages, message],
            lastForumMessage: message,
            unreadForumCount: !isFromMe && !isViewingForum ? state.unreadForumCount + 1 : state.unreadForumCount,
          };
        }),
      incrementForumUnread: () =>
        set((state) => ({ unreadForumCount: state.unreadForumCount + 1 })),
      clearForumUnread: () => set({ unreadForumCount: 0 }),

      // ── Async Actions ──────────────────────────────────────────────────────────
      fetchContacts: async (currentUserId) => {
        try {
          const response = await api.get('/users');
          const otherUsers = response.data.filter((u: User) => Number(u.id) !== currentUserId);
          set({ contacts: otherUsers });
        } catch (error) {
          console.error('Lỗi khi lấy danh sách nhân viên:', error);
        }

        // Tự động đồng bộ lịch sử hội thoại gần nhất từ CSDL
        get().fetchConversations();
      },

      fetchConversations: async () => {
        try {
          const res = await api.get('/chat/conversations');
          if (res.data) {
            set({
              conversations: res.data.conversations || {},
              lastForumMessage: res.data.lastForumMessage || null,
            });
          }
        } catch (err) {
          console.error('Lỗi khi đồng bộ hội thoại từ CSDL:', err);
        }
      },

      fetchMessageHistory: async (userId: number) => {
        set({ isLoadingMessages: true });
        try {
          const response = await api.get(`/chat/history/${userId}`);
          set({ messages: response.data });
        } catch (error) {
          console.error('Lỗi khi lấy lịch sử chat:', error);
        } finally {
          set({ isLoadingMessages: false });
        }
      },

      fetchForumHistory: async () => {
        set({ isLoadingForum: true });
        try {
          const response = await api.get('/chat/forum');
          set({ forumMessages: response.data });
          if (response.data && response.data.length > 0) {
            set({ lastForumMessage: response.data[response.data.length - 1] });
          }
        } catch (error) {
          console.error('Lỗi khi lấy lịch sử diễn đàn:', error);
        } finally {
          set({ isLoadingForum: false });
        }
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        contacts: state.contacts,
        activeTab: state.activeTab,
        selectedUserId: state.selectedUserId,
        unreadCounts: state.unreadCounts,
        unreadForumCount: state.unreadForumCount,
      }),
    }
  )
);

// ── Derived selectors ────────────────────────────────────────────────────────
export const useSelectedUser = (): User | null => {
  const contacts = useChatStore((s) => s.contacts);
  const selectedUserId = useChatStore((s) => s.selectedUserId);
  return contacts.find((u) => Number(u.id) === selectedUserId) || null;
};
