-- Phase 10.1: remove the plaintext tracking token column. Every existing
-- non-null value was already encrypted into Order.encryptedTrackingToken
-- and round-trip-verified (decrypt matches original, and decrypted value's
-- SHA-256 hash matches the existing trackingTokenHash) before this
-- migration was written -- see the Phase 10.1 report for verification
-- results. No plaintext tracking token exists anywhere after this runs.

-- DropIndex
DROP INDEX "Order_trackingToken_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "trackingToken";
