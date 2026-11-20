import { notFound } from "next/navigation";
import { connection } from "next/server";
import { business } from "@/data/business";
import OrderStatus from "@/app/order/[token]/OrderStatus";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) notFound();

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
  if (!order) notFound();

  return (
    <main className="checkout-page confirmation-page">
      <OrderStatus token={token} initialOrder={order} />
      <p className="checkout-disclaimer">Questions? Contact {business.legalName} at {business.phone}.</p>
    </main>
  );
}
