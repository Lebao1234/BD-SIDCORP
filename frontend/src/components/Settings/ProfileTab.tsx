import React, { useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { Alert } from '../common/Alert';
import { useFeedback } from '../../hooks/useFeedback';
import type { ProfileFormValues } from '../../hooks/useProfile';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

interface ProfileTabProps {
  values: ProfileFormValues;
  onChange: (values: ProfileFormValues) => void;
  email: string;
  avatarUrl: string | null;
  initials: string;
  isSaving: boolean;
  isAvatarBusy: boolean;
  onSubmit: () => void;
  onReset: () => void;
  onUploadAvatar: (file: File) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
}

const FIELD_CLASS =
  'flex items-center h-[32px] px-2.5 border border-[#e0ddd8] dark:border-[#332f2c] rounded-md bg-white dark:bg-[#232120] text-[13px] text-[#1c1b19] dark:text-[#f2f0ed] outline-none focus:border-[#e8732c] dark:focus:border-[#e8732c] transition shadow-2xs';

export const ProfileTab: React.FC<ProfileTabProps> = ({
  values,
  onChange,
  email,
  avatarUrl,
  initials,
  isSaving,
  isAvatarBusy,
  onSubmit,
  onReset,
  onUploadAvatar,
  onRemoveAvatar,
}) => {
  // Lỗi của riêng ảnh đại diện hiện ngay cạnh ô ảnh, tách khỏi băng thông báo
  // chung của trang để người dùng thấy đúng chỗ vừa thao tác.
  const { feedback: avatarFeedback, showError, showErrorFrom, clear } = useFeedback();
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Cho phép chọn lại đúng file vừa chọn sau khi lỗi
    e.target.value = '';
    if (!file) return;

    clear();

    if (file.size > MAX_AVATAR_BYTES) {
      showError('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showError('Vui lòng chọn file hình ảnh (JPEG, PNG, WebP, GIF).');
      return;
    }

    // Xem trước ngay để thao tác có phản hồi tức thì, kể cả khi mạng chậm
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);

    try {
      await onUploadAvatar(file);
      setLocalPreview(null);
    } catch (err) {
      // Upload hỏng thì phải trả ảnh về đúng ảnh đang lưu trên máy chủ,
      // nếu không người dùng tưởng đã đổi được ảnh.
      showErrorFrom(err, 'Không thể tải ảnh đại diện lên.');
      setLocalPreview(null);
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleRemove = async () => {
    clear();
    try {
      await onRemoveAvatar();
      setLocalPreview(null);
    } catch (err) {
      showErrorFrom(err, 'Không thể xóa ảnh đại diện.');
    }
  };

  const shownAvatar = localPreview ?? avatarUrl;

  return (
    <div className="flex flex-col bg-white dark:bg-[#1d1c19] border border-[#e6e4e0] dark:border-[#332f2c] rounded-lg overflow-hidden shadow-2xs">
      <div className="flex flex-col gap-0.5 px-4 py-3.5 border-b border-[#efedea] dark:border-[#2a2624]">
        <div className="text-[13px] font-semibold text-[#1c1b19] dark:text-white">
          Hồ sơ cá nhân
        </div>
        <div className="text-[11px] text-[#97938c]">
          Tên hiển thị trong ghi chú, thông báo và lịch sử trao đổi
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex flex-col gap-4 p-4"
      >
        <div className="flex items-center gap-3.5 pb-3.5 border-b border-[#f3f1ee] dark:border-[#282522]">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#f3f1ee] dark:bg-[#282522] border border-[#e0ddd8] dark:border-[#3a3532] text-base font-semibold text-[#56534d] dark:text-[#c4c0b8] shrink-0 overflow-hidden shadow-2xs">
            {shownAvatar ? (
              <img src={shownAvatar} alt="Ảnh đại diện" className="w-full h-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
            {isAvatarBusy && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 flex-grow min-w-0">
            <div className="text-xs text-[#7d7a73] dark:text-[#97938c]">
              Ảnh đại diện hiển thị trong ghi chú và danh sách trao đổi
            </div>
            <Alert feedback={avatarFeedback} onDismiss={clear} className="mt-0.5" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <label
              className={`flex items-center h-[30px] px-3 border border-[#e6e4e0] dark:border-[#332f2c] rounded-md bg-white dark:bg-[#232120] text-xs font-medium text-[#56534d] dark:text-[#d4cfc7] hover:bg-[#fbfbfa] dark:hover:bg-[#2c2a27] transition shadow-2xs ${
                isAvatarBusy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isAvatarBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Upload className="w-3.5 h-3.5 mr-1.5 text-[#7d7a73]" />
              )}
              <span>{isAvatarBusy ? 'Đang tải...' : 'Đổi ảnh'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isAvatarBusy}
                className="hidden"
              />
            </label>

            {shownAvatar && !isAvatarBusy && (
              <button
                type="button"
                onClick={handleRemove}
                title="Xóa ảnh đại diện"
                className="flex items-center justify-center h-[30px] w-[30px] rounded-md border border-[#e6e4e0] dark:border-[#332f2c] bg-white dark:bg-[#232120] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-[11px] text-[#7d7a73] dark:text-[#97938c]">Họ và tên</label>
            <input
              type="text"
              required
              value={values.name}
              onChange={(e) => onChange({ ...values, name: e.target.value })}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#7d7a73] dark:text-[#97938c]">
              Email đăng nhập
            </label>
            <input
              type="email"
              readOnly
              disabled
              value={email}
              className="flex items-center h-[32px] px-2.5 border border-[#e0ddd8] dark:border-[#332f2c] rounded-md bg-[#fbfbfa] dark:bg-[#1d1c19] text-[13px] text-[#7d7a73] dark:text-[#97938c] outline-none cursor-not-allowed shadow-2xs select-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#7d7a73] dark:text-[#97938c]">
              Số điện thoại
            </label>
            <input
              type="text"
              value={values.phone}
              onChange={(e) => onChange({ ...values, phone: e.target.value })}
              placeholder="0901 234 567"
              className={`${FIELD_CLASS} tabular-nums`}
            />
            <span className="text-[10px] text-[#a5a199]">
              Chỉ lưu trên trình duyệt này — hệ thống chưa có trường số điện thoại dùng chung.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[#f3f1ee] dark:border-[#282522]">
          <div className="flex-grow" />
          <button
            type="button"
            onClick={onReset}
            className="flex items-center h-[30px] px-3.5 border border-[#e6e4e0] dark:border-[#332f2c] rounded-md bg-white dark:bg-[#232120] text-xs font-medium text-[#56534d] dark:text-[#c4c0b8] hover:bg-[#fbfbfa] dark:hover:bg-[#2c2a27] transition cursor-pointer shadow-2xs"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center h-[30px] px-4 rounded-md bg-[#e8732c] hover:bg-[#d66522] text-white text-xs font-medium transition cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};
