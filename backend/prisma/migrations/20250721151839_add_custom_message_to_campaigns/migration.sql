-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_templateId_fkey";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "customMessageBody" TEXT,
ALTER COLUMN "templateId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
