/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `parties` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `parties` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable - Add column as nullable first
ALTER TABLE "parties" ADD COLUMN "code" VARCHAR(10);

-- Update existing rows with unique codes based on ID
UPDATE "parties" SET "code" = LPAD(CAST("id" AS TEXT), 6, '0') WHERE "code" IS NULL;

-- Make column NOT NULL
ALTER TABLE "parties" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "parties_code_key" ON "parties"("code");
  