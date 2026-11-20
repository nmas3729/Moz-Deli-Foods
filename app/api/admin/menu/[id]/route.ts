import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { menuProductUpdateSchema } from "@/lib/checkout-schema";
import { hasTrustedOrigin, logSafeError } from "@/lib/http";
import { getMenuImageAssetId, isMenuImagePath } from "@/lib/menu-image";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  }
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!/^[-A-Za-z0-9_]{1,120}$/.test(id)) return NextResponse.json({ error: "Product not found." }, { status: 404 });

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
    const result = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.menuProduct.findUnique({
        where: { id },
        select: { image: true },
      });
      if (!existing) return { notFound: true as const };
      const newImageAssetId = getMenuImageAssetId(parsed.data.image);
      if (newImageAssetId && !await transaction.menuImageAsset.findUnique({
        where: { id: newImageAssetId },
        select: { id: true },
      })) {
        return { missingImage: true as const };
      }
      const updated = await transaction.menuProduct.update({
        where: { id },
        data: parsed.data,
      });
      const oldImage = existing.image?.match(/^\/api\/menu\/images\/([0-9a-f-]{36})$/)?.[1];
      if (oldImage && existing.image !== parsed.data.image) {
        const remainingUses = await transaction.menuProduct.count({ where: { image: existing.image } });
        if (remainingUses === 0) {
          await transaction.menuImageAsset.deleteMany({ where: { id: oldImage } });
        }
      }
      return { product: updated };
    });
    if ("notFound" in result) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if ("missingImage" in result) return NextResponse.json({ error: "Upload the product image before saving it." }, { status: 400 });
    return NextResponse.json(result.product);
  } catch (error) {
    logSafeError("admin_menu_update_failed", error);
    return NextResponse.json({ error: "The product could not be updated." }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  }
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!/^[-A-Za-z0-9_]{1,120}$/.test(id)) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  try {
    await prisma.menuProduct.update({
      where: { id },
      data: { availability: false, deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    logSafeError("admin_menu_delete_failed", error);
    return NextResponse.json({ error: "The product could not be removed." }, { status: 404 });
  }
}
