"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent, type MouseEvent } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import MenuProductImage from "@/components/menu/MenuProductImage";

type Fulfillment = "COLLECTION" | "DELIVERY";
type PaymentVerification = {
  paymentStatus: "paid" | "unpaid" | "no_payment_required";
  sessionStatus: "open" | "complete" | "expired" | null;
};

const money = (amount: number) => `R${amount.toFixed(2)}`;

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

export default function StripeCheckoutForm() {
  const { items, hasHydrated, updateQuantity, removeItem, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("COLLECTION");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [preOrderAcknowledged, setPreOrderAcknowledged] = useState(false);
  const [payFastCheckoutKey, setPayFastCheckoutKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const search = useSyncExternalStore(subscribeToLocation, () => window.location.search, () => "");
  const params = new URLSearchParams(search);
  const paymentResult = params.get("payment");
  const sessionId = params.get("session_id");
  const containsPreOrder = items.some((item) => item.preOrderRequired);
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  useEffect(() => {
    if (paymentResult !== "success" || !hasHydrated) return;
    if (!sessionId) return;

    let active = true;
    fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const data = await response.json() as PaymentVerification | { error?: string };
        if (!response.ok) throw new Error("error" in data ? data.error : "Payment status could not be verified.");
        return data as PaymentVerification;
      })
      .then((data) => {
        if (!active) return;
        if (data.paymentStatus === "paid") {
          setPaymentVerified(true);
          clearCart();
        } else if (data.sessionStatus === "expired") {
          setPaymentMessage("This payment session expired. Your bag is unchanged; please try again.");
        } else {
          setPaymentMessage("Stripe has not confirmed this payment yet. Your bag is unchanged while the payment is checked.");
        }
      })
      .catch((cause: unknown) => {
        if (active) setPaymentMessage(cause instanceof Error ? cause.message : "Payment status could not be verified.");
      });

    return () => { active = false; };
  }, [clearCart, hasHydrated, paymentResult, sessionId]);

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          customerEmail: email,
          fulfillment,
          deliveryAddress,
          preOrderAcknowledged,
          items: items.map(({ id, quantity }) => ({ productId: id, quantity })),
        }),
      });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Secure checkout could not be started.");
      }
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Secure checkout could not be started. Please try again.");
      setBusy(false);
    }
  }

  async function startPayFast(event: MouseEvent<HTMLButtonElement>) {
    if (!event.currentTarget.form?.reportValidity()) return;
    setError("");
    setBusy(true);

    try {
      const checkoutKey = payFastCheckoutKey ?? crypto.randomUUID();
      setPayFastCheckoutKey(checkoutKey);
      const response = await fetch("/api/checkout/payfast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, phone, email, instructions: "" },
          fulfillment,
          deliveryAddress,
          items: items.map(({ id, quantity }) => ({ productId: id, quantity })),
          checkoutKey,
          preOrderAcknowledged,
        }),
      });
      const data = await response.json() as {
        paymentUrl?: string;
        fields?: Record<string, string>;
        error?: string;
      };
      if (!response.ok || !data.paymentUrl || !data.fields) {
        if (response.status === 409) setPayFastCheckoutKey(null);
        throw new Error(data.error ?? "Secure PayFast checkout could not be started.");
      }

      const paymentUrl = new URL(data.paymentUrl);
      if (paymentUrl.protocol !== "https:"
        || !["sandbox.payfast.co.za", "www.payfast.co.za"].includes(paymentUrl.hostname)) {
        throw new Error("PayFast returned an invalid payment destination.");
      }

      const form = document.createElement("form");
      form.method = "post";
      form.action = paymentUrl.toString();
      form.hidden = true;
      for (const [fieldName, value] of Object.entries(data.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = fieldName;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Secure PayFast checkout could not be started. Please try again.");
      setBusy(false);
    }
  }

  if (paymentVerified) {
    return (
      <section className="checkout-result">
        <span className="checkout-result-icon"><ShieldCheck size={30} /></span>
        <p className="shop-section-kicker">Payment confirmed by Stripe</p>
        <h1>Thank you<br /><em>for your order.</em></h1>
        <p>Your payment was successfully verified. Moz Deli Foods will contact you about your {fulfillment === "COLLECTION" ? "collection" : "delivery"} order.</p>
        <Link href="/menu" className="checkout-submit">Back to menu <ArrowRight size={16} /></Link>
      </section>
    );
  }

  if (hasHydrated && items.length === 0) {
    return (
      <section className="checkout-empty">
        <p className="shop-section-kicker">Your bag</p>
        <h1>Your bag is empty.</h1>
        <p>Add something delicious from the Moz Deli menu to get started.</p>
        <Link href="/menu" className="checkout-submit">Explore the menu <ArrowRight size={16} /></Link>
        {paymentMessage && <p className="checkout-alert" role="alert">{paymentMessage}</p>}
      </section>
    );
  }

  return (
    <div className="stripe-checkout">
      <Link href="/menu" className="back-link"><ArrowLeft size={16} /> Back to menu</Link>
      <div className="stripe-checkout-heading">
        <p className="shop-section-kicker">A few details, then you&apos;re all set</p>
        <h1>Review your<br /><em>order.</em></h1>
      </div>

      {paymentResult === "cancelled" && <p className="checkout-alert" role="status">Checkout was cancelled. Your bag is saved, so you can continue whenever you&apos;re ready.</p>}
      {paymentResult === "success" && !sessionId && <p className="checkout-alert checkout-alert-error" role="alert">We could not verify the payment session. Please contact Moz Deli Foods before placing the order again.</p>}
      {paymentMessage && <p className="checkout-alert" role="status">{paymentMessage}</p>}

      <div className="stripe-checkout-layout">
        <form className="stripe-checkout-form" onSubmit={startCheckout}>
          <fieldset>
            <legend>01 — Your details</legend>
            <label>
              Full name
              <input autoComplete="name" name="name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Phone number
              <input autoComplete="tel" name="tel" type="tel" required maxLength={20} value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <label>
              Email address
              <input autoComplete="email" name="email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
          </fieldset>

          <fieldset>
            <legend>02 — Delivery or collection</legend>
            <div className="shop-fulfillment-options">
              <label className={fulfillment === "COLLECTION" ? "selected" : ""}>
                <input type="radio" name="fulfillment" value="COLLECTION" checked={fulfillment === "COLLECTION"} onChange={() => setFulfillment("COLLECTION")} />
                <span><strong>Pickup</strong><small>Collect from Moz Deli Foods</small></span>
              </label>
              <label className={fulfillment === "DELIVERY" ? "selected" : ""}>
                <input type="radio" name="fulfillment" value="DELIVERY" checked={fulfillment === "DELIVERY"} onChange={() => setFulfillment("DELIVERY")} />
                <span><strong>Delivery</strong><small>The restaurant will confirm delivery details</small></span>
              </label>
            </div>
            {fulfillment === "DELIVERY" && (
              <label>
                Delivery address
                <textarea
                  autoComplete="street-address"
                  name="deliveryAddress"
                  rows={3}
                  required
                  maxLength={500}
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                />
              </label>
            )}
          </fieldset>

          {containsPreOrder && (
            <label className="preorder-confirmation">
              <input type="checkbox" required checked={preOrderAcknowledged} onChange={(event) => setPreOrderAcknowledged(event.target.checked)} />
              <span>I understand that platter orders require at least 24 hours&apos; notice.</span>
            </label>
          )}

          {error && <p className="checkout-alert checkout-alert-error" role="alert">{error}</p>}
          <button type="button" className="checkout-submit" disabled={busy || !hasHydrated || (containsPreOrder && !preOrderAcknowledged)} onClick={startPayFast}>
            {busy ? "Connecting to PayFast..." : "Pay with PayFast"} <LockKeyhole size={16} />
          </button>
          <button type="submit" className="checkout-submit" disabled={busy || !hasHydrated || (containsPreOrder && !preOrderAcknowledged)}>
            {busy ? "Connecting to Stripe..." : "Pay Now with Stripe"} <LockKeyhole size={16} />
          </button>
          <p className="stripe-security-note"><ShieldCheck size={15} /> Choose PayFast or Stripe. Payments are hosted securely; card details are never stored by Moz Deli Foods.</p>
        </form>

        <aside className="stripe-order-summary">
          <h2>Your bag</h2>
          {items.map((item) => (
            <div className="stripe-summary-item" key={item.id}>
              <div className="stripe-summary-image">
                <MenuProductImage src={item.image} alt={item.imageAlt || item.name} sizes="68px" />
              </div>
              <div className="stripe-summary-copy">
                <h3>{item.name}</h3>
                <p>{money(item.price)} each</p>
                {item.preOrderRequired && <span className="stripe-preorder-note">24-hour pre-order</span>}
                <div className="stripe-quantity">
                  <button type="button" aria-label={`Decrease ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={13} /></button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={`Increase ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={13} /></button>
                  <button type="button" className="stripe-remove" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <strong>{money(item.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="stripe-total"><span>Total</span><strong>{money(subtotal)}</strong></div>
          <p className="stripe-summary-note">
            The server verifies item prices before payment. Delivery fees, if any, are not included and will be confirmed by the restaurant.
          </p>
        </aside>
      </div>
    </div>
  );
}
