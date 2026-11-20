import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import MenuProductImage from "@/components/menu/MenuProductImage";
import OrderNowButton from "@/components/menu/OrderNowButton";
import { business } from "@/data/business";
import { menuItems } from "@/data/menu";
import { siteUrl } from "@/lib/site-url";

const signatureIds = ["queen-prawns", "full-portuguese-chicken", "sea-food-boil"];
const signatureDishes = signatureIds.flatMap((id) => menuItems.filter((item) => item.id === id));
const signatureCopy = [
  {
    category: "Seafood",
    name: "Queen Prawns",
    description: "4 queen prawns served with seafood paella rice and Moz Deli salad.",
    price: "R150.00",
  },
  {
    category: "Portuguese Chicken",
    name: "Full Portuguese Chicken",
    description: "Served with Fried Rice and Moz Deli Salad.",
    price: "R195.00",
  },
  {
    category: "Seafood",
    name: "Sea Food Boil",
    description: "Mussels, queen prawns, chorizo, sweet corn, crab, sweet potato, paella rice, and Moz Deli salad.",
    price: "R380.00",
  },
];

const gallery = [
  ["/images/gallery/moz-deli-plated-dish-01.webp", "A Moz Deli plated dish"],
  ["/images/restaurant/interior.webp", "Inside Moz Deli Foods"],
  ["/images/food/seafood/grilled-fish-closeup.webp", "Seafood from the Moz Deli menu"],
  ["/images/gallery/moz-deli-plated-dish-02.webp", "A plated Moz Deli meal"],
  ["/images/restaurant/service-counter.webp", "Moz Deli Foods service counter"],
  ["/images/gallery/moz-deli-sign.webp", "Moz Deli Foods sign"],
];

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: business.brandName,
  alternateName: business.legalName,
  url: siteUrl.toString(),
  image: new URL("/images/hero/hero-main.webp", siteUrl).toString(),
  telephone: business.phone,
  priceRange: "R100-R200",
  servesCuisine: "Portuguese",
  address: {
    "@type": "PostalAddress",
    streetAddress: "31031 Mocke Street",
    addressLocality: "Daveyton",
    addressRegion: "Gauteng",
    postalCode: "1501",
    addressCountry: "ZA",
  },
};

export default function Home() {
  return (
    <main className="premium-home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema).replace(/</g, "\\u003c") }}
      />
      <section className="cinematic-home-hero">
        <div className="cinematic-hero-copy">
          <p className="premium-eyebrow">Kasi&apos;s Finest · Daveyton</p>
          <h1>Good * Clean * Food. <em>A Taste Worth Coming Back For.</em></h1>
          <p className="cinematic-hero-description">
            From our famous seafood braai to our smoked tomahawk. Bringing people together in Daveyton with Mozambique-inspired flavours. 🛳️ 🇲🇿 🇿🇦
          </p>
          <div className="cinematic-hero-actions">
            <Link href="/menu" className="premium-button">Order online <ArrowRight size={17} /></Link>
            <Link href="/menu#menu-list" className="premium-button-outline">View menu</Link>
          </div>
          <p className="cinematic-location"><MapPin size={15} /> Daveyton &amp; Nkomazi, South Africa</p>
        </div>

        <div className="cinematic-hero-art">
          <div className="cinematic-hero-glow" />
          <div className="cinematic-hero-image">
            <Image
              src="/images/food/seafood/fish-and-chips.webp"
              alt="Seafood plate from the Moz Deli menu"
              fill
              preload
              sizes="(max-width: 760px) 90vw, 48vw"
            />
          </div>
        </div>

        <a href="#signature-dishes" className="cinematic-scroll-cue">
          <span>Discover Moz Deli</span><ArrowDown size={15} />
        </a>
      </section>

      <section className="premium-section signature-section" id="signature-dishes">
        <div className="premium-section-heading">
          <div>
            <p className="premium-eyebrow">A Moz Deli selection</p>
            <h2>Indulge in<br /><em>culinary artistry.</em></h2>
          </div>
          <Link href="/menu" className="premium-text-link">Explore the full menu <ArrowUpRight size={16} /></Link>
        </div>

        <div className="signature-grid">
          {signatureDishes.map((dish, index) => (
            <article className={`signature-card signature-card-${index + 1}`} key={dish.id}>
              <div className="signature-card-image">
                <MenuProductImage
                  src={dish.image}
                  alt={dish.imageAlt || dish.name}
                  sizes="(max-width: 760px) 90vw, (max-width: 1100px) 45vw, 30vw"
                />
                <span className="signature-card-number">0{index + 1}</span>
              </div>
              <div className="signature-card-content">
                <p className="premium-eyebrow">{signatureCopy[index].category}</p>
                <h3>{signatureCopy[index].name}</h3>
                <p>{signatureCopy[index].description}</p>
                <div className="signature-card-footer">
                  <strong>{signatureCopy[index].price}</strong>
                  <OrderNowButton product={dish} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-story-section" id="story">
        <div className="premium-story-image">
          <Image
            src="/images/restaurant/interior.webp"
            alt="Dining area at Moz Deli Foods in Daveyton"
            fill
            loading="lazy"
            sizes="(max-width: 760px) 100vw, 50vw"
          />
          <span className="premium-image-label">Moz Deli Foods · Daveyton</span>
        </div>
        <div className="premium-story-copy">
          <p className="premium-eyebrow">Good * Clean * Food</p>
          <h2>A Taste Worth<br /><em>Coming Back For.</em></h2>
          <p>
            Founded by Zamosi Ngomane, Moz Deli Foods started as a mobile seafood braai inspired by Mozambique. Today, we are Daveyton&apos;s home for gourmet Kasi flavour. Thank you for the amazing continued support. 🙏🏽
          </p>
          <Link href="/menu" className="premium-text-link">Discover our menu <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="premium-section atmosphere-section" id="gallery">
        <div className="premium-section-heading">
          <div>
            <p className="premium-eyebrow">A closer look</p>
            <h2>The food.<br /><em>The atmosphere.</em></h2>
          </div>
          <p className="atmosphere-intro">A glimpse of Moz Deli Foods in Daveyton.</p>
        </div>
        <div className="cinematic-gallery-grid">
          {gallery.map(([src, alt], index) => (
            <div className={`cinematic-gallery-item cinematic-gallery-item-${index + 1}`} key={src}>
              <Image src={src} alt={alt} fill loading="lazy" sizes="(max-width: 760px) 100vw, 33vw" />
            </div>
          ))}
        </div>
      </section>

      <section className="premium-section experience-section" aria-labelledby="experience-title">
        <div className="experience-heading">
          <p className="premium-eyebrow">At the table</p>
          <h2 id="experience-title">The Moz Deli<br /><em>experience.</em></h2>
          <p>Discover what defines Moz Deli Foods. For guest reviews, please refer to the restaurant&apos;s public business listing.</p>
        </div>
        <div className="experience-grid">
          <article>
            <span>01</span>
            <h3>Portuguese Inspiration</h3>
            <p>Inspired by Mozambique and Portuguese cuisine, fused with South African braai culture.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Good * Clean * Food</h3>
            <p>Our promise. Fresh ingredients, smoked meats, and house-made Moz Deli sauce.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Made for sharing</h3>
            <p>From Seafood Boils to Smoked Tomahawks. Perfect for family and community gatherings.</p>
          </article>
        </div>
      </section>

      <footer className="premium-footer">
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
          <a href={business.googleBusinessUrl} target="_blank" rel="noreferrer">Business listing</a>
        </div>
        <p className="premium-footer-bottom">© {business.legalName} · Daveyton, Gauteng</p>
      </footer>
    </main>
  );
}
