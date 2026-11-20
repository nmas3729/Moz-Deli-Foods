import "server-only";
import { FulfillmentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createOrderIdentifiers } from "@/lib/order-service";
import type { StripeOrderLineSnapshot } from "@/lib/stripe-order-data";

export type PaidStripeOrderInput = {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fulfillment: "COLLECTION" | "DELIVERY";
  deliveryAddress: string | null;
  instructions: string | null;
  amountCents: number;
  paidAt: Date;
  items: StripeOrderLineSnapshot[];
};

export async function createPaidStripeOrder(input: PaidStripeOrderInput) {
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: input.sessionId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const existingProducts = new Set((await prisma.menuProduct.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  })).map(({ id }) => id));
  const { orderNumber, publicToken } = createOrderIdentifiers();

  try {
    const order = await prisma.$transaction(async (transaction) => {
      const alreadyCreated = await transaction.order.findUnique({
        where: { stripeSessionId: input.sessionId },
        select: { id: true },
      });
      if (alreadyCreated) return alreadyCreated;

      return transaction.order.create({
        data: {
          orderNumber,
          publicToken,
          stripeSessionId: input.sessionId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          fulfillment: input.fulfillment === "COLLECTION"
            ? FulfillmentMethod.COLLECTION
            : FulfillmentMethod.DELIVERY,
          deliveryAddress: input.fulfillment === "DELIVERY" ? input.deliveryAddress : null,
          instructions: input.instructions,
          subtotalCents: input.amountCents,
          deliveryFeeCents: 0,
          totalCents: input.amountCents,
          paymentMethod: "STRIPE",
          paymentStatus: "PAID",
          status: "PAID",
          paidAt: input.paidAt,
          items: {
            create: input.items.map((item) => ({
              ...(existingProducts.has(item.productId)
                ? { product: { connect: { id: item.productId } } }
                : {}),
              productName: item.name,
              category: item.category,
              quantity: item.quantity,
              unitPriceCents: item.unitAmount,
              totalPriceCents: item.unitAmount * item.quantity,
            })),
          },
          notifications: {
            create: {
              providerPaymentId: `stripe_${input.sessionId}`,
              paymentStatus: "PAID",
              amountCents: input.amountCents,
            },
          },
        },
        select: { id: true },
      });
    }, { isolationLevel: "Serializable" });

    return order.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const duplicate = await prisma.order.findUnique({
        where: { stripeSessionId: input.sessionId },
        select: { id: true },
      });
      if (duplicate) return duplicate.id;
    }
    throw error;
  }
}
