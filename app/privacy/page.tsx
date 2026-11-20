import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Moz Deli Foods handles personal information in accordance with South Africa's POPIA.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page-shell">
      <article className="legal-page-content">
        <p className="premium-eyebrow">Your information</p>
        <h1>Privacy <em>policy.</em></h1>
        <p className="legal-page-intro">
          Moz Delicious Foods (“Moz Deli Foods”) respects your privacy and handles personal information in line with the Protection of Personal Information Act (POPIA).
        </p>

        <section>
          <h2>Information we use</h2>
          <p>
            When you place or enquire about an order, we may use your name, phone number, order items, fulfilment preference and details you choose to provide. If enabled for your order, we may also process an email address, delivery address or instructions.
          </p>
        </section>

        <section>
          <h2>Why we use it</h2>
          <p>
            We use this information to respond to you, process payments, confirm and fulfil orders, coordinate collection or delivery, prevent misuse, and meet applicable legal and accounting obligations. We process it for these purposes, to perform an order you request, with your consent where required, or where the law permits or requires it. We do not sell your personal information.
          </p>
        </section>

        <section>
          <h2>Service providers and payments</h2>
          <p>
            Information is shared only as needed with payment providers such as Stripe or PayFast, and with the hosting, database or email providers used to operate the service. Card details entered on Stripe’s hosted checkout are processed by Stripe and are not stored by Moz Deli Foods. Providers may process information in other countries under their own privacy terms and applicable safeguards.
          </p>
        </section>

        <section>
          <h2>Retention and your rights</h2>
          <p>
            We keep information only for as long as reasonably needed for the purposes above, including applicable record-keeping requirements, and then securely delete or de-identify it where appropriate. Subject to applicable law, you may ask to access or correct your information, request its deletion, or object to certain processing.
          </p>
          <p>
            Moz Delicious Foods is the responsible party. For the attention of the Information Officer, make a privacy request by calling <a href={`tel:${business.phone.replaceAll(" ", "")}`}>{business.phone}</a> or writing to {business.address}. You may also lodge a complaint with the <a href="https://inforegulator.org.za/" target="_blank" rel="noreferrer">Information Regulator of South Africa</a>.
          </p>
        </section>

        <nav className="legal-page-links" aria-label="Legal pages">
          <Link href="/terms">Read our terms and conditions</Link>
          <Link href="/menu">Back to the menu</Link>
        </nav>
      </article>
    </main>
  );
}
