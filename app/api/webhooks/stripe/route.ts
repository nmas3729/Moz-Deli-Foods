import { NextResponse } from "next/server";
import Stripe from "stripe";
import { logSafeError } from "@/lib/http";
import { sendPaidOrderNotifications } from "@/lib/order-email";
import { createPaidStripeOrder } from "@/lib/stripe-order";
import {
  parseStripeOrderItems,
  StripeOrderValidationError,
  validateStripeOrderLines,
} from "@/lib/stripe-order-data";

const MAX_WEBHOOK_BODY_LENGTH = 1_000_000;
const invalidWebhook = () => NextResponse.json({ error: "Invalid Stripe webhook." }, { status: 400 });

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhooks are not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return invalidWebhook();

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return invalidWebhook();
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > MAX_WEBHOOK_BODY_LENGTH) {
    return invalidWebhook();
  }

  let payload: Buffer;
  try {
    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_WEBHOOK_BODY_LENGTH) return invalidWebhook();
    payload = Buffer.from(body);
  } catch {
    return invalidWebhook();
  }
  if (payload.length === 0) return invalidWebhook();

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    logSafeError("stripe_webhook_signature_invalid", error);
    return invalidWebhook();
  }

  if (event.type !== "checkout.session.completed"
    && event.type !== "checkout.session.async_payment_succeeded") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "payment" || session.status !== "complete" || session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  try {
    const metadata = session.metadata;
    const customerName = metadata?.customer_name?.trim();
    const customerPhone = metadata?.customer_phone?.trim();
    const fulfillment = metadata?.fulfillment;
    const deliveryAddress = metadata?.delivery_address?.trim();
    if (!customerName || customerName.length > 120
      || !customerPhone || !/^\+?[0-9 ()-]{8,20}$/.test(customerPhone)
      || (fulfillment !== "COLLECTION" && fulfillment !== "DELIVERY")
      || deliveryAddress === undefined || deliveryAddress.length > 500
      || (fulfillment === "DELIVERY" && !deliveryAddress)) {
      throw new StripeOrderValidationError("Checkout customer metadata is invalid.");
    }

    const references = parseStripeOrderItems(metadata?.items);
    const stripeLineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
    });
    if (stripeLineItems.has_more) {
      throw new StripeOrderValidationError("Checkout returned too many line items.");
    }

    const lines = stripeLineItems.data.map((line) => {
      const product = line.price?.product;
      if (!product || typeof product === "string" || product.deleted) {
        throw new StripeOrderValidationError("Checkout product details are unavailable.");
      }
      return {
        productId: product.metadata.product_id ?? "",
        category: product.metadata.category ?? "",
        name: product.name,
        quantity: line.quantity ?? 0,
        unitAmount: line.price?.unit_amount ?? 0,
        currency: line.currency ?? "",
        preOrderRequired: product.metadata.pre_order_required === "true",
      };
    });
    const verified = validateStripeOrderLines(
      references,
      lines,
      session.amount_total,
    );
    if (lines.some((line) => line.preOrderRequired)
      && metadata?.pre_order_acknowledged !== "true") {
      throw new StripeOrderValidationError("Pre-order acknowledgement is missing.");
    }

    const customerEmail = session.customer_details?.email ?? session.customer_email;
    const orderId = await createPaidStripeOrder({
      sessionId: session.id,
      customerName,
      customerPhone,
      customerEmail: customerEmail?.trim().toLowerCase() || null,
      fulfillment,
      deliveryAddress: deliveryAddress || null,
      instructions: lines.some((line) => line.preOrderRequired)
        ? "Customer acknowledged the 24-hour pre-order notice."
        : null,
      amountCents: verified.subtotalCents,
      paidAt: new Date(event.created * 1000),
      items: verified.lines,
    });

    await sendPaidOrderNotifications(orderId);
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof StripeOrderValidationError) {
      logSafeError("stripe_webhook_order_invalid", error);
    } else {
      logSafeError("stripe_webhook_order_persistence_failed", error);
    }
    return NextResponse.json({ error: "Stripe order could not be recorded." }, { status: 500 });
  }
}
