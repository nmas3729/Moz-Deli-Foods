import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { menuProductUpdateSchema } from "@/lib/checkout-schema";
import { hasTrustedOrigin, logSafeError } from "@/lib/http";
import { getMenuImageAssetId, isMenuImagePath } from "@/lib/menu-image";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  }
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid product details." }, { status: 400 });
  }
  const parsed = menuProductUpdateSchema.safeParse(body);
  if (!parsed.success || !isMenuImagePath(parsed.data?.image ?? null)) {
    return NextResponse.json({ error: "Check the product details and use a supported local image." }, { status: 400 });
  }
  if (parsed.data.availability && parsed.data.priceCents === null) {
    return NextResponse.json({ error: "Add an approved price before making a product available." }, { status: 400 });
  }

  try {
    const imageAssetId = getMenuImageAssetId(parsed.data.image);
    if (imageAssetId && !await prisma.menuImageAsset.findUnique({ where: { id: imageAssetId }, select: { id: true } })) {
      return NextResponse.json({ error: "Upload the product image before saving it." }, { status: 400 });
    }
    const product = await prisma.menuProduct.create({
      data: {
        id: `product-${randomUUID()}`,
        ...parsed.data,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    logSafeError("admin_menu_create_failed", error);
    return NextResponse.json({ error: "The product could not be saved." }, { status: 503 });
  }
}
