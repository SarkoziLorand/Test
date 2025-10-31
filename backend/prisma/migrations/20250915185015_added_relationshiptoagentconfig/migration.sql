-- AlterTable
ALTER TABLE "public"."AgentConfig" ADD COLUMN     "integrationId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."AgentConfig" ADD CONSTRAINT "AgentConfig_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
