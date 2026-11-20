import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { hasTrustedOrigin, logSafeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_COLLECTION",
    "OUT_FOR_DELIVERY",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
  ]),
  refundProcessedExternally: z.boolean().optional(),
}).strict();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  }
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid order update." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const transitions: Record<string, string[]> = {
      AWAITING_PAYMENT: ["CANCELLED"],
      PAID: ["CONFIRMED", "PREPARING", "CANCELLED", "REFUNDED"],
      CONFIRMED: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY_FOR_COLLECTION", "OUT_FOR_DELIVERY", "CANCELLED"],
      READY_FOR_COLLECTION: ["COMPLETED"],
      OUT_FOR_DELIVERY: ["COMPLETED"],
      CANCELLED: ["REFUNDED"],
      COMPLETED: ["REFUNDED"],
      REFUNDED: [],
    };
    if (!transitions[order.status].includes(parsed.data.status)) {
      return NextResponse.json({ error: "That order status transition is not allowed." }, { status: 409 });
    }
    if (parsed.data.status === "CONFIRMED"
      || parsed.data.status === "PREPARING"
      || parsed.data.status === "READY_FOR_COLLECTION"
      || parsed.data.status === "OUT_FOR_DELIVERY"
      || parsed.data.status === "COMPLETED") {
      if (order.paymentStatus !== "PAID") {
        return NextResponse.json({ error: "Only a verified paid order can move to fulfilment." }, { status: 409 });
      }
    }
    if (parsed.data.status === "READY_FOR_COLLECTION" && order.fulfillment !== "COLLECTION") {
      return NextResponse.json({ error: "This order is not a collection order." }, { status: 409 });
    }
    if (parsed.data.status === "OUT_FOR_DELIVERY" && order.fulfillment !== "DELIVERY") {
      return NextResponse.json({ error: "This order is not a delivery order." }, { status: 409 });
    }
    if (parsed.data.status === "REFUNDED"
      && (order.paymentStatus !== "PAID" || parsed.data.refundProcessedExternally !== true)) {
      const paymentProvider = order.paymentMethod === "STRIPE" ? "Stripe" : "PayFast";
      return NextResponse.json({ error: `Process the refund in ${paymentProvider} first, then confirm it here.` }, { status: 409 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.status === "REFUNDED" ? { paymentStatus: "REFUNDED" } : {}),
      },
      select: { id: true, orderNumber: true, status: true, paymentStatus: true, updatedAt: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    logSafeError("admin_order_update_failed", error);
    return NextResponse.json({ error: "The order status could not be updated." }, { status: 503 });
  }
}
