import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Clock } from 'lucide-react';
import api from '../../services/api';
import { User } from '../../types';
import { MentionTextarea } from '../MentionTextarea';

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

// ─── Main Component ───────────────────────────────────────────────────────────

export const CustomerNoteTimeline: React.FC<CustomerNoteTimelineProps> = ({ customerId, notes, onNoteAdded }) => {
  const [content, setContent] = useState('');
  const [team, setTeam] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Tải danh sách user có thể tag
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await api.get(`/notes/mentionable/${customerId}`);
        setTeam(response.data);
      } catch (err) {
        console.error('Không thể lấy danh sách người dùng để tag:', err);
      }
    };
    if (customerId) {
      fetchTeam();
    }
  }, [customerId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitDirect();
    }
  };

  const handleSubmitDirect = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const response = await api.post('/notes', {
        customer_id: customerId,
        content: content.trim()
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmitDirect();
  };

  // Render nội dung note: Xử lý chuỗi theo định dạng @[name](id) hoặc @Name
  const renderNoteContent = (text: string) => {
    // Nếu không có tag nào, trả về nguyên bản
    if (!text.includes('@')) return <span>{text}</span>;

    // Tìm tất cả các tên trong team có xuất hiện trong text dưới dạng @Name
    const mentionedNames = team.filter(u => u.name && text.includes(`@${u.name}`)).map(u => u.name);
    
    if (mentionedNames.length === 0) {
      // Tương thích ngược với @[Name](id)
      const mentionRegex = /(@\[.+?\]\([^)]+\))/g;
      const parts = text.split(mentionRegex);
      return parts.map((part, index) => {
        const match = part.match(/@\[(.+?)\]\((.+?)\)/);
        if (match) {
          return (
            <span key={index} className="bg-[#e8732c]/20 text-[#e8732c] font-bold px-1.5 py-0.5 rounded border border-[#e8732c]/20 text-xs inline-block mx-0.5 shadow-sm">
              @{match[1]}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      });
    }

    // Replace @Name bằng một token đặc biệt để split
    let processedText = text;
    const tokens: { [key: string]: string } = {};
    mentionedNames.forEach((name, idx) => {
      const token = `__MENTION_${idx}__`;
      tokens[token] = name;
      processedText = processedText.split(`@${name}`).join(token);
    });

    const parts = processedText.split(/(__MENTION_\d+__)/g);
    return parts.map((part, index) => {
      if (tokens[part]) {
        return (
          <span key={index} className="bg-[#e8732c]/20 text-[#e8732c] font-bold px-1.5 py-0.5 rounded border border-[#e8732c]/20 text-xs inline-block mx-0.5 shadow-sm">
            @{tokens[part]}
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
          <MentionTextarea
            value={content}
            onChange={setContent}
            onKeyDown={handleKeyDown}
            placeholder="Nhập ghi chú (Gõ @Tên để tag nhân viên)..."
            users={team}
            dropdownDirection="up"
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="absolute right-3.5 top-3 bg-[#e8732c] hover:bg-[#f5882e] disabled:opacity-30 disabled:hover:bg-[#e8732c] text-white p-2 rounded-lg transition active:scale-95 z-10"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-slate-600 text-[10px] mt-1.5 ml-1">
          Gõ <kbd className="bg-slate-800 px-1 rounded text-slate-400">@Tên</kbd> để tag nhân viên · <kbd className="bg-slate-800 px-1 rounded text-slate-400">Enter</kbd> để gửi · <kbd className="bg-slate-800 px-1 rounded text-slate-400">Shift+Enter</kbd> xuống dòng
        </p>
      </form>
    </div>
  );
};
