import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { menuItems } from "@/data/menu";
import { hasTrustedOrigin, logSafeError } from "@/lib/http";
import { isValidApplicationUrl } from "@/lib/order-config";
import { encodeStripeOrderItems } from "@/lib/stripe-order-data";

const checkoutRequestSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/),
  customerEmail: z.email().max(254),
  fulfillment: z.enum(["COLLECTION", "DELIVERY"]),
  deliveryAddress: z.string().trim().max(500).optional().default(""),
  preOrderAcknowledged: z.boolean(),
  items: z.array(z.object({
    productId: z.string().min(1).max(100),
    quantity: z.number().int().min(1).max(20),
  }).strict()).min(1).max(20),
}).strict();

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

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check your details and try again." }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const baseUrl = process.env.APP_BASE_URL?.trim();
  if (!secretKey || !baseUrl || !isValidApplicationUrl(baseUrl)) {
    return NextResponse.json({ error: "Secure Stripe checkout is not configured." }, { status: 503 });
  }

  const productsById = new Map(menuItems.map((item) => [item.id, item]));
  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (quantity > 20 || !productsById.has(item.productId)) {
      return NextResponse.json({ error: "One or more items are no longer available for checkout." }, { status: 400 });
    }
    quantities.set(item.productId, quantity);
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const [productId, quantity] of quantities) {
    const product = productsById.get(productId);
    if (!product || product.price === null || product.availability !== "available") {
      return NextResponse.json({ error: "One or more items are no longer available for checkout." }, { status: 400 });
    }
    lineItems.push({
      quantity,
      price_data: {
        currency: "zar",
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: product.name,
          description: product.preOrderRequired
            ? "Pre-order required: please allow at least 24 hours' notice."
            : product.description ?? undefined,
          metadata: {
            product_id: product.id,
            category: product.category,
            pre_order_required: product.preOrderRequired ? "true" : "false",
          },
        },
      },
    });
  }

  const containsPreOrder = [...quantities.keys()].some((productId) => productsById.get(productId)?.preOrderRequired);
  if (containsPreOrder && !parsed.data.preOrderAcknowledged) {
    return NextResponse.json({ error: "Please confirm the 24-hour notice for pre-order items." }, { status: 400 });
  }

  let orderItemsMetadata: string;
  try {
    orderItemsMetadata = encodeStripeOrderItems(
      [...quantities].map(([productId, quantity]) => ({ productId, quantity })),
    );
  } catch (error) {
    logSafeError("stripe_checkout_metadata_invalid", error);
    return NextResponse.json({ error: "This order could not be prepared for secure checkout." }, { status: 500 });
  }

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      customer_email: parsed.data.customerEmail,
      line_items: lineItems,
      success_url: new URL("/checkout?payment=success&session_id={CHECKOUT_SESSION_ID}", baseUrl).toString(),
      cancel_url: new URL("/checkout?payment=cancelled", baseUrl).toString(),
      metadata: {
        customer_name: parsed.data.customerName,
        customer_phone: parsed.data.phone,
        fulfillment: parsed.data.fulfillment,
        delivery_address: parsed.data.deliveryAddress,
        pre_order_acknowledged: containsPreOrder ? "true" : "false",
        items: orderItemsMetadata,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout link. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    logSafeError("stripe_checkout_session_failed", error);
    return NextResponse.json({ error: "Secure checkout could not be started. Please try again." }, { status: 502 });
  }
}
