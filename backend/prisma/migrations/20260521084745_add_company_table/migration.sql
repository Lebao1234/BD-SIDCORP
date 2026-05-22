/*
  Warnings:

  - You are about to drop the column `company` on the `customers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('active', 'inactive', 'potential');

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "company",
ADD COLUMN     "company_id" INTEGER;

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "tax_code" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "zalo" TEXT,
    "address" TEXT,
    "location" TEXT,
    "field" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'potential',
    "note" TEXT,
    "bank_name" TEXT,
    "bank_account_no" TEXT,
    "bank_branch" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_tax_code_key" ON "companies"("tax_code");

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "companies"("email");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
