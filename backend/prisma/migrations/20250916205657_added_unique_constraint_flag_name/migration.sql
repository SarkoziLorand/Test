/*
  Warnings:

  - A unique constraint covering the columns `[flagName]` on the table `AgentFlag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AgentFlag_flagName_key" ON "public"."AgentFlag"("flagName");
