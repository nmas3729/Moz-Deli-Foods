import "server-only";
import { prisma } from "@/lib/prisma";

export function getPayFastConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID?.trim();
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY?.trim();
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  const sandboxMode = process.env.PAYFAST_SANDBOX_MODE ?? process.env.PAYFAST_SANDBOX;
  const sandbox = sandboxMode?.trim().toLowerCase() !== "false";
  const sourceIpHeader = process.env.PAYFAST_SOURCE_IP_HEADER?.trim().toLowerCase();

  if (!merchantId || !/^\d{8}$/.test(merchantId) || !merchantKey || !passphrase || !sourceIpHeader) {
    return null;
  }

  return {
    merchantId,
    merchantKey,
    passphrase,
    sandbox,
    host: sandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za",
    sourceIpHeader,
  };
}

export async function getOrderReadiness() {
  const [settings, availableProductCount] = await Promise.all([
    prisma.restaurantSettings.findUnique({ where: { id: "default" } }),
    prisma.menuProduct.count({
      where: { availability: true, deletedAt: null, priceCents: { gt: 0 } },
    }),
  ]);
  const payFastReady = getPayFastConfig() !== null;
  const appBaseUrl = process.env.APP_BASE_URL;
  const baseUrlReady = Boolean(appBaseUrl && isValidApplicationUrl(appBaseUrl));
  const fulfillmentReady = Boolean(settings && (settings.collectionEnabled || settings.deliveryEnabled));
  const enabled = Boolean(
    settings?.onlineOrderingEnabled
      && availableProductCount > 0
      && fulfillmentReady
      && payFastReady
      && baseUrlReady,
  );

  return {
    settings,
    availableProductCount,
    enabled,
    payFastReady,
    baseUrlReady,
  };
}

export function isValidApplicationUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      || (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    return false;
  }
}
