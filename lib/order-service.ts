import "server-only";
import { randomBytes } from "node:crypto";
import { FulfillmentMethod, type Prisma } from "@prisma/client";
import type { z } from "zod";
import { orderRequestSchema } from "@/lib/checkout-schema";
import { getOrderReadiness } from "@/lib/order-config";
import { prisma } from "@/lib/prisma";

type OrderRequest = z.infer<typeof orderRequestSchema>;

export class OrderServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

export function createOrderIdentifiers() {
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return {
    orderNumber: `MD-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${suffix}`,
    publicToken: randomBytes(32).toString("base64url"),
  };
}

export async function calculateOrderQuote(input: OrderRequest) {
  const readiness = await getOrderReadiness();
  const settings = readiness.settings;
  if (!readiness.enabled || !settings) {
    throw new OrderServiceError("Online ordering is not ready yet.", 503, "ORDERING_UNAVAILABLE");
  }

  const requested = new Map<string, number>();
  for (const item of input.items) {
    const quantity = (requested.get(item.productId) ?? 0) + item.quantity;
    if (quantity > 20) {
      throw new OrderServiceError("A maximum of 20 of each item can be ordered.", 400, "INVALID_QUANTITY");
    }
    requested.set(item.productId, quantity);
  }

  const products = await prisma.menuProduct.findMany({
    where: {
      id: { in: [...requested.keys()] },
      availability: true,
      deletedAt: null,
      priceCents: { gt: 0 },
    },
  });
  if (products.length !== requested.size) {
    throw new OrderServiceError("One or more items are no longer available.", 409, "ITEM_UNAVAILABLE");
  }

  const lines = products.map((product) => {
    const quantity = requested.get(product.id);
    if (!quantity || product.priceCents === null) {
      throw new OrderServiceError("One or more items are no longer available.", 409, "ITEM_UNAVAILABLE");
    }
    return {
      productId: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      quantity,
      unitPriceCents: product.priceCents,
      totalPriceCents: product.priceCents * quantity,
    };
  });

  const subtotalCents = lines.reduce((total, line) => total + line.totalPriceCents, 0);
  const minimumOrderCents = settings.minimumOrderCents ?? 0;
  if (subtotalCents < minimumOrderCents) {
    throw new OrderServiceError("The order does not meet the current minimum order value.", 400, "MINIMUM_ORDER_NOT_MET");
  }

  let deliveryFeeCents = 0;
  if (input.fulfillment === "COLLECTION") {
    if (!settings.collectionEnabled) {
      throw new OrderServiceError("Collection is not currently available.", 409, "FULFILLMENT_UNAVAILABLE");
    }
  } else {
    if (!settings.deliveryEnabled || settings.deliveryFeeCents === null) {
      throw new OrderServiceError("Delivery is not currently available.", 409, "FULFILLMENT_UNAVAILABLE");
    }
    if (!input.deliveryAddress.trim()) {
      throw new OrderServiceError("Enter a delivery address.", 400, "DELIVERY_ADDRESS_REQUIRED");
    }
    const normalizedAddress = input.deliveryAddress.toLocaleLowerCase();
    const deliveryAreaMatches = settings.deliveryAreas.some((area) =>
      normalizedAddress.includes(area.toLocaleLowerCase()),
    );
    if (settings.deliveryAreas.length === 0 || !deliveryAreaMatches) {
      throw new OrderServiceError("The address is outside the configured delivery areas.", 400, "DELIVERY_AREA_UNAVAILABLE");
    }
    deliveryFeeCents = settings.deliveryFeeCents;
  }

  return {
    lines,
    fulfillment: input.fulfillment === "COLLECTION" ? FulfillmentMethod.COLLECTION : FulfillmentMethod.DELIVERY,
    subtotalCents,
    deliveryFeeCents,
    totalCents: subtotalCents + deliveryFeeCents,
  };
}

export async function createPendingOrder(
  input: OrderRequest,
  quote: Awaited<ReturnType<typeof calculateOrderQuote>>,
  checkoutKey: string,
) {
  const firstName = input.customer.name.trim().split(/\s+/)[0]!;
  const lastName = input.customer.name.trim().split(/\s+/).slice(1).join(" ");
  const { orderNumber, publicToken } = createOrderIdentifiers();
  const items: Prisma.OrderItemCreateWithoutOrderInput[] = quote.lines.map((line) => ({
    product: { connect: { id: line.productId } },
    productName: line.name,
    category: line.category,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    totalPriceCents: line.totalPriceCents,
  }));

  return prisma.order.create({
    data: {
      orderNumber,
      publicToken,
      checkoutKey,
      customerName: input.customer.name.trim(),
      customerPhone: input.customer.phone.trim(),
      customerEmail: input.customer.email.trim().toLowerCase(),
      fulfillment: quote.fulfillment,
      deliveryAddress: quote.fulfillment === FulfillmentMethod.DELIVERY ? input.deliveryAddress.trim() : null,
      instructions: input.customer.instructions.trim() || null,
      subtotalCents: quote.subtotalCents,
      deliveryFeeCents: quote.deliveryFeeCents,
      totalCents: quote.totalCents,
      paymentMethod: "PAYFAST",
      items: { create: items },
    },
    select: {
      id: true,
      orderNumber: true,
      publicToken: true,
      customerEmail: true,
      customerPhone: true,
      customerName: true,
      totalCents: true,
      fulfillment: true,
      items: { select: { productId: true, productName: true, quantity: true } },
    },
  }).then((order) => ({
    ...order,
    firstName,
    lastName,
  }));
}
