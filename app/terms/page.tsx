import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Ordering, pre-order, pricing and refund information for Moz Deli Foods in Daveyton.",
};

export default function TermsPage() {
  return (
    <main className="legal-page-shell">
      <article className="legal-page-content">
        <p className="premium-eyebrow">Before placing an order</p>
        <h1>Terms &amp; <em>conditions.</em></h1>
        <p className="legal-page-intro">
          These terms explain the main conditions for using the Moz Deli Foods website and placing an order. Nothing here limits rights you have under applicable South African law.
        </p>

        <section>
          <h2>Menu, prices and availability</h2>
          <p>
            Menu items and availability may change. All displayed prices are in South African Rand (ZAR). The price shown at checkout is the amount submitted for payment; any delivery charge or delivery arrangement must be confirmed by the restaurant before an order is fulfilled.
          </p>
        </section>

        <section>
          <h2>Pre-orders</h2>
          <p>
            Smoked Tomahawk and Smoked Chuck Rib Cage platter orders require at least 24 hours&apos; notice. Submitting a pre-order request does not guarantee availability until Moz Deli Foods confirms it.
          </p>
        </section>

        <section>
          <h2>Payments, cancellations and refunds</h2>
          <p>
            Payments are processed by the payment provider shown at checkout. If you need to change or cancel an order, contact Moz Deli Foods as soon as possible at <a href={`tel:${business.phone.replaceAll(" ", "")}`}>{business.phone}</a>. Refund requests are reviewed in accordance with applicable law and the payment provider&apos;s process. Any refund timing depends on the provider and your bank.
          </p>
        </section>

        <section>
          <h2>Collection and delivery</h2>
          <p>
            Collection or delivery options, timing, delivery areas and fees are subject to the restaurant&apos;s current service settings and confirmation. Contact the restaurant if details are unclear before completing payment.
          </p>
        </section>

        <nav className="legal-page-links" aria-label="Legal pages">
          <Link href="/privacy">Read our privacy policy</Link>
          <Link href="/menu">Back to the menu</Link>
        </nav>
      </article>
    </main>
  );
}
