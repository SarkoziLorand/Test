-- CreateTable
CREATE TABLE "public"."AgentBlacklistEntry" (
    "id" UUID NOT NULL,
    "agentId" UUID NOT NULL,
    "scope" "public"."WhitelistScope" NOT NULL,
    "identifier" TEXT,

    CONSTRAINT "AgentBlacklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentBlacklistEntry_agentId_scope_identifier_key" ON "public"."AgentBlacklistEntry"("agentId", "scope", "identifier");

-- AddForeignKey
ALTER TABLE "public"."AgentBlacklistEntry" ADD CONSTRAINT "AgentBlacklistEntry_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
