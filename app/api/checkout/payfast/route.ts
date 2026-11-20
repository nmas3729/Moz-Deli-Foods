import { NextResponse } from "next/server";
import { z } from "zod";
import { getPayFastConfig, isValidApplicationUrl } from "@/lib/order-config";
import { orderRequestSchema } from "@/lib/checkout-schema";
import { hasTrustedOrigin, logSafeError } from "@/lib/http";
import {
  calculateOrderQuote,
  createPendingOrder,
  OrderServiceError,
} from "@/lib/order-service";
import { generatePayFastSignature } from "@/lib/payfast";
import { prisma } from "@/lib/prisma";

const checkoutSchema = orderRequestSchema.extend({
  checkoutKey: z.uuid(),
  preOrderAcknowledged: z.boolean(),
}).strict();

type HostedPaymentOrder = {
  id: string;
  orderNumber: string;
  publicToken: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  totalCents: number;
  paymentMethod: "PAYFAST" | "STRIPE";
  paymentStatus: "PENDING" | "FAILED" | "CANCELLED" | "PAID" | "REFUNDED";
  stripeSessionId: string | null;
  payfastUuid: string | null;
  status: string;
  fulfillment: "COLLECTION" | "DELIVERY";
  deliveryAddress: string | null;
  instructions: string | null;
  items: { productId: string | null; productName: string; quantity: number }[];
};

function hostedPayment(order: HostedPaymentOrder, baseUrl: string) {
  const config = getPayFastConfig();
  if (!config) throw new Error("PayFast is not configured.");

  const [firstName, ...lastName] = order.customerName.trim().split(/\s+/);
  const fields: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: new URL(`/order/${order.publicToken}?result=returned`, baseUrl).toString(),
    cancel_url: new URL(`/order/${order.publicToken}?result=cancelled`, baseUrl).toString(),
    notify_url: new URL("/api/webhooks/payfast", baseUrl).toString(),
    name_first: firstName ?? "",
    email_address: order.customerEmail ?? "",
    cell_number: order.customerPhone,
    m_payment_id: order.id,
    amount: (order.totalCents / 100).toFixed(2),
    item_name: order.orderNumber,
    item_description: order.items
      .map((item) => `${item.quantity} x ${item.productName}`)
      .join(", ")
      .slice(0, 255),
  };
  if (lastName.length > 0) fields.name_last = lastName.join(" ");
  fields.signature = generatePayFastSignature(fields, config.passphrase);

  return {
    paymentUrl: `https://${config.host}/eng/process`,
    fields,
  };
}

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

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check your details and try again." }, { status: 400 });
  }

  const { checkoutKey, preOrderAcknowledged, ...orderInput } = parsed.data;
  try {
    const config = getPayFastConfig();
    const baseUrl = process.env.APP_BASE_URL?.trim();
    if (!config || !baseUrl || !isValidApplicationUrl(baseUrl)) {
      return NextResponse.json({ error: "Secure PayFast checkout is not configured." }, { status: 503 });
    }

    const quote = await calculateOrderQuote(orderInput);
    if (quote.lines.some((item) => /tomahawk|brisket/i.test(item.name)) && !preOrderAcknowledged) {
      return NextResponse.json({ error: "Please confirm the 24-hour notice for pre-order items." }, { status: 400 });
    }
    let order: HostedPaymentOrder | null = await prisma.order.findUnique({
      where: { checkoutKey },
      select: {
        id: true,
        orderNumber: true,
        publicToken: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        totalCents: true,
        paymentMethod: true,
        paymentStatus: true,
        stripeSessionId: true,
        payfastUuid: true,
        status: true,
        fulfillment: true,
        deliveryAddress: true,
        instructions: true,
        items: { select: { productId: true, productName: true, quantity: true } },
      },
    });

    if (order) {
      const existingItems = order.items;
      const sameItems = existingItems.length === quote.lines.length
        && quote.lines.every((line) => existingItems.some((item) =>
          item.productId === line.productId && item.quantity === line.quantity,
        ));
      if (order.totalCents !== quote.totalCents
        || order.customerName !== orderInput.customer.name.trim()
        || order.customerPhone !== orderInput.customer.phone.trim()
        || order.customerEmail !== orderInput.customer.email.trim().toLowerCase()
        || order.fulfillment !== quote.fulfillment
        || order.deliveryAddress !== (quote.fulfillment === "DELIVERY" ? orderInput.deliveryAddress.trim() : null)
        || order.instructions !== (orderInput.customer.instructions.trim() || null)
        || !sameItems
        || order.paymentMethod !== "PAYFAST"
        || order.stripeSessionId
        || order.payfastUuid
        || order.status !== "AWAITING_PAYMENT"
        || order.paymentStatus !== "PENDING") {
        return NextResponse.json({ error: "This checkout attempt can no longer be used. Review your order again." }, { status: 409 });
      }
    } else {
      const created = await createPendingOrder(orderInput, quote, checkoutKey);
      order = {
        id: created.id,
        orderNumber: created.orderNumber,
        publicToken: created.publicToken,
        customerName: created.customerName,
        customerPhone: created.customerPhone,
        customerEmail: created.customerEmail,
        totalCents: created.totalCents,
        paymentMethod: "PAYFAST",
        paymentStatus: "PENDING",
        stripeSessionId: null,
        payfastUuid: null,
        status: "AWAITING_PAYMENT",
        fulfillment: quote.fulfillment,
        deliveryAddress: quote.fulfillment === "DELIVERY" ? orderInput.deliveryAddress.trim() : null,
        instructions: orderInput.customer.instructions.trim() || null,
        items: created.items,
      };
    }

    const payment = hostedPayment(order, baseUrl);

    return NextResponse.json({
      orderNumber: order.orderNumber,
      publicToken: order.publicToken,
      paymentUrl: payment.paymentUrl,
      fields: payment.fields,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderServiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    logSafeError("payfast_hosted_checkout_failed", error);
    return NextResponse.json({ error: "Secure PayFast checkout could not be started." }, { status: 503 });
  }
}
