-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECRUITER');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Active';

-- AlterTable (username added nullable, backfilled, then required)
ALTER TABLE "Recruiter" ADD COLUMN "username" TEXT;
ALTER TABLE "Recruiter" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'RECRUITER';

UPDATE "Recruiter"
SET "username" = split_part(split_part("email", '@', 2), '.', 1)
WHERE "username" IS NULL;

ALTER TABLE "Recruiter" ALTER COLUMN "username" SET NOT NULL;

ALTER TABLE "Recruiter" ALTER COLUMN "tenantId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Recruiter_username_key" ON "Recruiter"("username");
