"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import MenuProductImage from "@/components/menu/MenuProductImage";
import type { FulfillmentMethod, OrderStatus, PaymentStatus } from "@prisma/client";

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image: string | null;
  imageAlt: string | null;
  priceCents: number | null;
  availability: boolean;
  featured: boolean;
};

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  stripeSessionId: string | null;
  paymentMethod: "STRIPE" | "PAYFAST";
  fulfillment: FulfillmentMethod;
  deliveryAddress: string | null;
  instructions: string | null;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  items: { productName: string; quantity: number; totalPriceCents: number }[];
};

type Settings = {
  onlineOrderingEnabled: boolean;
  collectionEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFeeCents: number | null;
  minimumOrderCents: number | null;
  deliveryAreas: string[];
  collectionEstimateMinutes: number | null;
};

const money = (cents: number) => `R${(cents / 100).toFixed(2)}`;
const parseCents = (value: string): number | null | undefined => {
  if (!value.trim()) return null;
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return undefined;
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0") || 0);
  return Number.isSafeInteger(cents) ? cents : undefined;
};
const statuses: OrderStatus[] = [
  "AWAITING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_COLLECTION",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];
const statusLabel = (value: string) => value.replaceAll("_", " ").toLowerCase();

export default function AdminDashboard({
  initialOrders,
  initialProducts,
  initialSettings,
}: {
  initialOrders: AdminOrder[];
  initialProducts: Product[];
  initialSettings: Settings;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);

  const refreshOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const result = await response.json() as { orders?: AdminOrder[]; error?: string };
      if (!response.ok || !Array.isArray(result.orders)) {
        throw new Error(result.error ?? "Orders could not be loaded.");
      }
      setOrders(result.orders);
      setRefreshError("");
    } catch {
      setRefreshError("Order updates could not be refreshed. Retrying automatically.");
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => { void refreshOrders(); }, 15_000);
    const clearPrintTarget = () => setPrintOrderId(null);
    window.addEventListener("afterprint", clearPrintTarget);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("afterprint", clearPrintTarget);
    };
  }, [refreshOrders]);

  async function update(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown, key = url) {
    setBusyKey(key);
    setNotice("");
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "The change could not be saved.");
      setNotice("Changes saved.");
      if (url.startsWith("/api/admin/orders/")) {
        await refreshOrders();
      } else {
        router.refresh();
      }
      return result;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The change could not be saved.");
      return null;
    } finally {
      setBusyKey("");
    }
  }

  async function uploadMenuImage(file: File, altText: string, key: string) {
    setBusyKey(key);
    setNotice("");
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("altText", altText);
      const response = await fetch("/api/admin/menu/images", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "The image could not be uploaded.");
      if (typeof result.image !== "string") throw new Error("The image upload response was invalid.");
      setNotice("Image uploaded. Save the product to publish it.");
      return result.image;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be uploaded.");
      return null;
    } finally {
      setBusyKey("");
    }
  }

  return (
    <main className="admin-page" data-print-order={printOrderId ?? undefined}>
      <header className="admin-header">
        <div><p className="section-label">Moz Deli Foods</p><h1>Order desk</h1></div>
        <button className="outline-button" onClick={() => signOut({ redirectTo: "/admin/login" })}>Sign out</button>
      </header>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {error && <p className="checkout-error" role="alert">{error}</p>}
      {refreshError && <p className="checkout-error" role="status">{refreshError}</p>}

      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="section-label">01 — Incoming orders</p><h2>Order management</h2></div><span>{orders.length} recent</span></div>
        {orders.length === 0
          ? <p className="admin-empty">No online orders yet.</p>
          : <div className="admin-order-list">
            {orders.map((order) => {
              const isPreOrder = order.items.some((item) => /tomahawk|brisket/i.test(item.productName));
              return (
              <article
                className="admin-order"
                key={order.id}
                data-print-order-active={printOrderId === order.id ? "true" : undefined}
              >
                <div className="admin-order-heading">
                  <div><strong>{order.orderNumber}</strong><time>{new Date(order.createdAt).toLocaleString()}</time></div>
                  <div className="admin-order-badges">
                    <span>{order.paymentMethod === "STRIPE" ? "Stripe" : "PayFast"}</span>
                    <span>{statusLabel(order.paymentStatus)}</span>
                    <span>{statusLabel(order.status)}</span>
                    {isPreOrder && <span className="admin-preorder-badge">PRE-ORDER - 24H NOTICE</span>}
                  </div>
                </div>
                <div className="admin-order-content">
                  <div>
                    <h3>{order.customerName}</h3>
                    <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
                    {order.customerEmail && <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>}
                    <p>{order.fulfillment === "COLLECTION" ? "Collection" : `Delivery — ${order.deliveryAddress ?? ""}`}</p>
                    {order.instructions && <p>Instructions: {order.instructions}</p>}
                  </div>
                  <div>
                    {order.items.map((item, index) => <p key={`${item.productName}-${index}`}>{item.quantity} × {item.productName} · {money(item.totalPriceCents)}</p>)}
                    <strong>Total {money(order.totalCents)}</strong>
                  </div>
                </div>
                <div className="admin-order-actions">
                  <label>Status
                    <select
                      value={order.status}
                      disabled={busyKey === order.id}
                      onChange={(event) => {
                        const nextStatus = event.target.value as OrderStatus;
                        const paymentProvider = order.paymentMethod === "STRIPE" ? "Stripe" : "PayFast";
                        if (nextStatus === "REFUNDED" && !window.confirm(`Confirm that this payment has already been refunded in ${paymentProvider}.`)) {
                          event.target.value = order.status;
                          return;
                        }
                        const select = event.currentTarget;
                        void update(`/api/admin/orders/${order.id}`, "PATCH", {
                          status: nextStatus,
                          refundProcessedExternally: nextStatus === "REFUNDED",
                        }, order.id).then((result) => {
                          if (!result) select.value = order.status;
                        });
                      }}
                    >
                      {statuses.map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}
                    </select>
                  </label>
                  {order.paymentStatus === "PAID" && order.status === "CANCELLED" && (
                    <span>Refund must be processed in {order.paymentMethod === "STRIPE" ? "Stripe" : "PayFast"} separately.</span>
                  )}
                  <button
                    type="button"
                    className="outline-button admin-print-button"
                    onClick={() => {
                      setPrintOrderId(order.id);
                      window.setTimeout(() => window.print(), 0);
                    }}
                  >
                    Print Receipt
                  </button>
                </div>
              </article>
            );})}
          </div>}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading"><div><p className="section-label">02 — Product catalogue</p><h2>Menu and prices</h2></div></div>
        <p className="admin-guidance">Only enter owner-approved product names, prices, descriptions and availability. Prices are stored as integer cents and recalculated from the database at checkout.</p>
        <div className="admin-product-list">
          {initialProducts.map((product) => (
            <MenuProductEditor
              key={product.id}
              product={product}
              busy={busyKey === product.id}
              onUpload={(file, altText) => uploadMenuImage(file, altText, product.id)}
              onSave={(data) => update(`/api/admin/menu/${product.id}`, "PATCH", data, product.id)}
              onDelete={() => {
              if (window.confirm(`Remove ${product.name} from the public menu?`)) void update(`/api/admin/menu/${product.id}`, "DELETE", undefined, product.id);
              }}
            />
          ))}
        </div>
        <NewMenuProduct onCreate={(data) => update("/api/admin/menu", "POST", data, "new-product")} busy={busyKey === "new-product"} />
      </section>

      <RestaurantSettingsEditor initial={initialSettings} busy={busyKey === "settings"} onSave={(data) => update("/api/admin/settings", "PATCH", data, "settings")} />
    </main>
  );
}

function MenuProductEditor({
  product,
  busy,
  onUpload,
  onSave,
  onDelete,
}: {
  product: Product;
  busy: boolean;
  onUpload: (file: File, altText: string) => Promise<string | null>;
  onSave: (data: Record<string, unknown>) => Promise<unknown>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [category, setCategory] = useState(product.category);
  const [image, setImage] = useState(product.image ?? "");
  const [imageAlt, setImageAlt] = useState(product.imageAlt ?? product.name);
  const [price, setPrice] = useState(product.priceCents === null ? "" : (product.priceCents / 100).toFixed(2));
  const [availability, setAvailability] = useState(product.availability);
  const [featured, setFeatured] = useState(product.featured);
  const [localError, setLocalError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceCents = parseCents(price);
    if (priceCents === undefined) {
      setLocalError("Enter a valid price, such as 125.00, or leave it blank.");
      return;
    }
    if (availability && priceCents === null) {
      setLocalError("Add a confirmed price before enabling this product.");
      return;
    }
    setLocalError("");
    await onSave({
      name,
      description: description.trim() || null,
      category,
      image: image.trim() || null,
      imageAlt: image.trim() ? imageAlt.trim() || name : null,
      priceCents,
      availability,
      featured,
    });
  }

  return (
    <form className="admin-product" onSubmit={save}>
      <div className="admin-product-grid">
        <label>Product name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></label>
        <label>Category<input value={category} onChange={(event) => setCategory(event.target.value)} required maxLength={80} /></label>
        <label>Description<input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} /></label>
        <label>Image path<input value={image} onChange={(event) => setImage(event.target.value)} placeholder="/images/food/..." /></label>
        <label>Image alt text<input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} maxLength={200} /></label>
        <label>Price (ZAR)<input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Not confirmed" /></label>
      </div>
      {image && (
        <div className="admin-image-preview">
          <MenuProductImage src={image} alt={imageAlt || name} sizes="160px" />
        </div>
      )}
      <div className="admin-product-actions">
        <label className="admin-upload-label">Upload JPEG, PNG or WebP (5 MB max)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void onUpload(file, imageAlt.trim() || name).then((path) => {
                if (path) setImage(path);
              });
              event.target.value = "";
            }}
          />
        </label>
        <label><input type="checkbox" checked={availability} onChange={(event) => setAvailability(event.target.checked)} /> Available for ordering</label>
        <label><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} /> Featured</label>
        <button className="outline-button" disabled={busy}>Save product</button>
        <button type="button" className="admin-danger-button" onClick={onDelete}>Remove</button>
      </div>
      {localError && <p className="checkout-error" role="alert">{localError}</p>}
    </form>
  );
}

function NewMenuProduct({ onCreate, busy }: { onCreate: (data: Record<string, unknown>) => Promise<unknown>; busy: boolean }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await onCreate({
      name,
      description: null,
      category,
      image: null,
      imageAlt: null,
      priceCents: null,
      availability: false,
      featured: false,
    });
    if (result) {
      setName("");
      setCategory("");
    }
  }

  return (
    <form className="admin-new-product" onSubmit={create}>
      <h3>Add menu product</h3>
      <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></label>
      <label>Category<input value={category} onChange={(event) => setCategory(event.target.value)} required maxLength={80} /></label>
      <button className="primary-button" disabled={busy}>Add product</button>
    </form>
  );
}

function RestaurantSettingsEditor({
  initial,
  busy,
  onSave,
}: {
  initial: Settings;
  busy: boolean;
  onSave: (data: Record<string, unknown>) => Promise<unknown>;
}) {
  const [onlineOrderingEnabled, setOnlineOrderingEnabled] = useState(initial.onlineOrderingEnabled);
  const [collectionEnabled, setCollectionEnabled] = useState(initial.collectionEnabled);
  const [deliveryEnabled, setDeliveryEnabled] = useState(initial.deliveryEnabled);
  const [deliveryFee, setDeliveryFee] = useState(initial.deliveryFeeCents === null ? "" : (initial.deliveryFeeCents / 100).toFixed(2));
  const [minimumOrder, setMinimumOrder] = useState(initial.minimumOrderCents === null ? "" : (initial.minimumOrderCents / 100).toFixed(2));
  const [deliveryAreas, setDeliveryAreas] = useState(initial.deliveryAreas.join(", "));
  const [collectionEstimate, setCollectionEstimate] = useState(initial.collectionEstimateMinutes?.toString() ?? "");
  const [localError, setLocalError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const deliveryFeeCents = parseCents(deliveryFee);
    const minimumOrderCents = parseCents(minimumOrder);
    if (deliveryFeeCents === undefined || minimumOrderCents === undefined) {
      setLocalError("Enter valid ZAR amounts or leave optional values blank.");
      return;
    }
    setLocalError("");
    await onSave({
      onlineOrderingEnabled,
      collectionEnabled,
      deliveryEnabled,
      deliveryFeeCents,
      minimumOrderCents,
      deliveryAreas: deliveryAreas.split(",").map((area) => area.trim()).filter(Boolean),
      collectionEstimateMinutes: collectionEstimate.trim() ? Number(collectionEstimate) : null,
    });
  }

  return (
    <section className="admin-section">
      <div className="admin-section-heading"><div><p className="section-label">03 — Fulfilment</p><h2>Order settings</h2></div></div>
      <p className="admin-guidance">Delivery is off until the restaurant approves its fee and areas. Collection times are estimates; only enter a value confirmed by the owner.</p>
      <form className="admin-settings-form" onSubmit={save}>
        <label><input type="checkbox" checked={collectionEnabled} onChange={(event) => setCollectionEnabled(event.target.checked)} /> Collection approved</label>
        <label><input type="checkbox" checked={deliveryEnabled} onChange={(event) => setDeliveryEnabled(event.target.checked)} /> Delivery approved</label>
        <label><input type="checkbox" checked={onlineOrderingEnabled} onChange={(event) => setOnlineOrderingEnabled(event.target.checked)} /> Accept online orders</label>
        <div className="admin-product-grid">
          <label>Delivery fee (ZAR)<input inputMode="decimal" value={deliveryFee} onChange={(event) => setDeliveryFee(event.target.value)} placeholder="Not configured" /></label>
          <label>Minimum order (ZAR)<input inputMode="decimal" value={minimumOrder} onChange={(event) => setMinimumOrder(event.target.value)} placeholder="No minimum" /></label>
          <label>Collection estimate (minutes)<input inputMode="numeric" value={collectionEstimate} onChange={(event) => setCollectionEstimate(event.target.value)} placeholder="Not configured" /></label>
          <label>Delivery areas (comma-separated)<input value={deliveryAreas} onChange={(event) => setDeliveryAreas(event.target.value)} placeholder="Owner-approved suburbs/areas" /></label>
        </div>
        {localError && <p className="checkout-error" role="alert">{localError}</p>}
        <button className="primary-button" disabled={busy}>Save fulfilment settings</button>
      </form>
    </section>
  );
}
