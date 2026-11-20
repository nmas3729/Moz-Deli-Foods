"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Minus, Plus, Trash2 } from "lucide-react";
import { orderRequestSchema } from "@/lib/checkout-schema";
import { useCart } from "@/components/cart/CartProvider";
import MenuProductImage from "@/components/menu/MenuProductImage";

declare global {
  interface Window {
    payfast_do_onsite_payment?: (options: { uuid: string }) => void;
  }
}

type Fulfillment = "COLLECTION" | "DELIVERY";
type CheckoutPayload = {
  customer: { name: string; phone: string; email: string; instructions: string };
  fulfillment: Fulfillment;
  deliveryAddress: string;
  items: { productId: string; quantity: number }[];
};
type MenuResponse = {
  canOrder: boolean;
  fulfillment: {
    collectionEnabled: boolean;
    deliveryEnabled: boolean;
    deliveryFeeCents: number | null;
    minimumOrderCents: number | null;
    deliveryAreas: string[];
    collectionEstimateMinutes: number | null;
  };
};
type Quote = {
  items: {
    productId: string;
    name: string;
    category: string;
    image: string | null;
    quantity: number;
    unitPriceCents: number;
    totalPriceCents: number;
  }[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
};
type Payment = {
  orderNumber: string;
  publicToken: string;
  totalCents: number;
  uuid: string;
  paymentHost: string;
};

const money = (cents: number) => `R${(cents / 100).toFixed(2)}`;

export default function CheckoutForm() {
  const { items, updateQuantity, removeItem } = useCart();
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [menuError, setMenuError] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("COLLECTION");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", instructions: "" });
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const payload = useMemo<CheckoutPayload>(() => ({
    customer,
    fulfillment,
    deliveryAddress,
    items: items.map(({ id, quantity }) => ({ productId: id, quantity })),
  }), [customer, fulfillment, deliveryAddress, items]);

  useEffect(() => {
    let active = true;
    fetch("/api/menu")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Ordering details are unavailable.");
        return data as MenuResponse;
      })
      .then((data) => {
        if (!active) return;
        setMenu(data);
        setFulfillment(data.fulfillment.collectionEnabled ? "COLLECTION" : "DELIVERY");
      })
      .catch((cause: unknown) => {
        if (active) setMenuError(cause instanceof Error ? cause.message : "Ordering details are unavailable.");
      });
    return () => { active = false; };
  }, []);

  function invalidateQuote() {
    setQuote(null);
    setPayment(null);
    setCheckoutKey(null);
    setError("");
  }

  function updateCustomer(field: keyof typeof customer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
    invalidateQuote();
  }

  async function reviewTotal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = orderRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/orders/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "We could not calculate your order.");
      setQuote(data as Quote);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not calculate your order.");
    } finally {
      setBusy(false);
    }
  }

  async function preparePayment() {
    if (!quote) return;
    setBusy(true);
    setError("");
    const attemptKey = checkoutKey ?? crypto.randomUUID();
    setCheckoutKey(attemptKey);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          expectedTotalCents: quote.totalCents,
          checkoutKey: attemptKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCheckoutKey(null);
        if (response.status === 409) setQuote(null);
        throw new Error(data.error ?? "We could not prepare secure payment.");
      }
      setPayment(data as Payment);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not prepare secure payment.");
    } finally {
      setBusy(false);
    }
  }

  function openPayFast() {
    if (!payment || !window.payfast_do_onsite_payment) {
      setError("The secure payment window is not ready. Please wait or try again.");
      return;
    }
    window.payfast_do_onsite_payment({ uuid: payment.uuid });
  }

  const fulfillmentChoices = menu
    ? [
      ...(menu.fulfillment.collectionEnabled ? [["COLLECTION", "Collection"] as const] : []),
      ...(menu.fulfillment.deliveryEnabled ? [["DELIVERY", "Delivery"] as const] : []),
    ]
    : [];
  if (items.length === 0) {
    return (
      <section className="checkout-empty">
        <p className="section-label">Your basket</p>
        <h1>Your basket is empty.</h1>
        <p>Add an available menu item before checkout.</p>
        <Link href="/#menu" className="primary-button">Back to menu <ArrowLeft size={16} /></Link>
      </section>
    );
  }

  if (menuError || (menu && !menu.canOrder)) {
    return (
      <section className="ordering-unavailable">
        <p className="section-label">Secure checkout</p>
        <h1>Ordering is<br /><em>not available yet.</em></h1>
        <p>{menuError || "The restaurant has not yet enabled approved menu prices, fulfilment options and sandbox payment processing."}</p>
        <p>Items in your basket are not submitted as an order until online ordering is enabled.</p>
        <Link href="/#menu" className="primary-button">Return to menu <ArrowLeft size={16} /></Link>
      </section>
    );
  }

  return (
    <>
      {payment && <Script src={`https://${payment.paymentHost}/onsite/engine.js`} onReady={() => setScriptReady(true)} onError={() => setError("PayFast could not be loaded. Please try again later.")} />}
      <Link href="/#menu" className="back-link"><ArrowLeft size={16} /> Back to menu</Link>
      <div className="checkout-heading">
        <p className="section-label">Secure online ordering</p>
        <h1>Review your<br /><em>order.</em></h1>
      </div>
      <ol className="checkout-progress" aria-label="Checkout progress">
        <li className={!quote ? "active" : "complete"}>01 <span>Details</span></li>
        <li className={quote ? "active" : ""}>02 <span>Review total</span></li>
        <li className={payment ? "active" : ""}>03 <span>Pay securely</span></li>
      </ol>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={reviewTotal}>
          <fieldset>
            <legend>01 — Your details</legend>
            <div className="form-grid">
              <label>Full name<input autoComplete="name" required maxLength={120} value={customer.name} onChange={(event) => updateCustomer("name", event.target.value)} /></label>
              <label>Mobile number<input type="tel" autoComplete="tel" required maxLength={20} value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} /></label>
              <label className="form-full">Email address<input type="email" autoComplete="email" required maxLength={254} value={customer.email} onChange={(event) => updateCustomer("email", event.target.value)} /></label>
            </div>
          </fieldset>
          <fieldset>
            <legend>02 — Collection or delivery</legend>
            <div className="fulfilment-options">
              {fulfillmentChoices.map(([value, label]) => (
                <label key={value} className={fulfillment === value ? "selected" : ""}>
                  <input type="radio" name="fulfillment" value={value} checked={fulfillment === value} onChange={() => { setFulfillment(value); invalidateQuote(); }} />
                  <span><strong>{label}</strong><small>{value === "COLLECTION" ? "From Moz Deli Foods" : "Only within approved delivery areas"}</small></span>
                </label>
              ))}
            </div>
            {fulfillment === "DELIVERY" && (
              <label className="address-field">Delivery address
                <textarea autoComplete="street-address" rows={3} required maxLength={500} value={deliveryAddress} onChange={(event) => { setDeliveryAddress(event.target.value); invalidateQuote(); }} />
                <small>Delivery is available only in the restaurant&apos;s configured areas: {menu?.fulfillment.deliveryAreas.join(", ")}</small>
              </label>
            )}
            {fulfillment === "COLLECTION" && menu?.fulfillment.collectionEstimateMinutes && (
              <p className="checkout-disclaimer">Estimated collection time: about {menu.fulfillment.collectionEstimateMinutes} minutes. The restaurant will confirm after payment.</p>
            )}
          </fieldset>
          <fieldset>
            <legend>03 — Order instructions</legend>
            <label>Special instructions<textarea rows={3} maxLength={1000} value={customer.instructions} onChange={(event) => updateCustomer("instructions", event.target.value)} /></label>
          </fieldset>

          {error && <p className="checkout-error" role="alert">{error}</p>}

          {!quote && (
            <button type="submit" className="primary-button" disabled={busy || !menu}>
              {busy ? "Calculating..." : "Review secure total"} <ArrowRight size={16} />
            </button>
          )}
          {quote && !payment && (
            <button type="button" className="primary-button" disabled={busy} onClick={preparePayment}>
              {busy ? "Preparing..." : `Continue to payment — ${money(quote.totalCents)}`} <LockKeyhole size={16} />
            </button>
          )}
          {payment && (
            <div className="payment-ready">
              <p>Order <strong>{payment.orderNumber}</strong> is awaiting payment. No order is confirmed until PayFast verifies payment.</p>
              <button type="button" className="primary-button" disabled={!scriptReady} onClick={openPayFast}>
                {scriptReady ? "Open secure PayFast payment" : "Loading secure payment..."} <LockKeyhole size={16} />
              </button>
              <Link className="text-button" href={`/order/${payment.publicToken}`}>View payment status</Link>
            </div>
          )}
          <p className="checkout-disclaimer">Payments are handled by PayFast. Moz Deli Foods does not collect or store card details. A browser redirect alone is not proof of payment; the restaurant will update your order after PayFast&apos;s server notification is verified.</p>
        </form>

        <aside className="order-summary">
          <h2>Order summary</h2>
          {quote
            ? quote.items.map((item) => (
              <div className="summary-item" key={item.productId}>
                <div className="summary-thumb"><MenuProductImage src={item.image} alt={item.name} sizes="72px" /></div>
                <div className="summary-copy"><h3>{item.name}</h3><p>{item.quantity} × {money(item.unitPriceCents)}</p></div>
                <strong>{money(item.totalPriceCents)}</strong>
              </div>
            ))
            : items.map((item) => (
              <div className="summary-item" key={item.id}>
                <div className="summary-thumb"><MenuProductImage src={item.image} alt={item.imageAlt || item.name} sizes="72px" /></div>
                <div className="summary-copy">
                  <h3>{item.name}</h3>
                  <p>Price and availability will be checked against the current menu.</p>
                  <div className="summary-controls">
                    <button type="button" aria-label={`Decrease ${item.name}`} onClick={() => { updateQuantity(item.id, item.quantity - 1); invalidateQuote(); }}><Minus size={12} /></button>
                    <span>{item.quantity}</span>
                    <button type="button" aria-label={`Increase ${item.name}`} onClick={() => { updateQuantity(item.id, item.quantity + 1); invalidateQuote(); }}><Plus size={12} /></button>
                    <button type="button" className="remove" aria-label={`Remove ${item.name}`} onClick={() => { removeItem(item.id); invalidateQuote(); }}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          <div className="totals">
            {quote
              ? <>
                <div><span>Subtotal</span><strong>{money(quote.subtotalCents)}</strong></div>
                <div><span>Delivery</span><strong>{money(quote.deliveryFeeCents)}</strong></div>
                <div className="grand-total"><span>Total</span><strong>{money(quote.totalCents)}</strong></div>
              </>
              : <p className="checkout-disclaimer">The server will calculate item prices, minimum-order rules and any approved delivery fee before payment.</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
