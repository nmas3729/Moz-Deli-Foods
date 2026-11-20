import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/order-config", () => ({ getPayFastConfig: vi.fn() }));

import {
  amountToCents,
  buildPayFastValidationBody,
  generatePayFastSignature,
  isAllowedPayFastSourceIp,
  parsePayFastNotification,
  verifyPayFastNotificationSignature,
} from "@/lib/payfast";

describe("PayFast helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates signatures using encoded values in field order", () => {
    const fields = { merchant_id: "10000100", item_name: "Moz Deli & chips", amount: "125.50" };
    const signed = "merchant_id=10000100&item_name=Moz+Deli+%26+chips&amount=125.50&passphrase=s%2Bcret";
    const expected = createHash("md5").update(signed).digest("hex");

    expect(generatePayFastSignature(fields, "s+cret")).toBe(expected);
  });

  it("parses a notification preserving the original field order and excluding its signature for validation", () => {
    const raw = "merchant_id=10000100&amount_gross=125.50&payment_status=COMPLETE&signature=abc";
    const parsed = parsePayFastNotification(raw);

    expect(parsed.entries.map(([key]) => key)).toEqual([
      "merchant_id",
      "amount_gross",
      "payment_status",
      "signature",
    ]);
    expect(buildPayFastValidationBody(parsed.entries)).toBe(
      "merchant_id=10000100&amount_gross=125.50&payment_status=COMPLETE",
    );
    expect(() => parsePayFastNotification(`${raw}&payment_status=FAILED`)).toThrow();
  });

  it("verifies signatures and rejects malformed or changed signatures", () => {
    const fields = { merchant_id: "10000100", amount_gross: "125.50" };
    const entries: [string, string][] = [...Object.entries(fields), ["signature", generatePayFastSignature(fields, "secret")]];

    expect(verifyPayFastNotificationSignature(entries, entries[2]![1], "secret")).toBe(true);
    expect(verifyPayFastNotificationSignature(entries, "0".repeat(32), "secret")).toBe(false);
  });

  it("accepts only valid source IPs resolved from PayFast hosts", () => {
    expect(isAllowedPayFastSourceIp("203.0.113.8", ["203.0.113.8"])).toBe(true);
    expect(isAllowedPayFastSourceIp("::ffff:203.0.113.8", ["203.0.113.8"])).toBe(true);
    expect(isAllowedPayFastSourceIp("not-an-ip", ["not-an-ip"])).toBe(false);
    expect(isAllowedPayFastSourceIp("203.0.113.9", ["203.0.113.8"])).toBe(false);
  });

  it.each([
    ["0", 0],
    ["12", 1200],
    ["12.3", 1230],
    ["12.34", 1234],
    ["90071992547409.92", null],
    ["-1.00", null],
    ["1.234", null],
    ["01.00", null],
  ])("converts %s to cents safely", (value, expected) => {
    expect(amountToCents(value)).toBe(expected);
  });
});
