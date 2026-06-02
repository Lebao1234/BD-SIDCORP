import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Clock, Paperclip, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { User, Attachment } from '../../types';
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
  onAttachmentUploaded?: (newAttachment: Attachment) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const CustomerNoteTimeline: React.FC<CustomerNoteTimelineProps> = ({ customerId, notes, onNoteAdded, onAttachmentUploaded }) => {
  const [content, setContent] = useState('');
  const [team, setTeam] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('customerId', customerId);
    formData.append('file', file);

    setUploadingFile(true);
    try {
      const response = await api.post('/attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (onAttachmentUploaded) onAttachmentUploaded(response.data);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      const fileUrl = response.data.file_url || response.data.url;
      const fileName = response.data.file_name || response.data.name || file.name;
      setContent(prev => prev + (prev.length > 0 ? '\n' : '') + `Đính kèm: [${fileName}](${fileUrl})`);
    } catch (err) {
      console.error('Không thể upload file:', err);
      alert('Tải file lên thất bại. Vui lòng thử lại.');
    } finally {
      setUploadingFile(false);
    }
  };

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

  // Render nội dung note: Xử lý chuỗi theo định dạng @[name](id) hoặc @Name, và parse links
  const renderNoteContent = (text: string) => {
    // Tách parse link
    const parseLinks = (str: string) => {
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
      const pieces = [];
      let lastIndex = 0;
      let match;
      while ((match = linkRegex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          pieces.push(str.substring(lastIndex, match.index));
        }
        pieces.push(
          <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1 mx-1 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700">
            <Paperclip className="w-3 h-3" />
            {match[1]}
          </a>
        );
        lastIndex = linkRegex.lastIndex;
      }
      if (lastIndex < str.length) {
        pieces.push(str.substring(lastIndex));
      }
      return pieces.length > 0 ? pieces : [str];
    };

    if (!text.includes('@')) return <span>{parseLinks(text)}</span>;

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
        return <span key={index}>{parseLinks(part)}</span>;
      });
    }

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
      return <span key={index}>{parseLinks(part)}</span>;
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="absolute right-3.5 top-2 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="p-2 text-slate-400 hover:text-[#e8732c] hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
              title="Đính kèm tài liệu"
            >
              {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="bg-[#e8732c] hover:bg-[#f5882e] disabled:opacity-30 disabled:hover:bg-[#e8732c] text-white p-2 rounded-lg transition active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-slate-600 text-[10px] mt-1.5 ml-1">
          Gõ <kbd className="bg-slate-800 px-1 rounded text-slate-400">@Tên</kbd> để tag nhân viên · <kbd className="bg-slate-800 px-1 rounded text-slate-400">Enter</kbd> để gửi · <kbd className="bg-slate-800 px-1 rounded text-slate-400">Shift+Enter</kbd> xuống dòng
        </p>
      </form>
    </div>
  );
};
