/* ==========================================================================
   QUY TẮC GIAO DIỆN SÁNG/TỐI — NGUỒN DUY NHẤT
   --------------------------------------------------------------------------
   Dùng ở hai nơi: ThemeProvider (lúc chạy) và vite.config.ts, nơi sinh đoạn
   script chèn vào index.html để gắn class trước khi trang vẽ lần đầu (tránh
   nháy sai màu). Tệp này không được dùng API trình duyệt ở cấp module vì
   vite.config.ts chạy trên Node.
   ========================================================================== */

export type ThemeType = 'dark' | 'light' | 'luxury-dark';

export const THEME_STORAGE_KEY = 'app_theme';
export const DEFAULT_THEME: ThemeType = 'dark';

/** Các trang luôn dùng giao diện sáng bất kể lựa chọn của người dùng. */
export const LIGHT_ONLY_PATHS = ['/login', '/register'];

export const DARK_CLASSES = ['dark', 'theme-luxury-dark'];
export const LIGHT_CLASSES = ['light', 'theme-light'];

export const isDarkTheme = (theme: string) => theme === 'dark' || theme === 'luxury-dark';

export const isLightOnlyPath = (pathname: string) =>
  LIGHT_ONLY_PATHS.includes(pathname.replace(/\/+$/, '') || '/');

/**
 * Đoạn script chạy trước khi React tải. Sinh từ các hằng ở trên nên luôn khớp
 * với ThemeProvider; vite.config.ts chèn nó vào chỗ `<!--theme-boot-->`.
 */
export const themeBootScript = () => `(function () {
  try {
    var path = window.location.pathname.replace(/\\/+$/, '') || '/';
    var lightOnly = ${JSON.stringify(LIGHT_ONLY_PATHS)}.indexOf(path) !== -1;
    var theme = lightOnly ? 'light' : (localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) || ${JSON.stringify(DEFAULT_THEME)});
    var dark = theme === 'dark' || theme === 'luxury-dark';
    var cls = dark ? ${JSON.stringify(DARK_CLASSES)} : ${JSON.stringify(LIGHT_CLASSES)};
    document.documentElement.classList.add.apply(document.documentElement.classList, cls);
  } catch (e) {}
})();`;
