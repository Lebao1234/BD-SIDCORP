/* ==========================================================================
   LỚP GIAO DIỆN DÙNG CHUNG CHO THANH CÔNG CỤ
   --------------------------------------------------------------------------
   Một nút primary duy nhất cho hành động chính; mọi nút còn lại trung tính,
   icon cùng màu chữ. Chiều cao 32px thống nhất cho select, ô tìm kiếm và nút.
   ========================================================================== */

export const toolbarControl =
  'h-8 rounded-control border border-line bg-surface text-[13px] text-fg transition hover:border-line-strong';

export const toolbarSelect = `${toolbarControl} cursor-pointer pl-2.5 pr-7`;

export const toolbarSearch = `${toolbarControl} w-full pl-8 pr-8 placeholder:text-fg-faint`;

export const toolbarButton =
  'inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-control border border-line bg-surface px-3 ' +
  'text-[13px] font-medium text-fg-body transition hover:border-line-strong hover:text-fg';

export const primaryButton =
  'inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-control bg-brand px-3.5 ' +
  'text-[13px] font-medium text-white transition hover:bg-brand-hover active:scale-[0.98]';

export const pageTitle = 'text-[22px] font-semibold leading-tight tracking-[-0.03em] text-fg';

export const iconButton =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-control border border-line bg-surface ' +
  'text-fg-muted transition hover:border-line-strong hover:text-fg';
