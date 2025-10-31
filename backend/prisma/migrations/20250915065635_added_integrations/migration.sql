-- AlterTable
ALTER TABLE "public"."AgentConfig" ALTER COLUMN "value" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."AgentFlag" ALTER COLUMN "status" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."CompanyConfig" ALTER COLUMN "value" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "public"."Integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Integrations_name_key" ON "public"."Integrations"("name");
