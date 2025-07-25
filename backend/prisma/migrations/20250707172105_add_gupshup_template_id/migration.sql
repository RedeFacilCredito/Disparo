/*
  Warnings:

  - A unique constraint covering the columns `[gupshupTemplateId]` on the table `templates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gupshupTemplateId` to the `templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "gupshupTemplateId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "templates_gupshupTemplateId_key" ON "templates"("gupshupTemplateId");
