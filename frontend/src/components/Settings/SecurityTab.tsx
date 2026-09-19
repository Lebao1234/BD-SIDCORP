import React, { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Alert } from '../common/Alert';
import { useFeedback } from '../../hooks/useFeedback';
import type { PasswordFormValues } from '../../hooks/useProfile';
import { PasswordChecklist } from '../common/PasswordChecklist';
import {
  PASSWORD_MIN_LENGTH,
  firstPasswordIssue,
  isPasswordValid,
} from '../../utils/password';
import { useAuth } from '../../context/AuthContext';

interface SecurityTabProps {
  isSubmitting: boolean;
  onChangePassword: (values: PasswordFormValues) => Promise<void>;
}

const FIELD_CLASS =
  'flex items-center h-[32px] px-2.5 border border-[#e0ddd8] dark:border-[#332f2c] rounded-md bg-white dark:bg-[#232120] text-[13px] outline-none focus:border-[#e8732c] transition shadow-2xs';

/**
 * Form đổi mật khẩu.
 *
 * Toàn bộ state của form nằm trong component này thay vì ở trang cha. Trang cha
 * trước đây giữ cả ba ô mật khẩu cùng với hồ sơ, giao diện và thông báo, nên mỗi
 * lần gõ một ký tự mật khẩu là cả trang vẽ lại.
 */
export const SecurityTab: React.FC<SecurityTabProps> = ({ isSubmitting, onChangePassword }) => {
  const { feedback, showSuccess, showError, showErrorFrom, clear } = useFeedback();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword === confirmPassword &&
    isPasswordValid(newPassword, { email: user?.email, name: user?.name });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();

    const issue = firstPasswordIssue(newPassword, { email: user?.email, name: user?.name });
    if (issue) {
      showError(issue);
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword === currentPassword) {
      showError('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }

    try {
      await onChangePassword({ currentPassword, newPassword });
      showSuccess(
        'Đổi mật khẩu thành công. Các thiết bị khác đang đăng nhập bằng mật khẩu cũ đã bị đăng xuất.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showErrorFrom(err, 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-[#1d1c19] border border-[#e6e4e0] dark:border-[#332f2c] rounded-lg overflow-hidden shadow-2xs">
      <div className="flex flex-col gap-0.5 px-4 py-3.5 border-b border-[#efedea] dark:border-[#2a2624]">
        <div className="text-[13px] font-semibold text-[#1c1b19] dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#e8732c]" />
          <span>Bảo mật tài khoản</span>
        </div>
        <div className="text-[11px] text-[#97938c]">
          Đổi mật khẩu định kỳ để bảo vệ dữ liệu khách hàng và thông tin kinh doanh
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Alert feedback={feedback} onDismiss={clear} />

        <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#7d7a73] dark:text-[#97938c]">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#7d7a73] dark:text-[#97938c]">Mật khẩu mới *</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`}
              className={FIELD_CLASS}
            />
            <PasswordChecklist
              password={newPassword}
              owner={{ email: user?.email, name: user?.name }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#7d7a73] dark:text-[#97938c]">
              Xác nhận mật khẩu mới *
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className={FIELD_CLASS}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="flex items-center gap-1.5 h-[30px] px-4 rounded-md bg-[#e8732c] hover:bg-[#d66522] text-white text-xs font-medium transition cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
