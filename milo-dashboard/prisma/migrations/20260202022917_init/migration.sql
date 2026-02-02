-- CreateTable
CREATE TABLE "Customer" (
    "customer_id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "customerType" TEXT,
    "preferredContactMethod" TEXT,
    "notes" TEXT,
    "tags" TEXT
);

-- CreateTable
CREATE TABLE "Lead" (
    "lead_id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'new',
    "estimatedValue" INTEGER,
    "nextFollowUpAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("customer_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractAccount" (
    "account_id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "accountName" TEXT NOT NULL,
    "contacts" TEXT,
    "serviceLevelNotes" TEXT,
    "billingTerms" TEXT,
    "preferredWorkflow" TEXT,
    "monthlyRevenueTarget" INTEGER,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "Job" (
    "job_id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT,
    "jobType" TEXT NOT NULL,
    "jobSubtype" TEXT,
    "source" TEXT NOT NULL,
    "contractAccountId" TEXT,
    "siteName" TEXT,
    "address" TEXT,
    "scheduledStart" DATETIME,
    "scheduledEnd" DATETIME,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'intake',
    "materialsNeeded" TEXT,
    "photosLinks" TEXT,
    "notes" TEXT,
    CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("customer_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_contractAccountId_fkey" FOREIGN KEY ("contractAccountId") REFERENCES "ContractAccount" ("account_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "invoice_id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jobId" TEXT NOT NULL,
    "lineItems" TEXT,
    "laborTotal" INTEGER,
    "materialsTotal" INTEGER,
    "taxTotal" INTEGER,
    "total" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "paymentMethod" TEXT,
    "paidAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "Invoice_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("job_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssetCreated" (
    "asset_id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assetType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "platform" TEXT,
    "linkOrRepo" TEXT,
    "nextAction" TEXT,
    "notes" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractAccount_accountName_key" ON "ContractAccount"("accountName");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_jobId_key" ON "Invoice"("jobId");
