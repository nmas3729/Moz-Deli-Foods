import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logSafeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        stripeSessionId: true,
        fulfillment: true,
        deliveryAddress: true,
        instructions: true,
        subtotalCents: true,
        deliveryFeeCents: true,
        totalCents: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            totalPriceCents: true,
          },
        },
      },
    });

    return NextResponse.json({
      orders: orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      })),
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logSafeError("admin_orders_read_failed", error);
    return NextResponse.json({ error: "Orders could not be loaded." }, { status: 503 });
  }
}
