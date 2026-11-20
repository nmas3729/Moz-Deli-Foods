CREATE TYPE "FulfillmentMethod" AS ENUM ('COLLECTION', 'DELIVERY');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "OrderStatus" AS ENUM ('AWAITING_PAYMENT', 'PAID', 'CONFIRMED', 'PREPARING', 'READY_FOR_COLLECTION', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED', 'REFUNDED');

CREATE TABLE "MenuProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "image" TEXT,
    "priceCents" INTEGER,
    "availability" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MenuProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RestaurantSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "onlineOrderingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "collectionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "deliveryFeeCents" INTEGER,
    "minimumOrderCents" INTEGER,
    "deliveryAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "collectionEstimateMinutes" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RestaurantSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "checkoutKey" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "fulfillment" "FulfillmentMethod" NOT NULL,
    "deliveryAddress" TEXT,
    "instructions" TEXT,
    "subtotalCents" INTEGER NOT NULL,
    "deliveryFeeCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "OrderStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "payfastUuid" TEXT,
    "payfastPaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "notificationSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "totalPriceCents" INTEGER NOT NULL,
    "customisations" JSONB,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentNotification" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "amountCents" INTEGER,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");
CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order"("checkoutKey");
CREATE UNIQUE INDEX "Order_payfastUuid_key" ON "Order"("payfastUuid");
CREATE UNIQUE INDEX "Order_payfastPaymentId_key" ON "Order"("payfastPaymentId");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_status_paymentStatus_idx" ON "Order"("status", "paymentStatus");
CREATE INDEX "MenuProduct_availability_deletedAt_idx" ON "MenuProduct"("availability", "deletedAt");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE UNIQUE INDEX "PaymentNotification_providerPaymentId_key" ON "PaymentNotification"("providerPaymentId");
CREATE INDEX "PaymentNotification_orderId_receivedAt_idx" ON "PaymentNotification"("orderId", "receivedAt");

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MenuProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentNotification" ADD CONSTRAINT "PaymentNotification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "MenuProduct" ("id", "name", "category", "priceCents", "availability", "featured", "updatedAt") VALUES
    ('queen-prawns', 'Queen Prawns', 'Seafood', NULL, false, false, CURRENT_TIMESTAMP),
    ('king-prawn-seafood-paella-rice', 'King Prawn and Seafood Mix Paella Rice', 'Seafood', NULL, false, false, CURRENT_TIMESTAMP),
    ('large-lamb-shank', 'Large Lamb Shank Served With', 'Portuguese', NULL, false, false, CURRENT_TIMESTAMP);

INSERT INTO "RestaurantSettings" ("id", "onlineOrderingEnabled", "collectionEnabled", "deliveryEnabled", "deliveryAreas", "updatedAt")
VALUES ('default', false, false, false, ARRAY[]::TEXT[], CURRENT_TIMESTAMP);
