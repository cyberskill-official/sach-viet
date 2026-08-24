"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductMedia } from "@/lib/product-cover";
import { BOOK_COVER_PLACEHOLDERS, coverAltText, pickCoverUrl } from "@/lib/product-cover";

type ProductCoverProps = {
  slug: string;
  title: string;
  media?: ProductMedia[];
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
};

function placeholderForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i) * (i + 3)) % BOOK_COVER_PLACEHOLDERS.length;
  }
  return BOOK_COVER_PLACEHOLDERS[hash];
}

export function ProductCover({
  slug,
  title,
  media,
  className = "",
  imageClassName = "object-cover",
  priority = false,
  sizes = "(max-width: 768px) 50vw, 280px",
}: ProductCoverProps) {
  const preferred = pickCoverUrl(media, slug);
  const fallback = placeholderForSlug(slug);
  // Track which preferred URL failed so a new preferred resets without an effect.
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const failed = failedFor === preferred;
  const alt = coverAltText(media, title);
  const src = failed ? fallback : preferred;

  return (
    <div className={`relative overflow-hidden bg-[color-mix(in_oklab,var(--sv-lux-stone-900)_12%,var(--panel))] ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className={imageClassName}
        sizes={sizes}
        priority={priority}
        onError={() => {
          if (!failed && preferred !== fallback) setFailedFor(preferred);
        }}
      />
    </div>
  );
}
