/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useRef } from 'react';
import { Send, Image as ImageIcon, Paperclip, Smile } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

import EmojiPicker from 'emoji-picker-react';

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const activeTab = useChatStore((s: { activeTab: any; }) => s.activeTab);
  const selectedUserId = useChatStore((s: { selectedUserId: any; }) => s.selectedUserId);
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
    setShowEmoji(false);
  }, [message, disabled, socket, currentUser, activeTab, selectedUserId]);

  const onEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled || !socket || !currentUser) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/chat/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { publicUrl, fileName } = res.data;

      const msgData = {
        senderId: currentUser.id,
        senderName: currentUser.name,
        content: `Đã gửi tệp đính kèm: ${fileName}`,
        fileUrl: publicUrl
      };

      if (activeTab === 'forum') {
        socket.emit('send_forum_message', msgData);
      } else {
        socket.emit('send_message', {
          ...msgData,
          receiverId: String(selectedUserId),
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Không thể upload file!');
    } finally {
      setIsUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="p-4 bg-slate-950/50 border-t border-slate-800 backdrop-blur-md relative">
      {showEmoji && (
        <div className="absolute bottom-full right-4 mb-2 z-50 shadow-2xl rounded-lg overflow-hidden border border-slate-700">
        
          <EmojiPicker onEmojiClick={onEmojiClick} theme={'dark' as any} />
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input 
          type="file" 
          ref={imageInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        
        <div className="flex gap-1 p-2">
          <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-400 hover:text-[#e8732c] hover:bg-[#e8732c]/10 rounded-full transition" disabled={disabled || isUploading}>
            <ImageIcon className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-full transition" disabled={disabled || isUploading}>
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex items-center px-4 py-1 focus-within:border-[#e8732c] focus-within:ring-1 focus-within:ring-[#e8732c] transition">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={disabled}
            placeholder={activeTab === 'forum' ? 'Nhập tin nhắn thảo luận...' : 'Nhập tin nhắn...'}
            className="flex-1 bg-transparent border-none text-white focus:outline-none py-2 text-sm disabled:opacity-50"
          />
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} className={`p-2 transition ${showEmoji ? 'text-[#e8732c]' : 'text-slate-400 hover:text-[#e8732c]'}`} disabled={disabled}>
            <Smile className="w-5 h-5" />
          </button>
        </div>
        
        <button 
          type="submit" 
          disabled={!message.trim() || disabled || isUploading}
          className="p-3 bg-[#e8732c] hover:bg-[#f5882e] text-slate-950 rounded-full transition disabled:opacity-50 disabled:hover:bg-[#e8732c] shadow-lg shadow-[#e8732c]/20"
        >
          {isUploading ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
