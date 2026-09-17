import { Prisma, Classified } from '@prisma/client';
import { prisma } from '../config/db';
import { BulkCustomerInput } from '../schemas/customer';

/**
 * Logic nghiệp vụ khách hàng, tách khỏi tầng HTTP.
 *
 * Trước đây `BulkCreate` chép lại toàn bộ logic của `Create`, nên hai đường đi
 * dần lệch nhau. Đặt ở đây thì cả hai dùng chung một bộ quy tắc.
 */

// ─── Tìm doanh nghiệp theo tên, tạo nếu chưa có ─────────────────────────────
// Nhận cả danh sách để chỉ tốn 2 truy vấn dù có bao nhiêu tên đi nữa.
export const resolveCompanyIdsByName = async (
  rawNames: (string | undefined | null)[]
): Promise<Map<string, number>> => {
  const names = [...new Set(
    rawNames
      .map((n) => (typeof n === 'string' ? n.trim() : ''))
      .filter((n) => n !== '')
  )];

  const result = new Map<string, number>();
  if (names.length === 0) return result;

  const existing = await prisma.company.findMany({
    where:  { name: { in: names } },
    select: { id: true, name: true },
  });
  existing.forEach((c) => result.set(c.name, c.id));

  const missing = names.filter((n) => !result.has(n));
  if (missing.length > 0) {
    await prisma.company.createMany({
      data: missing.map((name) => ({ name, status: 'potential' as const })),
      skipDuplicates: true,
    });

    const created = await prisma.company.findMany({
      where:  { name: { in: missing } },
      select: { id: true, name: true },
    });
    created.forEach((c) => result.set(c.name, c.id));
  }

  return result;
};

// ─── Khoá định danh đã tồn tại ───────────────────────────────────────────────
interface IdentitySets {
  emails: Set<string>;
  phones: Set<string>;
  links:  Set<string>;
}

// Một truy vấn duy nhất cho cả lô, thay vì mỗi dòng một truy vấn.
export const loadExistingIdentities = async (
  rows: { email?: unknown; phone_number?: unknown; link_url?: unknown }[],
  excludeCustomerId?: number
): Promise<IdentitySets> => {
  const pick = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);

  const emails = rows.map((r) => pick(r.email)).filter(Boolean) as string[];
  const phones = rows.map((r) => pick(r.phone_number)).filter(Boolean) as string[];
  const links  = rows.map((r) => pick(r.link_url)).filter(Boolean) as string[];

  const empty: IdentitySets = { emails: new Set(), phones: new Set(), links: new Set() };
  if (emails.length === 0 && phones.length === 0 && links.length === 0) return empty;

  const or: Prisma.CustomerWhereInput[] = [];
  if (emails.length) or.push({ email: { in: emails } });
  if (phones.length) or.push({ phone_number: { in: phones } });
  if (links.length)  or.push({ link_url: { in: links } });

  const found = await prisma.customer.findMany({
    where: excludeCustomerId
      ? { AND: [{ id: { not: excludeCustomerId } }, { OR: or }] }
      : { OR: or },
    select: { email: true, phone_number: true, link_url: true },
  });

  const sets: IdentitySets = { emails: new Set(), phones: new Set(), links: new Set() };
  found.forEach((c) => {
    if (c.email)        sets.emails.add(c.email);
    if (c.phone_number) sets.phones.add(c.phone_number);
    if (c.link_url)     sets.links.add(c.link_url);
  });
  return sets;
};

// ─── Nhập hàng loạt ──────────────────────────────────────────────────────────

export interface BulkCreateResult {
  successCount: number;
  skipCount:    number;
}

/**
 * Nhập nhiều khách hàng trong một lượt.
 *
 * Bản cũ lặp từng dòng và bắn 2 truy vấn mỗi dòng (kiểm tra trùng + tìm/tạo
 * doanh nghiệp), nên 1.000 dòng là hơn 2.000 lượt round-trip và không có
 * transaction — hỏng giữa chừng để lại dữ liệu nhập dở.
 *
 * Bản này tốn số truy vấn cố định và ghi trong một transaction duy nhất.
 */
export const bulkCreateCustomers = async (
  rows: BulkCustomerInput[],
  ownerId: number
): Promise<BulkCreateResult> => {
  const existing = await loadExistingIdentities(rows);
  const companyIds = await resolveCompanyIdsByName(rows.map((r) => r.company_name));

  // Trùng ngay trong chính file nhập cũng phải loại, không chỉ trùng với CSDL
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const seenLinks  = new Set<string>();

  const toCreate: Prisma.CustomerCreateManyInput[] = [];
  let skipCount = 0;

  for (const row of rows) {
    const email = row.email        ?? null;
    const phone = row.phone_number ?? null;
    const link  = row.link_url     ?? null;

    const isDuplicate =
      (email && (existing.emails.has(email) || seenEmails.has(email))) ||
      (phone && (existing.phones.has(phone) || seenPhones.has(phone))) ||
      (link  && (existing.links.has(link)   || seenLinks.has(link)));

    if (isDuplicate) {
      skipCount++;
      continue;
    }

    if (email) seenEmails.add(email);
    if (phone) seenPhones.add(phone);
    if (link)  seenLinks.add(link);

    const companyName = row.company_name?.trim();

    toCreate.push({
      name:          row.name?.trim() || 'Không có tên',
      company_id:    companyName ? companyIds.get(companyName) ?? null : null,
      field:         row.field         ?? null,
      from_source:   row.from_source   ?? null,
      price:         row.price ?? null,
      status:        row.status        ?? null,
      classified:    (row.classified as Classified | undefined) ?? null,
      email,
      phone_number:  phone,
      address:       row.address       ?? null,
      link_url:      link,
      appointment:   row.appointment ? new Date(row.appointment) : null,
      note:          row.note          ?? null,
      reject_reason: row.reject_reason ?? null,
      current_step:  row.current_step  ?? null,
      owner_id:      ownerId,
      updated_at:    new Date(),
    });
  }

  if (toCreate.length === 0) return { successCount: 0, skipCount };

  // skipDuplicates chặn nốt các va chạm unique mà kiểm tra phía trên bỏ lọt
  const created = await prisma.customer.createMany({
    data: toCreate,
    skipDuplicates: true,
  });

  return {
    successCount: created.count,
    skipCount:    skipCount + (toCreate.length - created.count),
  };
};
