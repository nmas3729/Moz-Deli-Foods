import { business } from "@/data/business";

export default function WhatsAppButton() {
  const message = `Hello ${business.legalName}, I have a question.`;
  const href = `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      className="whatsapp-float"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.04 3C8.86 3 3 8.84 3 15.98c0 2.28.6 4.5 1.74 6.45L3 29l6.74-1.76a13.1 13.1 0 0 0 6.3 1.61C23.22 28.85 29 23 29 15.98 29 8.84 23.22 3 16.04 3Zm7.65 18.36c-.33.92-1.94 1.76-2.7 1.87-.72.1-1.65.15-2.66-.17-.61-.19-1.4-.45-2.41-.89-4.24-1.83-7-6.08-7.21-6.36-.21-.28-1.72-2.29-1.72-4.37 0-2.08 1.09-3.1 1.48-3.52.39-.42.85-.52 1.13-.52h.81c.26.02.61-.1.96.73.35.84 1.19 2.92 1.29 3.13.1.21.17.46.03.74-.14.28-.21.45-.42.69-.21.24-.44.54-.63.73-.21.21-.43.44-.18.86.25.42 1.11 1.83 2.38 2.96 1.64 1.46 3.02 1.91 3.45 2.12.43.21.68.18.93-.11.25-.28 1.07-1.25 1.36-1.68.29-.42.57-.35.96-.21.39.14 2.48 1.17 2.91 1.38.43.21.71.32.82.5.11.18.11 1.02-.22 1.94Z" />
      </svg>
    </a>
  );
}
