CREATE TYPE "PaymentMethod" AS ENUM ('PAYFAST', 'STRIPE');

ALTER TABLE "Order"
ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAYFAST';

UPDATE "Order"
SET "paymentMethod" = 'STRIPE'
WHERE "stripeSessionId" IS NOT NULL;
