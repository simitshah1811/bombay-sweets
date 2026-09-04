import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MenuCategoryNav } from "@/components/menu/MenuCategoryNav";
import { MenuCategorySection } from "@/components/menu/MenuCategorySection";
import { getMenuForDisplay, type MenuCategoryForDisplay } from "@/lib/menu/queries";
import { business } from "@/data/business";

// Re-render at most once a minute so menu edits show up promptly without
// hitting the database on every single request.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Menu",
  description: "The full Bombay Sweets menu: sweets, chaat, tandoori, curries, breads and more.",
};

export default async function MenuPage() {
  let categories: MenuCategoryForDisplay[] = [];
  let loadFailed = false;

  try {
    categories = await getMenuForDisplay();
  } catch (error) {
    console.error("Failed to load menu from database:", error);
    loadFailed = true;
  }

  return (
    <main className="px-6 lg:px-10">
      <div className="py-16 lg:py-24">
        <Eyebrow>Full Menu</Eyebrow>
        <h1 className="mt-4 font-display text-[56px] leading-[0.95] text-ink lg:text-[88px]">
          Everything we make
        </h1>
        <p className="mt-6 max-w-xl font-body text-lg text-ink/70">
          Every dish, priced and ready to order. Call ahead for pickup, or browse and find what
          you&rsquo;re craving.
        </p>
      </div>

      {loadFailed ? (
        <div className="rounded-control border border-ink/10 bg-peach/40 px-6 py-14 text-center">
          <p className="mx-auto max-w-md font-body text-ink/70">
            We&rsquo;re unable to load the menu right now. Please call us at{" "}
            <a href={business.phoneHref} className="text-ink underline">
              {business.phone}
            </a>{" "}
            to order or ask about today&rsquo;s menu.
          </p>
        </div>
      ) : (
        <>
          <MenuCategoryNav categories={categories.map(({ id, name }) => ({ id, name }))} />

          <div className="divide-y divide-ink/10">
            {categories.map((category) => (
              <MenuCategorySection key={category.id} category={category} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
