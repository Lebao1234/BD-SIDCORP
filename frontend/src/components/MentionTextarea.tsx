import React, { useState, useRef, useCallback } from 'react';
export interface MentionUser {
  id: string | number;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface MentionDropdownProps {
  suggestions: MentionUser[];
  query: string;
  position: { top: number; left: number } | null;
  onSelect: (user: MentionUser) => void;
  direction?: 'up' | 'down';
}

const MentionDropdown: React.FC<MentionDropdownProps> = ({ suggestions, query, position, onSelect, direction = 'up' }) => {
  const filtered = suggestions.filter(u =>
    u.name?.toLowerCase().includes(query.toLowerCase())
  );

  if (!position || filtered.length === 0) return null;

  return (
    <ul
      className="absolute z-50 rounded-xl border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#232120] shadow-xl overflow-y-auto min-w-[200px] max-h-40 py-1"
      style={{
        ...(direction === 'up' ? { bottom: position.top + 6 } : { top: position.top }),
        left: position.left,
      }}
    >
      {filtered.map(u => (
        <li
          key={u.id}
          onMouseDown={(e) => { e.preventDefault(); onSelect(u); }}
          className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2c2a27] cursor-pointer transition flex items-center gap-1.5 border-b border-gray-100 dark:border-[#2a2724] last:border-0"
        >
          <span className="text-gray-900 dark:text-white font-semibold">@</span>
          <span>{u.name}</span>
        </li>
      ))}
    </ul>
  );
};

interface MentionTextareaProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  users: MentionUser[];
  rows?: number;
  dropdownDirection?: 'up' | 'down';
  className?: string;
  style?: React.CSSProperties;
}

export const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  users,
  rows = 2,
  dropdownDirection = 'up',
  className,
  style
}) => {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionActive, setMentionActive] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const cursor = e.target.selectionStart ?? 0;
    const textBefore = val.slice(0, cursor);
    const triggerMatch = textBefore.match(/@([\w\sÀ-ỹ]*)$/);

    if (triggerMatch) {
      setMentionQuery(triggerMatch[1]);
      setMentionActive(true);

      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const textareaRect = textareaRef.current?.getBoundingClientRect();
        if (textareaRect) {
          // Nếu up, khoảng cách so với đỉnh của textarea (hiển thị bằng thuộc tính bottom)
          // Nếu down, khoảng cách hiển thị phía dưới textarea
          setDropdownPos({
            top: dropdownDirection === 'up' ? rect.height : textareaRect.height + 4,
            left: 0, // Căn trái đơn giản
          });
        }
      }
    } else {
      setMentionActive(false);
      setDropdownPos(null);
    }
  }, [onChange, dropdownDirection]);

  const handleMentionSelect = useCallback((user: MentionUser) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart ?? 0;
    const textBefore = value.slice(0, cursor);
    const textAfter = value.slice(cursor);

    const triggerIdx = textBefore.lastIndexOf('@');
    const before = textBefore.slice(0, triggerIdx);
    const markup = `@${user.name}`;

    const newContent = before + markup + ' ' + textAfter;
    onChange(newContent);
    setMentionActive(false);
    setDropdownPos(null);

    setTimeout(() => {
      if (textarea) {
        const newPos = (before + markup + ' ').length;
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [value, onChange]);

  const handleKeyDownInternal = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && mentionActive) {
      setMentionActive(false);
      setDropdownPos(null);
    }
    if (onKeyDown && !mentionActive) {
      onKeyDown(e);
    }
  }, [mentionActive, onKeyDown]);

  return (
    <div className={`relative ${className || ''}`} ref={wrapperRef}>
      {mentionActive && (
        <MentionDropdown
          suggestions={users}
          query={mentionQuery}
          position={dropdownPos}
          onSelect={handleMentionSelect}
          direction={dropdownDirection}
        />
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDownInternal}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-2xl border border-gray-200 dark:border-[#332f2c] bg-white dark:bg-[#1d1c19] px-4 py-3 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition shadow-2xs resize-none leading-relaxed"
        style={style}
        onBlur={() => {
          setTimeout(() => {
            setMentionActive(false);
            setDropdownPos(null);
          }, 150);
        }}
      />
    </div>
  );
};
