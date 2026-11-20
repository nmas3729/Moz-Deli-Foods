import { z } from "zod";

const stripeOrderItemsSchema = z.array(
  z.tuple([z.string().min(1).max(100), z.number().int().min(1).max(20)]),
).min(1).max(20).superRefine((items, context) => {
  const productIds = new Set<string>();
  for (const [productId] of items) {
    if (productIds.has(productId)) {
      context.addIssue({ code: "custom", message: "Duplicate product in order metadata." });
      return;
    }
    productIds.add(productId);
  }
});

export type StripeOrderItemReference = {
  productId: string;
  quantity: number;
};

export type StripeOrderLineSnapshot = StripeOrderItemReference & {
  name: string;
  category: string;
  unitAmount: number;
  currency: string;
};

export class StripeOrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeOrderValidationError";
  }
}

export function encodeStripeOrderItems(items: StripeOrderItemReference[]) {
  const serialized = JSON.stringify(items.map(({ productId, quantity }) => [productId, quantity]));
  if (serialized.length > 500) {
    throw new StripeOrderValidationError("Order metadata exceeds Stripe's limit.");
  }
  return serialized;
}

export function parseStripeOrderItems(value: string | undefined) {
  if (!value) throw new StripeOrderValidationError("Order item metadata is missing.");

  let decoded: unknown;
  try {
    decoded = JSON.parse(value);
  } catch {
    throw new StripeOrderValidationError("Order item metadata is invalid.");
  }

  const parsed = stripeOrderItemsSchema.safeParse(decoded);
  if (!parsed.success) throw new StripeOrderValidationError("Order item metadata is invalid.");

  return parsed.data.map(([productId, quantity]) => ({ productId, quantity }));
}

export function validateStripeOrderLines(
  references: StripeOrderItemReference[],
  lines: StripeOrderLineSnapshot[],
  amountTotal: number | null,
) {
  if (amountTotal === null || !Number.isSafeInteger(amountTotal) || amountTotal < 1 || amountTotal > 100_000_000) {
    throw new StripeOrderValidationError("Checkout session total is invalid.");
  }
  if (lines.length !== references.length) {
    throw new StripeOrderValidationError("Checkout line items do not match order metadata.");
  }

  const expectedItems = new Map(references.map((item) => [item.productId, item.quantity]));
  const seenItems = new Set<string>();
  let subtotalCents = 0;

  for (const line of lines) {
    const expectedQuantity = expectedItems.get(line.productId);
    if (expectedQuantity === undefined
      || seenItems.has(line.productId)
      || line.quantity !== expectedQuantity
      || !line.name.trim()
      || !line.category.trim()
      || !Number.isSafeInteger(line.unitAmount)
      || line.unitAmount < 1
      || line.currency.toLowerCase() !== "zar") {
      throw new StripeOrderValidationError("Checkout line item is invalid.");
    }
    seenItems.add(line.productId);
    subtotalCents += line.unitAmount * line.quantity;
  }

  if (seenItems.size !== expectedItems.size || subtotalCents !== amountTotal) {
    throw new StripeOrderValidationError("Checkout line item total does not match the paid amount.");
  }

  return { lines, subtotalCents };
}
