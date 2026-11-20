"use client";

import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

const links = [
  ["Home", "/"],
  ["Menu", "/menu"],
  ["Our Story", "/story"],
  ["Gallery", "/#gallery"],
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, setIsOpen } = useCart();

  return (
    <header className="site-header">
      <Link href="/" className="wordmark premium-wordmark" aria-label="Moz Deli Foods home">
        <span>MOZ DELI</span>
        <small>FOODS</small>
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
      </nav>
      <div className="nav-actions">
        <button className="bag-button" onClick={() => setIsOpen(true)} aria-label={`Open cart with ${itemCount} items`}>
          <ShoppingBag size={20} />
          {itemCount > 0 && <span>{itemCount}</span>}
        </button>
        <Link href="/menu" className="order-button">Order now</Link>
        <button className="menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-label="Toggle menu">
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
      {mobileOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {links.map(([label, href]) => <Link key={label} href={href} onClick={() => setMobileOpen(false)}>{label}</Link>)}
          <button onClick={() => { setMobileOpen(false); setIsOpen(true); }}>View cart ({itemCount})</button>
          <Link href="/menu" className="mobile-order-link" onClick={() => setMobileOpen(false)}>Order now</Link>
        </nav>
      )}
    </header>
  );
}
