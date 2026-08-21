import { Storefront } from "@/components/storefront";
import { createCatalogStore, listCategories } from "@/lib/catalog-core.mjs";
import { searchPublicProducts } from "@/lib/vietnamese-search-core.mjs";

const PAGE_SIZE = 24;

export default async function Home() {
  let initialProducts: unknown[] = [];
  let initialCategories: { slug: string; name: string }[] = [];
  let initialHasMore = false;

  try {
    const store = await createCatalogStore();
    try {
      const [page, categories] = await Promise.all([
        searchPublicProducts(store, { limit: PAGE_SIZE }),
        listCategories(store),
      ]);
      initialProducts = page.items ?? [];
      initialHasMore = Boolean(page.nextCursor) || initialProducts.length === PAGE_SIZE;
      initialCategories = categories.map((category: { slug: string; name: string }) => ({
        slug: category.slug,
        name: category.name,
      }));
    } finally {
      await store.close();
    }
  } catch {
    // Client storefront refetches if SSR catalog is unavailable.
  }

  return (
    <Storefront
      initialProducts={initialProducts as never}
      initialCategories={initialCategories}
      initialHasMore={initialHasMore}
    />
  );
}
