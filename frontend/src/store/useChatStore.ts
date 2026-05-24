import { create } from 'zustand';
import api from '../services/api';
import { User } from '../context/AuthContext';
import { ChatMessage } from '../components/Chat/ChatMessages';

export type ChatTab = 'dm' | 'forum';

interface ChatState {
  // ── DM State ───────────────────────────────────────────────────────────────
  contacts: User[];
  selectedUserId: number | null;
  messages: ChatMessage[];
  isLoadingMessages: boolean;

  // ── Forum State ────────────────────────────────────────────────────────────
  activeTab: ChatTab;
  forumMessages: ChatMessage[];
  isLoadingForum: boolean;

  // ── Setters ────────────────────────────────────────────────────────────────
  setContacts: (contacts: User[]) => void;
  setSelectedUserId: (id: number | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setIsLoadingMessages: (isLoading: boolean) => void;

  setActiveTab: (tab: ChatTab) => void;
  setForumMessages: (messages: ChatMessage[]) => void;
  addForumMessage: (message: ChatMessage) => void;

  // ── Async Actions ──────────────────────────────────────────────────────────
  fetchContacts: (currentUserId?: number) => Promise<void>;
  fetchMessageHistory: (userId: number) => Promise<void>;
  fetchForumHistory: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set) => ({
  // ── DM State ───────────────────────────────────────────────────────────────
  contacts: [],
  selectedUserId: null,
  messages: [],
  isLoadingMessages: false,

  // ── Forum State ────────────────────────────────────────────────────────────
  activeTab: 'dm',
  forumMessages: [],
  isLoadingForum: false,

  // ── Setters ────────────────────────────────────────────────────────────────
  setContacts: (contacts) => set({ contacts }),
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setIsLoadingMessages: (isLoading) => set({ isLoadingMessages: isLoading }),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setForumMessages: (messages) => set({ forumMessages: messages }),
  addForumMessage: (message) => set((state) => ({ forumMessages: [...state.forumMessages, message] })),

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
}));

// ── Derived selectors ────────────────────────────────────────────────────────
export const useSelectedUser = (): User | null => {
  const contacts = useChatStore((s) => s.contacts);
  const selectedUserId = useChatStore((s) => s.selectedUserId);
  return contacts.find((u) => Number(u.id) === selectedUserId) || null;
};
