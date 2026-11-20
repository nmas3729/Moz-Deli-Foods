import { NextResponse } from "next/server";
import { z } from "zod";
import { createPayFastOnsitePayment } from "@/lib/payfast";
import { getOrderReadiness, getPayFastConfig, isValidApplicationUrl } from "@/lib/order-config";
import { orderRequestSchema } from "@/lib/checkout-schema";
import { hasTrustedOrigin, logSafeError } from "@/lib/http";
import { calculateOrderQuote, createPendingOrder, OrderServiceError } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";

const createOrderSchema = orderRequestSchema.extend({
  expectedTotalCents: z.number().int().min(1).max(100_000_000),
  checkoutKey: z.uuid(),
});

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

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check your details and try again." }, { status: 400 });
  }
  const { expectedTotalCents, checkoutKey, ...orderInput } = parsed.data;

  try {
    const readiness = await getOrderReadiness();
    if (!readiness.enabled) {
      return NextResponse.json({ error: "Online payment is not available yet." }, { status: 503 });
    }

    const quote = await calculateOrderQuote(orderInput);
    if (quote.totalCents !== expectedTotalCents) {
      return NextResponse.json({
        error: "The menu total changed. Review the updated total before continuing.",
        code: "QUOTE_CHANGED",
      }, { status: 409 });
    }

    const existing = await prisma.order.findUnique({
      where: { checkoutKey },
      select: { orderNumber: true, publicToken: true, totalCents: true, payfastUuid: true, paymentStatus: true },
    });
    if (existing) {
      if (existing.totalCents !== expectedTotalCents) {
        return NextResponse.json({ error: "This checkout attempt has expired. Review your order again." }, { status: 409 });
      }
      if (existing.payfastUuid) {
        return NextResponse.json({
          orderNumber: existing.orderNumber,
          publicToken: existing.publicToken,
          totalCents: existing.totalCents,
          uuid: existing.payfastUuid,
          paymentHost: getPayFastConfig()?.host,
        });
      }
      return NextResponse.json({ error: "This payment request is still being prepared. Please wait and try again." }, { status: 409 });
    }

    const config = getPayFastConfig();
    const baseUrl = process.env.APP_BASE_URL;
    if (!config || !baseUrl || !isValidApplicationUrl(baseUrl)) {
      return NextResponse.json({ error: "Secure payment is not configured." }, { status: 503 });
    }

    const order = await createPendingOrder(orderInput, quote, checkoutKey);
    const itemDescription = order.items
      .map((item) => `${item.quantity} x ${item.productName}`)
      .join(", ")
      .slice(0, 255);
    const paymentFields: Record<string, string> = {
      return_url: new URL(`/order/${order.publicToken}?result=returned`, baseUrl).toString(),
      cancel_url: new URL(`/order/${order.publicToken}?result=cancelled`, baseUrl).toString(),
      notify_url: new URL("/api/payments/payfast/itn", baseUrl).toString(),
      name_first: order.firstName,
      email_address: order.customerEmail ?? orderInput.customer.email.trim().toLowerCase(),
      cell_number: order.customerPhone,
      m_payment_id: order.id,
      amount: (order.totalCents / 100).toFixed(2),
      item_name: order.orderNumber,
      item_description: itemDescription,
    };
    if (order.lastName) paymentFields.name_last = order.lastName;

    try {
      const uuid = await createPayFastOnsitePayment(paymentFields);
      await prisma.order.update({
        where: { id: order.id },
        data: { payfastUuid: uuid },
      });
      return NextResponse.json({
        orderNumber: order.orderNumber,
        publicToken: order.publicToken,
        totalCents: order.totalCents,
        uuid,
        paymentHost: config.host,
      }, { status: 201 });
    } catch (error) {
      logSafeError("payfast_payment_request_failed", error);
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "FAILED" },
      });
      return NextResponse.json({
        error: "Secure payment could not be started. No payment confirmation was received.",
      }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    logSafeError("order_creation_failed", error);
    return NextResponse.json({ error: "We could not prepare this order. Please try again." }, { status: 503 });
  }
}
