"use client";

import Image from "next/image";
import { Camera } from "lucide-react";
import { useState } from "react";

type MenuProductImageProps = {
  src?: string | null;
  alt: string;
  sizes: string;
};

export default function MenuProductImage({ src, alt, sizes }: MenuProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    const message = failedSrc === src ? "Food photograph unavailable" : "Dish photo pending confirmation";
    return (
      <span className="menu-photo-fallback" role="img" aria-label={message}>
        <Camera size={28} strokeWidth={1.2} aria-hidden="true" />
        <span>{message}</span>
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      loading="lazy"
      sizes={sizes}
      onError={() => setFailedSrc(src)}
    />
  );
}
