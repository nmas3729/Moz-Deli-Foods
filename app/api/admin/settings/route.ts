import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { restaurantSettingsUpdateSchema } from "@/lib/checkout-schema";
import { getPayFastConfig, isValidApplicationUrl } from "@/lib/order-config";
import { hasTrustedOrigin, logSafeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
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
    return NextResponse.json({ error: "Invalid restaurant settings." }, { status: 400 });
  }
  const parsed = restaurantSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the restaurant settings and try again." }, { status: 400 });
  }

  const settings = parsed.data;
  const deliveryAreas = [...new Set(settings.deliveryAreas.map((area) => area.trim()).filter(Boolean))];
  if (settings.deliveryEnabled && (settings.deliveryFeeCents === null || deliveryAreas.length === 0)) {
    return NextResponse.json({ error: "Delivery needs an approved fee and at least one configured service area." }, { status: 400 });
  }
  if (settings.onlineOrderingEnabled) {
    if (!settings.collectionEnabled && !settings.deliveryEnabled) {
      return NextResponse.json({ error: "Enable an approved fulfilment method before opening online orders." }, { status: 400 });
    }
    if (!getPayFastConfig() || !process.env.APP_BASE_URL || !isValidApplicationUrl(process.env.APP_BASE_URL)) {
      return NextResponse.json({ error: "PayFast and the secure application URL must be configured first." }, { status: 409 });
    }
    let productCount: number;
    try {
      productCount = await prisma.menuProduct.count({
        where: { availability: true, deletedAt: null, priceCents: { gt: 0 } },
      });
    } catch (error) {
      logSafeError("admin_menu_readiness_check_failed", error);
      return NextResponse.json({ error: "Menu readiness could not be verified." }, { status: 503 });
    }
    if (productCount === 0) {
      return NextResponse.json({ error: "Add at least one approved, priced, available product before opening orders." }, { status: 409 });
    }
  }

  try {
    const updated = await prisma.restaurantSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...settings, deliveryAreas },
      update: { ...settings, deliveryAreas },
    });
    return NextResponse.json(updated);
  } catch (error) {
    logSafeError("admin_settings_update_failed", error);
    return NextResponse.json({ error: "Restaurant settings could not be saved." }, { status: 503 });
  }
}
