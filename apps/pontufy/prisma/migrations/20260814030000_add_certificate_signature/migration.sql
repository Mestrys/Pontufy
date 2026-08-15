-- Migration: 20260814030000_add_certificate_signature
-- Add signature column to IssuedCertificate for cryptographic verification

ALTER TABLE "IssuedCertificate" ADD COLUMN "signature" TEXT;

-- Backfill existing certificates with signature (will be computed on next re-issue)
-- No default needed; signature is computed when certificate is (re)generated.