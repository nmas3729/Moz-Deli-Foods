import { business } from "@/data/business";
import type { CartItem } from "@/types";

export const WHATSAPP_NUMBER = business.whatsappNumber;

export function formatWhatsAppOrder({
  name,
  phone,
  email,
  fulfilment,
  address,
  notes,
  items,
  deliveryFee,
}: {
  name: string;
  phone: string;
  email?: string;
  fulfilment: "Delivery" | "Collection";
  address?: string;
  notes?: string;
  items: CartItem[];
  deliveryFee: number | null;
}) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = [
    `*${business.legalName} — ORDER REQUEST*`,
    "",
    `*Name:* ${name}`,
    `*Phone:* ${phone}`,
    email ? `*Email:* ${email}` : null,
    `*Preference:* ${fulfilment}`,
    fulfilment === "Delivery" && address ? `*Address:* ${address}` : null,
    "",
    "*Order:*",
    ...items.map((item) => `- ${item.quantity} × ${item.name} — R${(item.price * item.quantity).toFixed(2)}`),
    "",
    `*Subtotal:* R${subtotal.toFixed(2)}`,
    deliveryFee === null ? "*Fee:* To be confirmed" : `*${fulfilment} fee:* R${deliveryFee.toFixed(2)}`,
    deliveryFee === null ? "*Estimated total:* R${subtotal.toFixed(2)} plus any confirmed fee" : `*Estimated total:* R${(subtotal + deliveryFee).toFixed(2)}`,
    notes ? `*Notes:* ${notes}` : null,
    "",
    "_Please confirm current availability, pricing, any applicable fees, and acceptance of this order request._",
  ].filter(Boolean);
  return lines.join("\n");
}

export function createWhatsAppOrderUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
