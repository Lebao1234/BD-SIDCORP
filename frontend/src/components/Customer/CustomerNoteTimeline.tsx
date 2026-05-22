import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, AtSign, Clock } from 'lucide-react';
import api from '../../services/api';
import { User } from '../../context/AuthContext';

interface Note {
  id?: string;
  _id?: string;
  customerId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface CustomerNoteTimelineProps {
  customerId: string;
  notes: Note[];
  onNoteAdded: (newNote: Note) => void;
}

export const CustomerNoteTimeline: React.FC<CustomerNoteTimelineProps> = ({ customerId, notes, onNoteAdded }) => {
  const [content, setContent] = useState('');
  const [team, setTeam] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Tải danh sách user trong team để gợi ý tag
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await api.get('/users');
        setTeam(response.data);
      } catch (err) {
        console.error('Không thể lấy danh sách team:', err);
      }
    };
    fetchTeam();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await api.post('/notes', {
        customer_id: customerId,
        content: content.trim()
      });
      // Map the backend response (Exchange) to frontend Note interface
      const data = response.data;
      const newNote: Note = {
        id: data.id,
        customerId: data.customer_id,
        authorId: data.writer_id || data.writer?.id,
        authorName: data.writer?.name || 'Unknown',
        content: data.content,
        createdAt: data.created_at,
      };
      
      onNoteAdded(newNote);
      setContent('');
    } catch (err) {
      console.error('Không thể thêm ghi chú:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm render nội dung note: Xử lý chuỗi theo định dạng react-mentions @[name](id)
  const renderNoteContent = (text: string) => {
    const mentionRegex = /(@\[.+?\]\([^)]+\))/g;
    const parts = text.split(mentionRegex);
    return parts.map((part, index) => {
      const match = part.match(/@\[(.+?)\]\((.+?)\)/);
      if (match) {
        const display = match[1];
        return (
          <span 
            key={index} 
            className="bg-yellow-500/20 text-yellow-400 font-bold px-1.5 py-0.5 rounded border border-yellow-500/20 text-xs inline-block mx-0.5 shadow-sm"
          >
            @{display}
          </span>
        );
      }
      
      // Cho tính tương thích ngược với các ghi chú cũ dùng @username
      const legacyMatch = part.match(/^@\w+/);
      if (legacyMatch) {
         return (
          <span 
            key={index} 
            className="bg-yellow-500/20 text-yellow-400 font-bold px-1.5 py-0.5 rounded border border-yellow-500/20 text-xs inline-block mx-0.5 shadow-sm"
          >
            {part}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="glass-panel p-6 rounded-2xl shadow-xl w-full flex flex-col h-[560px]">
      <h2 className="text-xl font-bold flex items-center gap-2 text-white mb-4 pb-4 border-b border-slate-800 shrink-0">
        <MessageSquare className="w-5 h-5 text-yellow-500" />
        Note & Lịch sử tương tác
      </h2>

      {/* Timeline (Scroll Area) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
        {notes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Chưa có ghi chú tương tác nào với khách hàng này.
          </div>
        ) : (
          <div className="relative border-l border-slate-800 ml-3 pl-5 space-y-5">
            {notes.map((note, idx) => (
              <div key={note.id || note._id || idx} className="relative group animate-fade-in">
                {/* Dấu tròn timeline */}
                <div className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-slate-800 border-2 border-yellow-500 group-hover:scale-125 transition" />
                
                <div className="glass-card p-3.5 rounded-xl text-sm border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-200 text-xs">{note.authorName}</span>
                    <span className="text-slate-500 text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.createdAt).toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                    {renderNoteContent(note.content)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Box */}
      <form onSubmit={handleSubmit} className="relative shrink-0 mt-auto border-t border-slate-800/80 pt-4">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập ghi chú (Gõ @Tên để tag nhân viên)..."
            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-4 py-3 text-[#e2e8f0] focus:outline-none focus:border-yellow-500 transition resize-none min-h-[48px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="absolute right-3.5 top-3.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-30 disabled:hover:bg-yellow-600 text-white p-2 rounded-lg transition active:scale-95 z-10"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
