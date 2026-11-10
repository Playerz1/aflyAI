-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('novo', 'contato', 'qualificado', 'proposta', 'fechado', 'perdido');
-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('rascunho', 'ativo', 'vencido', 'cancelado');
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pendente', 'pago', 'atrasado', 'estornado');
-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('rascunho', 'publicado', 'arquivado');
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('lead_created', 'lead_contacted', 'lead_qualified', 'contract_created', 'contract_signed', 'payment_received', 'payment_overdue', 'site_published', 'user_created', 'user_blocked', 'ticket_created', 'ticket_resolved');
-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'novo',
    "source" TEXT,
    "value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastContact" TIMESTAMP(3),
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "ContractStatus" NOT NULL DEFAULT 'rascunho',
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "leadId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pendente',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "method" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "status" "SiteStatus" NOT NULL DEFAULT 'rascunho',
    "plan" TEXT NOT NULL DEFAULT 'gratis',
    "createdById" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "leadId" TEXT,
    "contractId" TEXT,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "leads"("email");
-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");
-- CreateIndex
CREATE INDEX "leads_createdById_idx" ON "leads"("createdById");
-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");
-- CreateIndex
CREATE INDEX "contracts_clientEmail_idx" ON "contracts"("clientEmail");
-- CreateIndex
CREATE INDEX "contracts_leadId_idx" ON "contracts"("leadId");
-- CreateIndex
CREATE INDEX "contracts_createdById_idx" ON "contracts"("createdById");
-- CreateIndex
CREATE INDEX "payments_contractId_idx" ON "payments"("contractId");
-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");
-- CreateIndex
CREATE INDEX "payments_dueDate_idx" ON "payments"("dueDate");
-- CreateIndex
CREATE UNIQUE INDEX "sites_domain_key" ON "sites"("domain");
-- CreateIndex
CREATE UNIQUE INDEX "sites_subdomain_key" ON "sites"("subdomain");
-- CreateIndex
CREATE INDEX "sites_status_idx" ON "sites"("status");
-- CreateIndex
CREATE INDEX "sites_createdById_idx" ON "sites"("createdById");
-- CreateIndex
CREATE INDEX "sites_clientId_idx" ON "sites"("clientId");
-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");
-- CreateIndex
CREATE INDEX "activities_userId_idx" ON "activities"("userId");
-- CreateIndex
CREATE INDEX "activities_leadId_idx" ON "activities"("leadId");
-- CreateIndex
CREATE INDEX "activities_contractId_idx" ON "activities"("contractId");
-- CreateIndex
CREATE INDEX "activities_siteId_idx" ON "activities"("siteId");
-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");
-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
