import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { business } from "@/data/business";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Meet founder Zamosi Ngomane and discover the journey from a mobile seafood concept to Moz Deli Foods in Daveyton.",
};

const journey = [
  {
    title: "The Vision",
    text: "Zamosi Ngomane imagined a fresh expression of the braai: one that brought seafood to the centre of the table and treated familiar flavours with a gourmet touch.",
  },
  {
    title: "The Journey",
    text: "Travels through Mozambique and Tanzania broadened his perspective on seafood, spice and the pleasure of sharing a meal. Those experiences helped shape the idea behind Moz Deli Foods.",
  },
  {
    title: "The Growth",
    text: "What began as a mobile seafood concept grew into a place of its own: a restaurant where the original idea could welcome guests around a table in Daveyton.",
  },
  {
    title: "The New Chapter",
    text: "A thoughtful renovation gave Moz Deli Foods a fresh home and a more sophisticated setting. The next chapter is also about opening doors for local young people through opportunity and employment.",
  },
];

export default function StoryPage() {
  return (
    <main className="story-page">
      <section className="story-hero">
        <div className="story-image-frame story-hero-image">
          <Image
            src="/images/restaurant/interior.webp"
            alt="Dining room at Moz Deli Foods in Daveyton"
            fill
            preload
            sizes="100vw"
          />
        </div>
        <div className="story-hero-shade" />
        <div className="story-hero-copy">
          <p className="premium-eyebrow">Good * Clean * Food · Daveyton</p>
          <h1>The Story Behind<br /><em>Moz Deli Foods.</em></h1>
          <p>From a mobile seafood concept to a beautifully renovated restaurant in Daveyton.</p>
          <a href="#founder" className="premium-text-link">Meet the founder <ArrowRight size={16} /></a>
        </div>
      </section>

      <section className="story-founder" id="founder">
        <div className="story-image-frame story-founder-image">
          <Image
            src="/images/founder/founder.jpg"
            alt="Moz Deli Foods founder Zamosi Ngomane"
            fill
            loading="lazy"
            sizes="(max-width: 760px) 100vw, 50vw"
          />
          <span className="premium-image-label">A vision shaped by the sea</span>
        </div>
        <div className="story-founder-copy">
          <p className="premium-eyebrow">The founder · Zamosi Ngomane</p>
          <h2>Seafood at the heart.<br /><em>Fire in the soul.</em></h2>
          <p>
            Moz Deli Foods grew from Zamosi Ngomane&apos;s vision to transform the traditional braai into a gourmet seafood experience. Rather than leave the familiar behind, he saw an opportunity to bring the warmth of the fire together with a fresh focus on seafood.
          </p>
          <p>
            His travels to Mozambique and Tanzania became part of that point of view. The journey from those experiences to a mobile seafood concept, and then to a permanent restaurant in Daveyton, is the story of an idea taking root and finding a home.
          </p>
        </div>
      </section>

      <section className="story-journey">
        <div className="story-section-heading">
          <p className="premium-eyebrow">A journey in four chapters</p>
          <h2>From first spark<br /><em>to a place of our own.</em></h2>
        </div>
        <ol className="story-timeline">
          {journey.map((chapter, index) => (
            <li key={chapter.title}>
              <span className="story-timeline-marker" aria-hidden="true" />
              <div>
                <p className="premium-eyebrow">Chapter 0{index + 1}</p>
                <h3>{chapter.title}</h3>
                <p>{chapter.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="story-daveyton">
        <div className="story-daveyton-copy">
          <p className="premium-eyebrow">Our Daveyton chapter</p>
          <h2>A new home.<br /><em>Rooted here.</em></h2>
          <p>
            The renovated restaurant brings a more sophisticated look to 31031 Mocke Street, Daveyton, next to McDonald&apos;s. It is a new setting for the seafood concept and a place to keep building connections in the community.
          </p>
          <p>
            Zamosi&apos;s vision reaches beyond the dining room: creating opportunities for local youth and contributing to employment are part of what this new chapter means.
          </p>
          <p className="story-address"><MapPin size={16} /> {business.address}</p>
        </div>
        <div className="story-image-frame story-daveyton-image">
          <Image
            src="/images/restaurant/interior.webp"
            alt="Renovated dining space at Moz Deli Foods"
            fill
            loading="lazy"
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="story-cta">
        <p className="premium-eyebrow">The table is waiting</p>
        <h2>Come taste the<br /><em>story for yourself.</em></h2>
        <Link href="/menu" className="premium-button">Experience the Flavors - View Menu <ArrowRight size={17} /></Link>
      </section>

      <footer className="premium-footer story-footer">
        <div className="premium-footer-brand">
          <Link href="/" className="wordmark premium-wordmark"><span>MOZ DELI</span><small>FOODS</small></Link>
          <p>A Taste Worth Coming Back For.</p>
        </div>
        <div className="premium-footer-details">
          <p className="premium-eyebrow">Find us</p>
          <address>
            Daveyton: 31031 Mocke Street, Benoni (Next to McDonald&apos;s) - 081 350 0712
            <br />
            Tonga, Nkomazi: 0797 Main Road, next to Domba Cash &amp; Carry - 079 211 6961
          </address>
          <a href={`tel:${business.phone.replaceAll(" ", "")}`}>{business.phone}</a>
        </div>
        <div className="premium-footer-links">
          <Link href="/menu">Menu</Link>
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
