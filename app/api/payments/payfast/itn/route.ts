import { NextResponse } from "next/server";
import { getPayFastConfig } from "@/lib/order-config";
import {
  amountToCents,
  buildPayFastValidationBody,
  isMatchingAmount,
  isPayFastSource,
  parsePayFastNotification,
  verifyPayFastNotificationSignature,
  verifyPayFastServerConfirmation,
} from "@/lib/payfast";
import { logSafeError } from "@/lib/http";
import { sendPaidOrderNotifications } from "@/lib/order-email";
import { prisma } from "@/lib/prisma";

const invalidNotification = () => NextResponse.json({ error: "Invalid payment notification." }, { status: 400 });

export async function POST(request: Request) {
  const config = getPayFastConfig();
  if (!config) return NextResponse.json({ error: "Payment notifications are not configured." }, { status: 503 });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
    return invalidNotification();
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) return invalidNotification();

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return invalidNotification();
  }
  if (rawBody.length === 0 || rawBody.length > 16_384) return invalidNotification();

  let parsed: ReturnType<typeof parsePayFastNotification>;
  try {
    parsed = parsePayFastNotification(rawBody);
  } catch {
    return invalidNotification();
  }

  const { fields, entries } = parsed;
  const signature = fields.signature;
  const paymentId = fields.pf_payment_id;
  const orderId = fields.m_payment_id;
  const status = fields.payment_status;
  const amountCents = amountToCents(fields.amount_gross ?? "");

  if (!signature
    || !/^[a-f0-9]{32}$/i.test(signature)
    || !verifyPayFastNotificationSignature(entries, signature, config.passphrase)
    || !await isPayFastSource(request.headers)
    || fields.merchant_id !== config.merchantId
    || !paymentId
    || !/^\d+$/.test(paymentId)
    || !orderId
    || !["COMPLETE", "CANCELLED", "FAILED"].includes(status ?? "")
    || amountCents === null) {
    return invalidNotification();
  }

  let isServerConfirmed: boolean;
  try {
    isServerConfirmed = await verifyPayFastServerConfirmation(
      buildPayFastValidationBody(entries),
      config.host,
    );
  } catch (error) {
    logSafeError("payfast_server_confirmation_failed", error);
    return NextResponse.json({ error: "Payment notification could not be verified." }, { status: 502 });
  }
  if (!isServerConfirmed) return invalidNotification();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, totalCents: true, paymentStatus: true, status: true },
  });
  if (!order || !isMatchingAmount(order.totalCents, amountCents)) return invalidNotification();
  try {
    await prisma.$transaction(async (transaction) => {
      const duplicate = await transaction.paymentNotification.findUnique({
        where: { providerPaymentId: paymentId },
        select: { orderId: true },
      });
      if (duplicate) return;

      await transaction.paymentNotification.create({
        data: {
          orderId: order.id,
          providerPaymentId: paymentId,
          paymentStatus: status as "COMPLETE" | "CANCELLED" | "FAILED",
          amountCents,
        },
      });

      if (status === "COMPLETE" && order.paymentStatus !== "PAID" && order.paymentStatus !== "REFUNDED") {
        const result = await transaction.order.updateMany({
          where: { id: order.id, paymentStatus: { notIn: ["PAID", "REFUNDED"] } },
          data: {
            paymentStatus: "PAID",
            status: order.status === "CANCELLED" ? "CANCELLED" : "PAID",
            payfastPaymentId: paymentId,
            paidAt: new Date(),
          },
        });
        if (result.count !== 1) {
          logSafeError("payfast_order_not_updated", new Error("Order was already in a terminal payment state."));
        }
      } else if (status === "CANCELLED" || status === "FAILED") {
        await transaction.order.updateMany({
          where: { id: order.id, paymentStatus: "PENDING" },
          data: {
            paymentStatus: status,
            ...(status === "CANCELLED" ? { status: "CANCELLED" as const } : {}),
            payfastPaymentId: paymentId,
          },
        });
      }
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    logSafeError("payfast_notification_persist_failed", error);
    return NextResponse.json({ error: "Payment notification could not be recorded." }, { status: 500 });
  }

  if (status === "COMPLETE") {
    try {
      await sendPaidOrderNotifications(order.id);
    } catch (error) {
      logSafeError("paid_order_notification_failed", error);
    }
  }
  return new NextResponse("OK", { status: 200 });
}
