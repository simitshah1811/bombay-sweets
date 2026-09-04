import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { getOperationalContext, getRestaurantDayRange } from "@/lib/pickup/schedule";

export default async function AdminDashboardPage() {
  await requirePermission("orders:view");

  const context = await getOperationalContext();
  const now = new Date();
  const { start, end } = context
    ? getRestaurantDayRange(context.timezone, now)
    : { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now };

  // PENDING_PAYMENT is deliberately excluded from every count here -- an
  // unpaid order is not yet a real order for staff purposes, and must never
  // be counted or actionable alongside PAID/PREPARING/READY work.
  const [newOrders, preparing, ready, todaysOrders] = await Promise.all([
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PREPARING" } }),
    prisma.order.count({ where: { status: "READY" } }),
    prisma.order.count({ where: { createdAt: { gte: start, lt: end }, status: { not: "PENDING_PAYMENT" } } }),
  ]);

  const cards = [
    { label: "New Orders", value: newOrders, href: "/admin/orders?status=PAID", hint: "Awaiting acceptance" },
    { label: "Preparing", value: preparing, href: "/admin/orders?status=PREPARING", hint: "In the kitchen" },
    { label: "Ready", value: ready, href: "/admin/orders?status=READY", hint: "Awaiting pickup" },
    { label: "Today's Orders", value: todaysOrders, href: "/admin/orders", hint: "Restaurant-local calendar day" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink/60">A quick snapshot of where things stand right now.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-image border border-ink/15 bg-cream p-6 transition-colors hover:border-ink/40"
          >
            <div className="font-label text-xs font-medium uppercase tracking-[0.15em] text-ink/50">{card.label}</div>
            <div className="mt-2 font-display text-4xl font-semibold text-ink">{card.value}</div>
            <div className="mt-1 text-xs text-ink/50">{card.hint}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-image border border-ink/15 bg-cream p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Quick links</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/admin/orders" className="rounded-control border border-ink/20 px-4 py-2 text-sm text-ink/80 hover:bg-ink/5">
            View order queue
          </Link>
          <Link href="/admin/orders?view=history" className="rounded-control border border-ink/20 px-4 py-2 text-sm text-ink/80 hover:bg-ink/5">
            Order history
          </Link>
        </div>
      </div>
    </div>
  );
}
