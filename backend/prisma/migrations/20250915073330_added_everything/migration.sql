/*
  Warnings:

  - Added the required column `integrationId` to the `AgentApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AgentApiKey" ADD COLUMN     "integrationId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."AgentApiKey" ADD CONSTRAINT "AgentApiKey_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
