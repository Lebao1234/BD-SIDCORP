import React from 'react';
import { Check, Circle } from 'lucide-react';
import {
  passwordRules,
  passwordStrength,
  type PasswordOwner,
} from '../../utils/password';

interface PasswordChecklistProps {
  password: string;
  owner?: PasswordOwner;
  /** Ẩn hoàn toàn khi ô nhập còn trống, để biểu mẫu không bị rối lúc mới mở */
  hideWhenEmpty?: boolean;
}

const BAR_COLOR: Record<string, string> = {
  weak:   'bg-rose-500',
  fair:   'bg-amber-500',
  strong: 'bg-emerald-500',
};

const TEXT_COLOR: Record<string, string> = {
  weak:   'text-rose-600 dark:text-rose-400',
  fair:   'text-amber-600 dark:text-amber-400',
  strong: 'text-emerald-600 dark:text-emerald-400',
};

/**
 * Danh sách điều kiện của mật khẩu, cập nhật theo từng ký tự.
 *
 * Mục đích là để người dùng biết mình còn thiếu gì TRONG LÚC gõ. Trước đây
 * biểu mẫu chỉ ghi "tối thiểu 6 ký tự" rồi để máy chủ trả lỗi sau khi bấm gửi,
 * nên với một chính sách nhiều điều kiện thì người dùng phải đoán mò.
 */
export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({
  password,
  owner,
  hideWhenEmpty = true,
}) => {
  const rules = passwordRules(password, owner);
  const strength = passwordStrength(password, owner);

  if (hideWhenEmpty && password.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${BAR_COLOR[strength.level]}`}
            style={{ width: `${strength.percent}%` }}
          />
        </div>
        <span className={`text-[11px] font-medium ${TEXT_COLOR[strength.level]}`}>
          {strength.label}
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-[11px] ${
              rule.passed
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {rule.passed ? (
              <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} />
            ) : (
              <Circle className="h-3 w-3 shrink-0" strokeWidth={1.8} />
            )}
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
