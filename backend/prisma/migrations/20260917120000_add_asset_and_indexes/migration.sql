-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('DOCUMENT', 'SOCIAL_POST', 'EMAIL_TEMPLATE');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('DRAFT', 'READY', 'PUBLISHED', 'ARCHIVED');

-- Drop default on email in customers
ALTER TABLE "customers" ALTER COLUMN "email" DROP DEFAULT;

-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "type" "AssetType" NOT NULL DEFAULT 'DOCUMENT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'READY',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "file_url" TEXT NOT NULL,
    "file_name" TEXT,
    "format" TEXT,
    "meta" JSONB,
    "owner_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_usages" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "asset_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_type_category_idx" ON "assets"("type", "category");

-- CreateIndex
CREATE INDEX "assets_owner_id_idx" ON "assets"("owner_id");

-- CreateIndex
CREATE INDEX "customers_owner_id_created_at_idx" ON "customers"("owner_id", "created_at");

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_usages" ADD CONSTRAINT "asset_usages_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_usages" ADD CONSTRAINT "asset_usages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
