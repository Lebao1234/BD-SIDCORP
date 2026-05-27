import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@gmail.com';
  const password = 'admin';
  const name = 'Admin';

  // Kiểm tra nếu đã tồn tại
  const existing = await prisma.user.findFirst({ where: { email } });

  if (existing) {
    // Nếu đã tồn tại thì update role thành admin và approved = true
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'admin',
        approved: true,
        password: await bcrypt.hash(password, 10),
      },
    });
    console.log('✅ Đã cập nhật tài khoản admin:', updated.email, '| Role:', updated.role);
  } else {
    // Tạo mới
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'admin',
        approved: true,
      },
    });
    console.log('✅ Đã tạo tài khoản admin:', admin.email, '| Role:', admin.role);
  }
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
