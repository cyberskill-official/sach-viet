export type ProductMedia = {
  url: string;
  altText?: string | null;
  sortOrder?: number;
};

/** Book-themed placeholders when catalog media is missing or unusable. */
export const BOOK_COVER_PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544716278-e513176f20b5?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524995993474-eeb1c808c547?w=600&h=800&fit=crop&q=80",
] as const;

const INVALID_MEDIA_HOSTS = new Set(["cdn.example.test", "example.test", "localhost"]);

function isUsableMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (INVALID_MEDIA_HOSTS.has(parsed.hostname)) return false;
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function slugHash(slug: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i) * (i + 3)) % modulo;
  }
  return hash;
}

export function pickCoverUrl(media: ProductMedia[] | undefined, slug: string): string {
  if (media?.length) {
    const sorted = [...media].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
    for (const item of sorted) {
      if (isUsableMediaUrl(item.url)) return item.url;
    }
  }
  return BOOK_COVER_PLACEHOLDERS[slugHash(slug, BOOK_COVER_PLACEHOLDERS.length)];
}

export function coverAltText(media: ProductMedia[] | undefined, title: string): string {
  if (media?.length) {
    const sorted = [...media].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
    for (const item of sorted) {
      if (item.altText?.trim()) return item.altText.trim();
    }
  }
  return title;
}
