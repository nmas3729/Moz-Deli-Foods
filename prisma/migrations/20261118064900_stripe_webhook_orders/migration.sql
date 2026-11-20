ALTER TABLE "Order" ALTER COLUMN "customerEmail" DROP NOT NULL;
ALTER TABLE "Order" ADD COLUMN "stripeSessionId" TEXT;
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");
