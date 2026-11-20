ALTER TABLE "MenuProduct" ADD COLUMN "imageAlt" TEXT;

CREATE TABLE "MenuImageAsset" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenuImageAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MenuImageAsset_createdAt_idx" ON "MenuImageAsset"("createdAt");

UPDATE "MenuProduct"
SET
    "description" = '4 queen prawns served with seafood paella rice and Moz Deli salad.',
    "image" = '/images/food/seafood/fish-and-chips.webp',
    "imageAlt" = 'Moz Deli seafood plate with prawns, fish, rice, chips and salad',
    "priceCents" = 15000,
    "availability" = true
WHERE "id" = 'queen-prawns';

UPDATE "MenuProduct"
SET
    "description" = '5 king prawns served with seafood paella rice and Moz Deli salad.',
    "image" = '/images/food/seafood/fish-and-chips.webp',
    "imageAlt" = 'Moz Deli seafood plate with prawns, fish, rice, chips and salad',
    "priceCents" = 17000,
    "availability" = true
WHERE "id" = 'king-prawn-seafood-paella-rice';
