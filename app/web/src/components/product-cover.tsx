"use client";

import Image from "next/image";
import type { ProductMedia } from "@/lib/product-cover";
import { coverAltText, pickCoverUrl } from "@/lib/product-cover";

type ProductCoverProps = {
  slug: string;
  title: string;
  media?: ProductMedia[];
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
};

export function ProductCover({
  slug,
  title,
  media,
  className = "",
  imageClassName = "object-cover",
  priority = false,
  sizes = "(max-width: 768px) 50vw, 280px",
}: ProductCoverProps) {
  const src = pickCoverUrl(media, slug);
  const alt = coverAltText(media, title);

  return (
    <div className={`relative overflow-hidden bg-[color-mix(in_oklab,var(--sv-lux-stone-900)_12%,var(--panel))] ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className={imageClassName}
        sizes={sizes}
        priority={priority}
      />
    </div>
  );
}
