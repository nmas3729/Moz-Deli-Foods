"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

type OrderStatusData = {
  orderNumber: string;
  fulfillment: "COLLECTION" | "DELIVERY";
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  status: string;
  items: { productName: string; quantity: number; unitPriceCents: number; totalPriceCents: number }[];
};

const money = (cents: number) => `R${(cents / 100).toFixed(2)}`;

export default function OrderStatus({ token, initialOrder }: { token: string; initialOrder: OrderStatusData }) {
  const [order, setOrder] = useState(initialOrder);
  const [refreshError, setRefreshError] = useState(false);
  const paymentVerified = order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED";
  const { clearCart } = useCart();

  useEffect(() => {
    if (paymentVerified) clearCart();
  }, [clearCart, paymentVerified]);

  useEffect(() => {
    if (paymentVerified || ["CANCELLED", "FAILED"].includes(order.paymentStatus)) return;
    let active = true;
    const timer = window.setInterval(() => {
      fetch(`/api/orders/${token}`, { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error("Order status could not be refreshed.");
          return response.json() as Promise<OrderStatusData>;
        })
        .then((freshOrder) => {
          if (active) {
            setOrder(freshOrder);
            setRefreshError(false);
          }
        })
        .catch(() => { if (active) setRefreshError(true); });
    }, 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [order.paymentStatus, paymentVerified, token]);

  return (
    <section className="confirmation">
      <div className="confirmation-icon">{paymentVerified ? <Check /> : <Clock3 />}</div>
      <p className="section-label">{paymentVerified ? "Payment verified" : "Payment status"}</p>
      <h1>{paymentVerified ? <>Thank you.<br /><em>We have your request.</em></> : <>Payment<br /><em>not confirmed yet.</em></>}</h1>
      <p>Order <strong>{order.orderNumber}</strong></p>
      <p>{paymentVerified
        ? "PayFast has verified your payment. Moz Deli Foods will confirm availability and fulfilment details."
        : order.paymentStatus === "CANCELLED" || order.paymentStatus === "FAILED"
          ? "Payment was not completed. No successful payment has been recorded."
          : "We are waiting for PayFast's server confirmation. Do not retry payment unless PayFast shows that the previous attempt was cancelled."}</p>
      {refreshError && <p className="checkout-error">We could not refresh the payment status. Reload this page to check again.</p>}
      <div className="confirmation-order">
        {order.items.map((item, index) => (
          <div key={`${item.productName}-${index}`}>
            <span>{item.quantity} × {item.productName}</span>
            <strong>{money(item.totalPriceCents)}</strong>
          </div>
        ))}
        <div><span>Subtotal</span><strong>{money(order.subtotalCents)}</strong></div>
        <div><span>Delivery</span><strong>{money(order.deliveryFeeCents)}</strong></div>
        <div className="confirmation-total"><span>Total</span><strong>{money(order.totalCents)}</strong></div>
      </div>
      <p>{order.fulfillment === "COLLECTION" ? "Collection" : "Delivery"} · {order.status.replaceAll("_", " ").toLowerCase()}</p>
      <Link href="/#menu" className="text-button">Return to the menu</Link>
    </section>
  );
}
