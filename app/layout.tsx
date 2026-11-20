import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import Navbar from "@/components/layout/Navbar";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { siteUrl } from "@/lib/site-url";

const editorial = Cormorant_Garamond({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Moz Deli Foods | Good * Clean * Food | Daveyton",
    template: "%s | Moz Deli Foods",
  },
  description: "Discover Portuguese cuisine, seafood, chicken, fish and platters at Moz Deli Foods in Daveyton, Benoni, South Africa.",
  openGraph: {
    title: "Moz Deli Foods | Good * Clean * Food | Daveyton",
    description: "Discover Portuguese cuisine and Moz Deli favourites in Daveyton, Benoni, South Africa.",
    type: "website",
    locale: "en_ZA",
    siteName: "Moz Deli Foods",
    images: [
      {
        url: "/images/hero/hero-main.webp",
        alt: "A signature Moz Deli Foods meal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Moz Deli Foods | Good * Clean * Food | Daveyton",
    description: "Discover Portuguese cuisine and Moz Deli favourites in Daveyton, Benoni, South Africa.",
    images: ["/images/hero/hero-main.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${editorial.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-moz-charcoal text-moz-white antialiased">
        <CartProvider>
          <Navbar />
          {children}
          <CartDrawer />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
