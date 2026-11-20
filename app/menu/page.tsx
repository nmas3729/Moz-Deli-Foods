import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import MenuCatalog from "@/components/menu/MenuCatalog";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Menu",
  description: "Explore Moz Deli Foods' Portuguese chicken, seafood, fish and platter menu in Daveyton, South Africa.",
};

export default function MenuPage() {
  return (
    <main className="premium-menu-page bg-moz-charcoal text-moz-white">
      <section className="premium-menu-hero">
        <Image
          src="/images/hero/hero-main.webp"
          alt="A Moz Deli Foods seafood meal"
          fill
          preload
          sizes="100vw"
        />
        <div className="premium-menu-hero-shade" />
        <div className="premium-menu-hero-copy">
          <p className="premium-eyebrow">Good * Clean * Food</p>
          <h1>Explore Our<br /><em>Menu.</em></h1>
          <p>Portuguese-inspired favourites, seafood, fish, and platters from Daveyton.</p>
          <a href="#menu-list" className="premium-menu-scroll">Browse the menu <ArrowDown size={16} /></a>
        </div>
      </section>

      <section className="premium-menu-section" id="menu-list">
        <div className="premium-menu-section-heading">
          <div>
            <p className="premium-eyebrow">Made for sharing</p>
            <h2>Find your favourite.</h2>
          </div>
          <p>Prices in South African Rand</p>
        </div>
        <MenuCatalog />
      </section>

      <footer className="premium-footer premium-menu-footer">
        <div className="premium-footer-brand">
          <Link href="/" className="wordmark premium-wordmark"><span>MOZ DELI</span><small>FOODS</small></Link>
        </div>
        <div className="premium-footer-details">
          <p className="premium-eyebrow">Visit us</p>
          <address>
            Daveyton: 31031 Mocke Street, Benoni (Next to McDonald&apos;s) - 081 350 0712
            <br />
            Tonga, Nkomazi: 0797 Main Road, next to Domba Cash &amp; Carry - 079 211 6961
          </address>
          <a href={`tel:${business.phone.replaceAll(" ", "")}`}>{business.phone}</a>
        </div>
        <div className="premium-footer-links">
          <Link href="/">Home</Link>
          <Link href="/story">Our story</Link>
          <Link href="/#gallery">Gallery</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms &amp; conditions</Link>
        </div>
        <p className="premium-footer-bottom">
          <span>© {business.legalName} · Daveyton, Gauteng</span>
          <span>Design &amp; hosted by <a href="https://sihleb.co.za/" target="_blank" rel="noreferrer">SihleB Digital Studio</a></span>
        </p>
      </footer>
    </main>
  );
}
