-- CreateTable
CREATE TABLE "sender_instances" (
    "id" SERIAL NOT NULL,
    "instanceName" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "chatwootInboxId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sender_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sender_instances_chatwootInboxId_key" ON "sender_instances"("chatwootInboxId");
