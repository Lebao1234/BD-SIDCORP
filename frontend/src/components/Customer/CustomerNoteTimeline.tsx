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
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tải danh sách user trong team để gợi ý tag
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await api.get('/auth/users');
        setTeam(response.data);
      } catch (err) {
        console.error('Không thể lấy danh sách team:', err);
      }
    };
    fetchTeam();
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Phát hiện ký tự @ để hiển thị danh sách gợi ý
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastWord = textBeforeCursor.split(/[\s\n]+/).pop() || '';

    if (lastWord.startsWith('@')) {
      const searchWord = lastWord.slice(1).toLowerCase();
      // Lọc các user khớp với searchWord
      const filtered = team.filter(u => 
        u.name.toLowerCase().includes(searchWord) || 
        u.email.toLowerCase().includes(searchWord)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertSuggestion = (user: User) => {
    if (!textareaRef.current) return;
    const value = content;
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    
    // Tìm vị trí bắt đầu của chữ @ cuối cùng trước con trỏ
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtPos !== -1) {
      const newText = 
        value.slice(0, lastAtPos) + 
        `@${user.email} ` + 
        value.slice(cursorPosition);
      
      setContent(newText);
      setShowSuggestions(false);
      
      // Tập trung lại và di chuyển con trỏ ra sau chữ vừa chèn
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = lastAtPos + user.email.length + 2; // cộng thêm @ và khoảng trắng
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertSuggestion(suggestions[activeSuggestionIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await api.post('/notes', {
        customerId,
        content: content.trim()
      });
      onNoteAdded(response.data);
      setContent('');
    } catch (err) {
      console.error('Không thể thêm ghi chú:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Hàm render nội dung note: Quét @username để highlight thành dạng badge sáng
  const renderNoteContent = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        // Kiểm tra xem username có trong danh sách team hay không để tránh highlight nhầm
        const isTeamMember = team.some(u => u.name.toLowerCase() === username.toLowerCase());
        
        if (isTeamMember) {
          return (
            <span 
              key={index} 
              className="bg-yellow-500/20 text-yellow-400 font-bold px-1.5 py-0.5 rounded border border-yellow-500/20 text-xs inline-block mx-0.5 shadow-sm"
            >
              {part}
            </span>
          );
        }
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
        {/* Hộp gợi ý Tag thành viên */}
        {showSuggestions && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
            <div className="p-2 border-b border-slate-800 text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <AtSign className="w-3.5 h-3.5" />
              ĐỀ XUẤT THÀNH VIÊN
            </div>
            {suggestions.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertSuggestion(user)}
                className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-yellow-600/10 hover:text-white transition ${
                  idx === activeSuggestionIndex ? 'bg-yellow-600/20 text-yellow-400' : 'text-slate-300'
                }`}
              >
                <span className="font-semibold">{user.name}</span>
                <span className="text-[10px] text-slate-500">@{user.email}</span>
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={2}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition resize-none"
            placeholder="Nhập ghi chú... Gõ '@' để tag thành viên khác"
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="absolute right-3.5 top-3.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-30 disabled:hover:bg-yellow-600 text-white p-2 rounded-lg transition active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
