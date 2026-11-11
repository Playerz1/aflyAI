-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('site', 'app');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('em_negociacao', 'aguardando_resposta', 'interessado', 'vendido', 'nao_vendido', 'sem_resposta');

-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('unica', 'recorrente');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL DEFAULT 'site',
    "niche" TEXT NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "prompt" TEXT NOT NULL,
    "lovableUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "establishments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "rating" DOUBLE PRECISION,
    "address" TEXT,
    "projectId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "establishments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiations" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "approachType" TEXT NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'em_negociacao',
    "demoLink" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "negotiationId" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "type" "SaleType" NOT NULL DEFAULT 'unica',
    "monthlyValue" DECIMAL(10,2),
    "saleDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_createdById_idx" ON "projects"("createdById");
CREATE INDEX "projects_niche_idx" ON "projects"("niche");
CREATE INDEX "projects_createdAt_idx" ON "projects"("createdAt");

-- CreateIndex
CREATE INDEX "establishments_createdById_idx" ON "establishments"("createdById");
CREATE INDEX "establishments_niche_idx" ON "establishments"("niche");
CREATE INDEX "establishments_city_idx" ON "establishments"("city");
CREATE INDEX "establishments_state_idx" ON "establishments"("state");
CREATE INDEX "establishments_projectId_idx" ON "establishments"("projectId");

-- CreateIndex
CREATE INDEX "negotiations_establishmentId_idx" ON "negotiations"("establishmentId");
CREATE INDEX "negotiations_status_idx" ON "negotiations"("status");
CREATE INDEX "negotiations_createdById_idx" ON "negotiations"("createdById");
CREATE INDEX "negotiations_createdAt_idx" ON "negotiations"("createdAt");

-- CreateIndex
CREATE INDEX "sales_negotiationId_idx" ON "sales"("negotiationId");
CREATE INDEX "sales_type_idx" ON "sales"("type");
CREATE INDEX "sales_saleDate_idx" ON "sales"("saleDate");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishments" ADD CONSTRAINT "establishments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "establishments" ADD CONSTRAINT "establishments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "negotiations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
