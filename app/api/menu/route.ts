import { connection, NextResponse } from "next/server";
import { getOrderReadiness } from "@/lib/order-config";
import { logSafeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await connection();
  try {
    const [products, readiness] = await Promise.all([
      prisma.menuProduct.findMany({
        where: { deletedAt: null },
        orderBy: [{ featured: "desc" }, { name: "asc" }],
      }),
      getOrderReadiness(),
    ]);

    return NextResponse.json({
      canOrder: readiness.enabled,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        image: product.image,
        imageAlt: product.imageAlt,
        price: product.priceCents === null ? null : product.priceCents / 100,
        availability: product.availability && product.priceCents !== null ? "available" : "pending-confirmation",
        featured: product.featured,
        listingNote: product.description ?? "Ask Moz Deli Foods to confirm current details.",
      })),
      fulfillment: {
        collectionEnabled: readiness.settings?.collectionEnabled ?? false,
        deliveryEnabled: readiness.settings?.deliveryEnabled ?? false,
        deliveryFeeCents: readiness.settings?.deliveryFeeCents ?? null,
        minimumOrderCents: readiness.settings?.minimumOrderCents ?? null,
        deliveryAreas: readiness.settings?.deliveryAreas ?? [],
        collectionEstimateMinutes: readiness.settings?.collectionEstimateMinutes ?? null,
      },
    });
  } catch (error) {
    logSafeError("public_menu_load_failed", error);
    return NextResponse.json({ error: "Menu information is temporarily unavailable." }, { status: 503 });
  }
}
