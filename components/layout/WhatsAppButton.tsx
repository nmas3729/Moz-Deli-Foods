import { MessageCircle } from "lucide-react";
import { business } from "@/data/business";

export default function WhatsAppButton() {
  const message = `Hello ${business.legalName}, I have a question.`;
  const href = `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a className="whatsapp-float" href={href} target="_blank" rel="noreferrer">
      <MessageCircle size={19} aria-hidden="true" />
      <span>Ask on WhatsApp</span>
    </a>
  );
}
