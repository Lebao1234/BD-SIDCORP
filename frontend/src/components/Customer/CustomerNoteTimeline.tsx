import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Clock } from 'lucide-react';
import api from '../../services/api';
import { User } from '../../context/AuthContext';
import { MentionsInput, Mention } from 'react-mentions';

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
        // Chỉ lấy admin để tag
        const admins = response.data.filter((u: any) => u.role?.toLowerCase() === 'admin');
        setTeam(admins);
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
            className="bg-[#e8732c]/20 text-[#e8732c] font-bold px-1.5 py-0.5 rounded border border-[#e8732c]/20 text-xs inline-block mx-0.5 shadow-sm"
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
            className="bg-[#e8732c]/20 text-[#e8732c] font-bold px-1.5 py-0.5 rounded border border-[#e8732c]/20 text-xs inline-block mx-0.5 shadow-sm"
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
        <MessageSquare className="w-5 h-5 text-[#e8732c]" />
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
                <div className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-slate-800 border-2 border-[#e8732c] group-hover:scale-125 transition" />
                
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
          <MentionsInput
            value={content ?? ''}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập ghi chú (Gõ @Tên để tag nhân viên)..."
            className="mentions-input-chat"
            style={{
              control: {
                fontSize: '12px',
                fontWeight: 'normal',
              },
              input: {
                padding: '12px 16px',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                outline: 'none',
                minHeight: '48px',
              },
              suggestions: {
                list: {
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  fontSize: 12,
                  borderRadius: '8px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  position: 'absolute',
                  zIndex: 9999
                },
                item: {
                  padding: '8px 12px',
                  borderBottom: '1px solid #1e293b',
                  color: '#cbd5e1'
                },
              },
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onKeyDown={(e: any) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                // If the user is selecting a suggestion, react-mentions will handle it
                const listOpen = document.querySelector('.react-mentions__suggestions__list');
                if (listOpen) return;
                
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          >
            <Mention
              trigger="@"
              markup="@[__display__](__id__)"
              displayTransform={(id, display) => `@${display}`}
              data={team.map(u => ({ id: String(u.id), display: String(u.name) }))}
              style={{
                backgroundColor: 'rgba(232, 115, 44, 0.2)',
                color: '#e8732c',
                borderRadius: '4px',
                padding: '0 2px'
              }}
              renderSuggestion={(suggestion, search, highlightedDisplay) => (
                <div className="hover:text-[#e8732c]" style={{ pointerEvents: 'none' }}>{highlightedDisplay}</div>
              )}
            />
          </MentionsInput>
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="absolute right-3.5 top-3.5 bg-[#e8732c] hover:bg-[#f5882e] disabled:opacity-30 disabled:hover:bg-[#e8732c] text-white p-2 rounded-lg transition active:scale-95 z-10"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
