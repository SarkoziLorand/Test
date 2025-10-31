/*
  Warnings:

  - You are about to drop the column `value` on the `AgentConfig` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[agentId,name]` on the table `AgentConfig` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `AgentConfig` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."AgentConfig_agentId_key_key";

-- AlterTable
ALTER TABLE "public"."AgentConfig" DROP COLUMN "value",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AgentConfig_agentId_name_key" ON "public"."AgentConfig"("agentId", "name");
