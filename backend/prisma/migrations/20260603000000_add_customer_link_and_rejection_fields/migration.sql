-- Migration baseline.
--
-- Ba cot duoi day da ton tai trong co so du lieu tu truoc, nhung khong co file
-- migration nao sinh ra chung: chung duoc them bang `prisma db push`, lenh nay
-- sua truc tiep schema ma khong ghi lai lich su.
--
-- Hau qua neu khong vá: dung mot moi truong moi bang `prisma migrate deploy` se
-- ra co so du lieu THIEU ba cot nay, va lan chay `prisma migrate dev` tiep theo
-- se phat hien drift roi de nghi reset toan bo database.
--
-- File nay duoc danh dau la da ap dung bang `prisma migrate resolve --applied`
-- tren moi truong dang chay, nen SQL ben duoi chi thuc su chay o moi truong moi.

ALTER TABLE "customers" ADD COLUMN "link_url" TEXT;
ALTER TABLE "customers" ADD COLUMN "reject_reason" TEXT;
ALTER TABLE "customers" ADD COLUMN "current_step" TEXT;
