import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Clock } from 'lucide-react';
import api from '../../services/api';
import { User } from '../../types';

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

// ─── Custom Mention Textarea ──────────────────────────────────────────────────
// Thay thế react-mentions (không tương thích React 19) bằng textarea thuần + dropdown

interface MentionDropdownProps {
  suggestions: User[];
  query: string;
  position: { top: number; left: number } | null;
  onSelect: (user: User) => void;
}

const MentionDropdown: React.FC<MentionDropdownProps> = ({ suggestions, query, position, onSelect }) => {
  const filtered = suggestions.filter(u =>
    u.name?.toLowerCase().includes(query.toLowerCase())
  );

  if (!position || filtered.length === 0) return null;

  return (
    <ul
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000,
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        maxHeight: '160px',
        overflowY: 'auto',
        minWidth: '180px',
        padding: '4px 0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      {filtered.map(u => (
        <li
          key={u.id}
          onMouseDown={(e) => { e.preventDefault(); onSelect(u); }}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            color: '#cbd5e1',
            fontSize: '12px',
            borderBottom: '1px solid #1e293b',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(232,115,44,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
        >
          <span style={{ color: '#e8732c', fontWeight: 600 }}>@</span>{u.name}
        </li>
      ))}
    </ul>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CustomerNoteTimeline: React.FC<CustomerNoteTimelineProps> = ({ customerId, notes, onNoteAdded }) => {
  const [content, setContent] = useState('');
  const [team, setTeam] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionActive, setMentionActive] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  // Phát hiện trigger @ và tính vị trí dropdown
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursor = e.target.selectionStart ?? 0;
    const textBefore = val.slice(0, cursor);
    const triggerMatch = textBefore.match(/@([\w\sÀ-ỹ]*)$/);

    if (triggerMatch) {
      setMentionQuery(triggerMatch[1]);
      setMentionActive(true);

      // Tính vị trí dropdown dựa vào wrapper
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const textareaRect = textareaRef.current?.getBoundingClientRect();
        if (textareaRect) {
          setDropdownPos({
            top: textareaRect.top - rect.top - 170, // hiện phía trên textarea
            left: 0,
          });
        }
      }
    } else {
      setMentionActive(false);
      setDropdownPos(null);
    }
  }, []);

  const handleMentionSelect = useCallback((user: User) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart ?? 0;
    const textBefore = content.slice(0, cursor);
    const textAfter = content.slice(cursor);

    // Tìm vị trí bắt đầu của @...
    const triggerIdx = textBefore.lastIndexOf('@');
    const before = textBefore.slice(0, triggerIdx);
    const markup = `@${user.name}`;

    const newContent = before + markup + ' ' + textAfter;
    setContent(newContent);
    setMentionActive(false);
    setDropdownPos(null);

    // Focus lại textarea
    setTimeout(() => {
      if (textarea) {
        const newPos = (before + markup + ' ').length;
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [content]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && mentionActive) {
      setMentionActive(false);
      setDropdownPos(null);
    }
    if (e.key === 'Enter' && !e.shiftKey && !mentionActive) {
      e.preventDefault();
      // eslint-disable-next-line react-hooks/immutability
      handleSubmitDirect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentionActive, content, submitting]);

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

  // Render nội dung note: Xử lý chuỗi theo định dạng @[name](id)
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

      // Tương thích ngược với @username cũ
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
        <div className="relative" ref={wrapperRef}>
          {/* Mention Dropdown (custom, no react-mentions) */}
          {mentionActive && (
            <MentionDropdown
              suggestions={team}
              query={mentionQuery}
              position={dropdownPos}
              onSelect={handleMentionSelect}
            />
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập ghi chú (Gõ @Tên để tag nhân viên)..."
            rows={2}
            style={{
              width: '100%',
              padding: '12px 48px 12px 16px',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              outline: 'none',
              fontSize: '13px',
              lineHeight: '1.5',
              resize: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#e8732c')}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#1e293b';
              // Delay để onMouseDown trên dropdown item vẫn kịp fire
              setTimeout(() => {
                setMentionActive(false);
                setDropdownPos(null);
              }, 150);
            }}
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="absolute right-3.5 top-3.5 bg-[#e8732c] hover:bg-[#f5882e] disabled:opacity-30 disabled:hover:bg-[#e8732c] text-white p-2 rounded-lg transition active:scale-95 z-10"
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
