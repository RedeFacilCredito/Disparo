-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "category" TEXT,
ADD COLUMN     "languageCode" TEXT,
ADD COLUMN     "templateType" TEXT,
ALTER COLUMN "status" DROP DEFAULT;
