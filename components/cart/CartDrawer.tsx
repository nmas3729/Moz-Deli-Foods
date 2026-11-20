"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "./CartProvider";
import MenuProductImage from "@/components/menu/MenuProductImage";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button className="drawer-backdrop" aria-label="Close cart" onClick={() => setIsOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Your order" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.35 }}>
            <div className="drawer-header">
              <div><span className="eyebrow">Your selection</span><h2>Your Order</h2></div>
              <button onClick={() => setIsOpen(false)} aria-label="Close cart"><X /></button>
            </div>
            {items.length === 0 ? (
              <div className="empty-cart">
                <ShoppingBag size={46} strokeWidth={1.2} />
                <h3>Your table is waiting.</h3>
                <p>Find something delicious to make it a meal.</p>
                <button onClick={() => setIsOpen(false)}>Explore the Menu</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {items.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div className="cart-thumb">
                        <MenuProductImage src={item.image} alt={item.imageAlt || item.name} sizes="96px" />
                      </div>
                      <div className="cart-item-info">
                        <div><h3>{item.name}</h3><button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button></div>
                        <p>R{item.price}</p>
                        <div className="quantity-control">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div><span>Subtotal</span><strong>R{subtotal.toFixed(2)}</strong></div>
                  <p>Menu prices are verified before you pay. Delivery arrangements are confirmed by the restaurant.</p>
                  <Link href="/checkout" className="checkout-button" onClick={() => setIsOpen(false)}>Proceed to checkout</Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
