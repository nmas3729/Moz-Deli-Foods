import "server-only";
import { logSafeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type EmailResult = "sent" | "not-configured" | "failed";

async function sendEmail(to: string, subject: string, text: string, idempotencyKey: string): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return "not-configured";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.error(JSON.stringify({ event: "order_email_provider_rejected", status: response.status }));
    return "failed";
  }
  return "sent";
}

export async function sendPaidOrderNotifications(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!order || order.paymentStatus !== "PAID" || order.notificationSentAt) return;
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return;

  const itemLines = order.items.map((item) =>
    `${item.quantity} x ${item.productName} — R${(item.totalPriceCents / 100).toFixed(2)}`,
  );
  const details = [
    `Order ${order.orderNumber}`,
    `Payment verified`,
    `Fulfilment: ${order.fulfillment === "COLLECTION" ? "Collection" : "Delivery"}`,
    "",
    ...itemLines,
    `Subtotal: R${(order.subtotalCents / 100).toFixed(2)}`,
    `Delivery: R${(order.deliveryFeeCents / 100).toFixed(2)}`,
    `Total: R${(order.totalCents / 100).toFixed(2)}`,
  ];
  const customerResult = order.customerEmail
    ? await sendEmail(
      order.customerEmail,
      `Payment confirmed — ${order.orderNumber}`,
      `${details.join("\n")}\n\nMoz Deli Foods will contact you to confirm fulfilment.`,
      `${order.id}-customer-payment-confirmed`,
    )
    : "not-configured";
  const restaurantEmail = process.env.ORDER_NOTIFICATION_EMAIL?.trim();
  const restaurantResult = restaurantEmail
    ? await sendEmail(
      restaurantEmail,
      `Paid online order — ${order.orderNumber}`,
      [
        ...details,
        "",
        `Customer: ${order.customerName}`,
        `Phone: ${order.customerPhone}`,
        `Email: ${order.customerEmail ?? "not provided"}`,
        order.deliveryAddress ? `Delivery address: ${order.deliveryAddress}` : "",
        order.instructions ? `Instructions: ${order.instructions}` : "",
      ].filter(Boolean).join("\n"),
      `${order.id}-restaurant-payment-confirmed`,
    )
    : "not-configured";

  if ((!order.customerEmail || customerResult === "sent")
    && (restaurantResult === "sent" || restaurantResult === "not-configured")) {
    await prisma.order.updateMany({
      where: { id: order.id, notificationSentAt: null },
      data: { notificationSentAt: new Date() },
    });
  } else {
    logSafeError("paid_order_email_incomplete", new Error("Email provider did not send all configured notifications."));
  }
}
