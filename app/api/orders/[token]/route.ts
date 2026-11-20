import { NextResponse } from "next/server";
import { logSafeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { publicToken: token },
      select: {
        orderNumber: true,
        fulfillment: true,
        subtotalCents: true,
        deliveryFeeCents: true,
        totalCents: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            unitPriceCents: true,
            totalPriceCents: true,
          },
        },
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    return NextResponse.json(order);
  } catch (error) {
    logSafeError("public_order_status_failed", error);
    return NextResponse.json({ error: "Order information is temporarily unavailable." }, { status: 503 });
  }
}
