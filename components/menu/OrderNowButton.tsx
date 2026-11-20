"use client";

import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { MenuProduct } from "@/types";

export default function OrderNowButton({ product }: { product: MenuProduct }) {
  const { addItem } = useCart();
  const [notice, setNotice] = useState("");

  function orderNow() {
    setNotice(addItem(product) ? `${product.name} added to your bag.` : "This item is unavailable for online ordering.");
  }

  return (
    <div className="order-now-control">
      <button
        type="button"
        className="order-now-button"
        onClick={orderNow}
        aria-label={`Order ${product.name}`}
      >
        Order now <ArrowUpRight size={16} aria-hidden="true" />
      </button>
      {notice && <span className="sr-only" role="status">{notice}</span>}
    </div>
  );
}
