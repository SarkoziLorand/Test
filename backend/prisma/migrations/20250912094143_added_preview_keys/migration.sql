/*
  Warnings:

  - Added the required column `keyPreview` to the `AgentConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyPreviw` to the `CompanyConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AgentConfig" ADD COLUMN     "keyPreview" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."CompanyConfig" ADD COLUMN     "keyPreviw" TEXT NOT NULL;
