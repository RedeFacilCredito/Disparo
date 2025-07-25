/*
  Warnings:

  - You are about to drop the column `name` on the `contacts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "audiences" ADD COLUMN     "fields" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "name",
ADD COLUMN     "data" JSONB;
