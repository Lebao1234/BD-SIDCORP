/**
 * Bộ nhớ đệm In-Memory TTL linh hoạt (General-purpose In-Memory Cache).
 *
 * TÁC DỤNG:
 * 1. Tăng tốc độ phản hồi từ 100-300ms xuống <1ms cho các API đọc nhiều, ít thay đổi
 *    như Thống kê báo cáo Dashboard, Danh sách công ty, Danh mục.
 * 2. Giảm tải truy vấn nặng (SUM, COUNT, GROUP BY) cho cơ sở dữ liệu PostgreSQL.
 * 3. Tự động thu hồi bản ghi hết hạn (TTL) và giới hạn số lượng mục lưu trữ tối đa (chống tràn RAM).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SimpleCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(
    private defaultTtlMs: number = 30_000, // Mặc định 30 giây
    private maxEntries: number = 1_000
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Thu dọn mục cũ nhất nếu vượt trần kích thước
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(regex: RegExp): void {
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
