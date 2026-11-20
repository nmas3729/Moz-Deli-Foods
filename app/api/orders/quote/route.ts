import { NextResponse } from "next/server";
import { orderRequestSchema } from "@/lib/checkout-schema";
import { hasTrustedOrigin, logSafeError } from "@/lib/http";
import { calculateOrderQuote, OrderServiceError } from "@/lib/order-service";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check your details and try again." }, { status: 400 });
  }

  try {
    const quote = await calculateOrderQuote(parsed.data);
    return NextResponse.json({
      items: quote.lines,
      fulfillment: quote.fulfillment,
      subtotalCents: quote.subtotalCents,
      deliveryFeeCents: quote.deliveryFeeCents,
      totalCents: quote.totalCents,
    });
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    logSafeError("checkout_quote_failed", error);
    return NextResponse.json({ error: "We could not calculate this order. Please try again." }, { status: 503 });
  }
}
