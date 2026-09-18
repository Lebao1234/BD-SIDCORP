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

// ─── Memoized Note Item (tránh parse regex & re-render mỗi khi gõ phím vào editor) ──

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

const renderNoteContent = (text: string, team: User[]) => {
  if (!text.includes('@')) return <span>{parseLinks(text)}</span>;

  const mentionedNames = team.filter(u => u.name && text.includes(`@${u.name}`)).map(u => u.name);
  
  if (mentionedNames.length === 0) {
    const mentionRegex = /(@\[.+?\]\([^)]+\))/g;
    const parts = text.split(mentionRegex);
    return parts.map((part, index) => {
      const match = part.match(/@\[(.+?)\]\((.+?)\)/);
      if (match) {
        return (
          <span key={index} className="bg-gray-100 dark:bg-[#282522] text-gray-900 dark:text-gray-100 font-semibold px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-[#3a3532] text-xs inline-block mx-0.5 shadow-2xs">
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
    tokens[token] = name!;
    processedText = processedText.split(`@${name}`).join(token);
  });

  const parts = processedText.split(/(__MENTION_\d+__)/g);
  return parts.map((part, index) => {
    if (tokens[part]) {
      return (
        <span key={index} className="bg-gray-100 dark:bg-[#282522] text-gray-900 dark:text-gray-100 font-semibold px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-[#3a3532] text-xs inline-block mx-0.5 shadow-2xs">
          @{tokens[part]}
        </span>
      );
    }
    return <span key={index}>{parseLinks(part)}</span>;
  });
};

const NoteItem = React.memo<{ note: Note; team: User[] }>(({ note, team }) => (
  <div className="relative group animate-fade-in">
    {/* Dấu tròn timeline */}
    <div className="absolute -left-[26px] top-1.5 w-3 h-3 rounded-full bg-white dark:bg-[#1d1c19] border-2 border-gray-900 dark:border-white group-hover:scale-125 transition" />

    <div className="p-3.5 rounded-xl text-xs border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#232120] shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-gray-900 dark:text-white text-xs">{note.authorName}</span>
        <span className="text-gray-400 dark:text-gray-500 text-[10px] flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(note.createdAt).toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          })}
        </span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xs whitespace-pre-wrap">
        {renderNoteContent(note.content, team)}
      </p>
    </div>
  </div>
));

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
      
      alert('Tải lên file đính kèm thành công!');
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
      alert('Thêm ghi chú thành công!');
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

  return (
    <div className="bg-white dark:bg-[#1d1c19] border border-gray-200 dark:border-[#332f2c] p-6 rounded-2xl shadow-sm w-full flex flex-col h-[560px]">
      <h2 className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-100 dark:border-[#2a2724] shrink-0">
        <MessageSquare className="w-4 h-4 text-gray-900 dark:text-white" />
        Note & Lịch sử tương tác
      </h2>

      {/* Timeline (Scroll Area) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-xs">
            Chưa có ghi chú tương tác nào với khách hàng này.
          </div>
        ) : (
          <div className="relative border-l border-gray-200 dark:border-[#332f2c] ml-3 pl-5 space-y-5">
            {notes.map((note, idx) => (
              <NoteItem key={note.id || note._id || idx} note={note} team={team} />
            ))}
          </div>
        )}
      </div>

      {/* Editor Box */}
      <form onSubmit={handleSubmit} className="relative shrink-0 mt-auto border-t border-gray-100 dark:border-[#2a2724] pt-4">
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
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#232120] rounded-xl transition disabled:opacity-40"
              title="Đính kèm tài liệu"
            >
              {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 disabled:opacity-30 p-2 rounded-xl transition active:scale-95 shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1.5 ml-1">
          Gõ <kbd className="bg-gray-100 dark:bg-[#232120] px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#332f2c]">@Tên</kbd> để tag nhân viên · <kbd className="bg-gray-100 dark:bg-[#232120] px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#332f2c]">Enter</kbd> để gửi · <kbd className="bg-gray-100 dark:bg-[#232120] px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#332f2c]">Shift+Enter</kbd> xuống dòng
        </p>
      </form>
    </div>
  );
};
