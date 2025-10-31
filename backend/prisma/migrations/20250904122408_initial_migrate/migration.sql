-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."AgentState" AS ENUM ('REQUESTING_QR', 'INITIALIZING', 'AUTHENTICATED', 'CONNECTED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "public"."WhitelistScope" AS ENUM ('GROUP', 'CONTACT', 'ALL');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "zip_code" TEXT,
    "address" TEXT,
    "vat_number" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Agent" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "state" "public"."AgentState" NOT NULL DEFAULT 'DISCONNECTED',
    "lastStateChangeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assistant_id" TEXT NOT NULL,
    "system_prompt" TEXT,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageChat" (
    "id" TEXT NOT NULL,
    "agentId" UUID NOT NULL,
    "chatId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatThreadMap" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "chatId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,

    CONSTRAINT "ChatThreadMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentApiKey" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "AgentApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentWhitelistEntry" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "scope" "public"."WhitelistScope" NOT NULL,
    "identifier" TEXT,

    CONSTRAINT "AgentWhitelistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentConfig" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "AgentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AgentFlag" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "flagName" TEXT NOT NULL,
    "status" JSONB NOT NULL,

    CONSTRAINT "AgentFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "actorUserId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "oldData" JSONB NOT NULL,
    "newData" JSONB NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanyConfig" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "CompanyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InboundMessage" (
    "id" TEXT NOT NULL,
    "agentId" UUID NOT NULL,
    "chatId" TEXT NOT NULL,
    "uniqueMessageId" TEXT NOT NULL,
    "ts" TIMESTAMP(3),

    CONSTRAINT "InboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CompanyToUser" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CompanyToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "public"."RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "public"."RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "public"."Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "public"."Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_vat_number_key" ON "public"."Company"("vat_number");

-- CreateIndex
CREATE INDEX "Agent_companyId_idx" ON "public"."Agent"("companyId");

-- CreateIndex
CREATE INDEX "MessageChat_agentId_chatId_createdAt_idx" ON "public"."MessageChat"("agentId", "chatId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageChat_agentId_threadId_createdAt_idx" ON "public"."MessageChat"("agentId", "threadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatThreadMap_agentId_chatId_key" ON "public"."ChatThreadMap"("agentId", "chatId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatThreadMap_agentId_threadId_key" ON "public"."ChatThreadMap"("agentId", "threadId");

-- CreateIndex
CREATE INDEX "AgentApiKey_agentId_idx" ON "public"."AgentApiKey"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentWhitelistEntry_agentId_scope_identifier_key" ON "public"."AgentWhitelistEntry"("agentId", "scope", "identifier");

-- CreateIndex
CREATE UNIQUE INDEX "AgentConfig_agentId_key_key" ON "public"."AgentConfig"("agentId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AgentFlag_agentId_flagName_key" ON "public"."AgentFlag"("agentId", "flagName");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "public"."AuditLog"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyConfig_companyId_key_key" ON "public"."CompanyConfig"("companyId", "key");

-- CreateIndex
CREATE INDEX "InboundMessage_agentId_chatId_idx" ON "public"."InboundMessage"("agentId", "chatId");

-- CreateIndex
CREATE UNIQUE INDEX "InboundMessage_agentId_uniqueMessageId_key" ON "public"."InboundMessage"("agentId", "uniqueMessageId");

-- CreateIndex
CREATE INDEX "_CompanyToUser_B_index" ON "public"."_CompanyToUser"("B");

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Agent" ADD CONSTRAINT "Agent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageChat" ADD CONSTRAINT "MessageChat_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatThreadMap" ADD CONSTRAINT "ChatThreadMap_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentApiKey" ADD CONSTRAINT "AgentApiKey_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentWhitelistEntry" ADD CONSTRAINT "AgentWhitelistEntry_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentConfig" ADD CONSTRAINT "AgentConfig_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AgentFlag" ADD CONSTRAINT "AgentFlag_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanyConfig" ADD CONSTRAINT "CompanyConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CompanyToUser" ADD CONSTRAINT "_CompanyToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CompanyToUser" ADD CONSTRAINT "_CompanyToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
