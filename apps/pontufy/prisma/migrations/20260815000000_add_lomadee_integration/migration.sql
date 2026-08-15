-- Migration: 20260815000000_add_lomadee_integration
-- Add Lomadee affiliate integration support

-- 1. Alter Reward table: rename columns and add new fields
ALTER TABLE "Reward" RENAME COLUMN "partnerStore" TO "partner";
ALTER TABLE "Reward" RENAME COLUMN "affiliateLink" TO "originalUrl";

-- Update default for partner
ALTER TABLE "Reward" ALTER COLUMN "partner" SET DEFAULT 'LOMADEE';

-- Add new columns to Reward
ALTER TABLE "Reward" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Reward" ADD COLUMN "affiliateUrl" TEXT;

-- 2. Create Redemption table
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "pointsDebited" INTEGER NOT NULL,
    "trackingSubId" TEXT NOT NULL,
    "affiliateLink" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "commissionValue" DECIMAL(12, 2),
    "postbackPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- Create foreign keys
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for Redemption
CREATE UNIQUE INDEX "Redemption_trackingSubId_key" ON "Redemption"("trackingSubId");
CREATE INDEX "Redemption_tenantId_userId_idx" ON "Redemption"("tenantId", "userId");
CREATE INDEX "Redemption_tenantId_status_idx" ON "Redemption"("tenantId", "status");
CREATE INDEX "Redemption_rewardId_idx" ON "Redemption"("rewardId");
CREATE INDEX "Redemption_trackingSubId_idx" ON "Redemption"("trackingSubId");

-- 3. Update Commission model for Lomadee support (network can be 'LOMADEE')
-- The existing Commission model already supports this with the 'network' field

-- 4. Add Reward indexes
CREATE INDEX "Reward_partner_idx" ON "Reward"("partner");
CREATE INDEX "Reward_category_idx" ON "Reward"("category");
CREATE INDEX "Reward_externalId_idx" ON "Reward"("externalId");