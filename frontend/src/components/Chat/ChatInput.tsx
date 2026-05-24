import React, { useState, useCallback } from 'react';
import { Send, Image as ImageIcon, Paperclip, Smile } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const activeTab = useChatStore((s) => s.activeTab);
  const selectedUserId = useChatStore((s) => s.selectedUserId);
  const { socket } = useSocket();
  const { user: currentUser } = useAuth();

  // Forum luôn enabled; DM cần chọn user
  const disabled = activeTab === 'dm' && !selectedUserId;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || !socket || !currentUser) return;

    if (activeTab === 'forum') {
      socket.emit('send_forum_message', {
        senderId: currentUser.id,
        senderName: currentUser.name,
        content: message.trim(),
      });
    } else {
      socket.emit('send_message', {
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: String(selectedUserId),
        content: message.trim(),
      });
    }

    setMessage('');
  }, [message, disabled, socket, currentUser, activeTab, selectedUserId]);

  return (
    <div className="p-4 bg-slate-950 border-t border-slate-800">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex gap-1 p-2">
          <button type="button" className="p-2 text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-full transition" disabled={disabled}>
            <ImageIcon className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-full transition" disabled={disabled}>
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex items-center px-4 py-1 focus-within:border-yellow-500 focus-within:ring-1 focus-within:ring-yellow-500 transition">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled}
            placeholder={activeTab === 'forum' ? 'Nhập tin nhắn thảo luận...' : 'Nhập tin nhắn...'}
            className="flex-1 bg-transparent border-none text-white focus:outline-none py-2 text-sm disabled:opacity-50"
          />
          <button type="button" className="p-2 text-slate-400 hover:text-yellow-500 transition" disabled={disabled}>
            <Smile className="w-5 h-5" />
          </button>
        </div>
        
        <button 
          type="submit" 
          disabled={!message.trim() || disabled}
          className="p-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-full transition disabled:opacity-50 disabled:hover:bg-yellow-500 shadow-lg shadow-yellow-500/20"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
