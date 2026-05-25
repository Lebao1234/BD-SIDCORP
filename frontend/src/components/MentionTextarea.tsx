import React, { useState, useRef, useCallback } from 'react';
export interface MentionUser {
  id: string | number;
  name: string;
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
      style={{
        position: 'absolute',
        ...(direction === 'up' ? { bottom: position.top } : { top: position.top }),
        left: position.left,
        zIndex: 9999,
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
        style={{
          width: '100%',
          padding: '12px 16px',
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
          ...style
        }}
        onFocus={e => (e.currentTarget.style.borderColor = '#e8732c')}
        onBlur={e => {
          e.currentTarget.style.borderColor = '#1e293b';
          setTimeout(() => {
            setMentionActive(false);
            setDropdownPos(null);
          }, 150);
        }}
      />
    </div>
  );
};
