-- AlterTable: Manually record vendor settings to resolve tracking drift
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "shopName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "shopAddress" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "shopDescription" TEXT DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT DEFAULT '';