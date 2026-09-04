-- CreateEnum
CREATE TYPE "OrderActor" AS ENUM ('CUSTOMER', 'ADMIN', 'STAFF', 'SYSTEM', 'STRIPE', 'WEBHOOK');

-- AlterTable: add the new typed columns first (actor backfills existing
-- rows to SYSTEM via its DEFAULT, matching what changedBy='system' already
-- meant for every existing row), then drop the old free-text column.
ALTER TABLE "OrderStatusHistory"
  ADD COLUMN "previousStatus" "OrderStatus",
  ADD COLUMN "actor" "OrderActor" NOT NULL DEFAULT 'SYSTEM';

ALTER TABLE "OrderStatusHistory" DROP COLUMN "changedBy";
