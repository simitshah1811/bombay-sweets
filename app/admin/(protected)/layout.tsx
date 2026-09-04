import { fraunces, lora, inter } from "@/lib/fonts";
import { requireAdminSession } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { getRestaurantName } from "@/lib/business/queries";
import { AdminNav } from "@/components/admin/AdminNav";

// The admin shell is deliberately its own thing, not a themed variant of the
// marketing layout in app/(site)/layout.tsx -- staff need a fast, quiet
// utility surface, not the customer site's header/footer/cart/preloader.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  const restaurantName = await getRestaurantName();

  // Nav visibility is computed here (server-side, from the one permissions
  // source of truth) and passed down as plain booleans -- AdminNav itself
  // never re-implements role logic, and hiding a link here is a UI nicety
  // only: every page and API these links point to independently re-checks
  // the same permission before doing anything.
  return (
    <div className={`${fraunces.variable} ${lora.variable} ${inter.variable} min-h-screen bg-peach/40 font-body antialiased`}>
      <AdminNav
        role={session.role}
        name={`${session.firstName} ${session.lastName}`}
        restaurantName={restaurantName}
        canManageMenu={can(session.role, "menu:manage")}
        canManageSettings={can(session.role, "settings:manage")}
      />
      <div className="border-b border-ink/15 bg-saffron/15 px-6 py-2 text-center font-label text-[11px] font-medium uppercase tracking-[0.2em] text-ink/70">
        Demo mode — orders, pricing, and settings shown here are not client-approved final business rules
      </div>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
