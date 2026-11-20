import { describe, expect, it } from "vitest";
import {
  encodeStripeOrderItems,
  parseStripeOrderItems,
  StripeOrderValidationError,
  validateStripeOrderLines,
  type StripeOrderLineSnapshot,
  type StripeOrderItemReference,
} from "./stripe-order-data";

describe("Stripe order metadata", () => {
  it("round-trips the product IDs and quantities used to create checkout", () => {
    const items: StripeOrderItemReference[] = [
      { productId: "queen-prawns", quantity: 2 },
      { productId: "smoked-tomahawk", quantity: 1 },
    ];

    expect(parseStripeOrderItems(encodeStripeOrderItems(items))).toEqual(items);
  });

  it("rejects malformed or duplicate product references", () => {
    expect(() => parseStripeOrderItems("{")).toThrow(StripeOrderValidationError);
    expect(() => parseStripeOrderItems('[["queen-prawns",1],["queen-prawns",2]]'))
      .toThrow(StripeOrderValidationError);
  });
});

describe("Stripe paid line item validation", () => {
  const references = [{ productId: "queen-prawns", quantity: 2 }];
  const lines: StripeOrderLineSnapshot[] = [{
    productId: "queen-prawns",
    category: "Seafood",
    name: "Queen Prawns",
    quantity: 2,
    unitAmount: 15000,
    currency: "zar",
  }];

  it("accepts only a ZAR total that matches the signed Stripe line items", () => {
    expect(validateStripeOrderLines(references, lines, 30000).subtotalCents).toBe(30000);
    expect(() => validateStripeOrderLines(references, lines, 29999)).toThrow(StripeOrderValidationError);
  });
});
