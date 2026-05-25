import { create } from 'zustand';
import api from '../services/api';
import { User } from '../types';
import { ChatMessage } from '../components/Chat/ChatMessages';

export type ChatTab = 'dm' | 'forum';

interface ChatState {
  // ── DM State ───────────────────────────────────────────────────────────────
  contacts: User[];
  selectedUserId: number | null;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  unreadCounts: Record<number, number>;

  // ── Forum State ────────────────────────────────────────────────────────────
  activeTab: ChatTab;
  forumMessages: ChatMessage[];
  isLoadingForum: boolean;
  unreadForumCount: number;

  // ── Setters ────────────────────────────────────────────────────────────────
  setContacts: (contacts: User[]) => void;
  setSelectedUserId: (id: number | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  revokeMessage: (messageId: string) => void;
  setIsLoadingMessages: (isLoading: boolean) => void;
  incrementUnread: (userId: number) => void;
  clearUnread: (userId: number) => void;

  setActiveTab: (tab: ChatTab) => void;
  setForumMessages: (messages: ChatMessage[]) => void;
  addForumMessage: (message: ChatMessage) => void;
  incrementForumUnread: () => void;
  clearForumUnread: () => void;

  // ── Async Actions ──────────────────────────────────────────────────────────
  fetchContacts: (currentUserId?: number) => Promise<void>;
  fetchMessageHistory: (userId: number) => Promise<void>;
  fetchForumHistory: () => Promise<void>;
}

import { persist } from 'zustand/middleware';

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      // ── DM State ───────────────────────────────────────────────────────────────
      contacts: [],
      selectedUserId: null,
      messages: [],
      isLoadingMessages: false,
      unreadCounts: {},

      // ── Forum State ────────────────────────────────────────────────────────────
      activeTab: 'dm',
      forumMessages: [],
      isLoadingForum: false,
      unreadForumCount: 0,

      // ── Setters ────────────────────────────────────────────────────────────────
      setContacts: (contacts) => set({ contacts }),
      setSelectedUserId: (id) => set({ selectedUserId: id }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      revokeMessage: (messageId) => set((state) => ({
        messages: state.messages.map(m => (m.id === messageId || m._id === messageId) ? { ...m, is_revoked: true } : m),
        forumMessages: state.forumMessages.map(m => (m.id === messageId || m._id === messageId) ? { ...m, is_revoked: true } : m)
      })),
      setIsLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),
      incrementUnread: (userId) => set((state) => ({
        unreadCounts: { ...state.unreadCounts, [userId]: (state.unreadCounts[userId] || 0) + 1 }
      })),
      clearUnread: (userId) => set((state) => {
        const newCounts = { ...state.unreadCounts };
        delete newCounts[userId];
        return { unreadCounts: newCounts };
      }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setForumMessages: (messages) => set({ forumMessages: messages }),
      addForumMessage: (message) => set((state) => ({ forumMessages: [...state.forumMessages, message] })),
      incrementForumUnread: () => set((state) => ({ unreadForumCount: state.unreadForumCount + 1 })),
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
        } catch (error) {
          console.error('Lỗi khi lấy lịch sử diễn đàn:', error);
        } finally {
          set({ isLoadingForum: false });
        }
      },
    }),
    {
      name: 'chat-storage', // Tên key trong localStorage
      partialize: (state) => ({
        // Chỉ lưu lại những thông tin nhẹ và cần thiết
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
