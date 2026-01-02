-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GM', 'PLAYER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'PLAYER';
