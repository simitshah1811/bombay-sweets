import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { can } from "@/lib/auth/permissions";
import { getOperationalContext } from "@/lib/pickup/schedule";
import { getQueueOrders, getOrderHistory } from "@/lib/admin/orders";
import { OrderCard } from "@/components/admin/OrderCard";
import { QueueAutoRefresh } from "@/components/admin/QueueAutoRefresh";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/lib/generated/prisma/client";

const QUEUE_SECTIONS: { status: OrderStatus; label: string }[] = [
  { status: "PAID", label: "New Orders" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY", label: "Ready" },
];

const HISTORY_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "REFUNDED",
];

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  const session = await requirePermission("orders:view");
  const canManage = can(session.role, "orders:manage");
  const params = await props.searchParams;

  const view = params.view === "history" ? "history" : "queue";
  const context = await getOperationalContext();
  const timezone = context?.timezone ?? "America/Los_Angeles";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink">Orders</h1>
        <div className="flex gap-1 rounded-pill border border-ink/15 bg-cream p-1">
          <Link
            href="/admin/orders"
            className={cn(
              "rounded-pill px-4 py-2 font-label text-xs font-medium uppercase tracking-[0.1em]",
              view === "queue" ? "bg-ink text-cream" : "text-ink/60"
            )}
          >
            Queue
          </Link>
          <Link
            href="/admin/orders?view=history"
            className={cn(
              "rounded-pill px-4 py-2 font-label text-xs font-medium uppercase tracking-[0.1em]",
              view === "history" ? "bg-ink text-cream" : "text-ink/60"
            )}
          >
            History
          </Link>
        </div>
      </div>

      {view === "queue" ? (
        <QueueView timezone={timezone} canManage={canManage} statusFilter={firstParam(params.status)} />
      ) : (
        <HistoryView
          timezone={timezone}
          canManage={canManage}
          filters={{
            orderNumber: firstParam(params.orderNumber),
            status: parseOrderStatus(firstParam(params.status)),
            customerQuery: firstParam(params.q),
            date: firstParam(params.date),
            page: Number(firstParam(params.page) ?? "1"),
          }}
        />
      )}
    </div>
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

// Query-string values are attacker-controlled input, not trusted enum
// values -- never pass them straight into a Prisma `where.status` without
// checking they're one of the real OrderStatus values first.
function parseOrderStatus(value: string | undefined): OrderStatus | undefined {
  return value && (HISTORY_STATUSES as string[]).includes(value) ? (value as OrderStatus) : undefined;
}

async function QueueView({
  timezone,
  canManage,
  statusFilter,
}: {
  timezone: string;
  canManage: boolean;
  statusFilter?: string;
}) {
  const grouped = await getQueueOrders();
  const sections = statusFilter
    ? QUEUE_SECTIONS.filter((s) => s.status === statusFilter)
    : QUEUE_SECTIONS;

  const totalCount = Object.values(grouped).reduce((sum, orders) => sum + orders.length, 0);

  return (
    <div className="space-y-8">
      <QueueAutoRefresh />
      {statusFilter && (
        <Link href="/admin/orders" className="text-sm text-ink/60 underline">
          &larr; Show all statuses
        </Link>
      )}
      {totalCount === 0 && (
        <p className="rounded-image border border-ink/15 bg-cream p-8 text-center text-sm text-ink/60">
          No active orders right now.
        </p>
      )}
      {sections.map((section) => {
        const orders = grouped[section.status] ?? [];
        if (orders.length === 0 && statusFilter !== section.status) return null;
        return (
          <div key={section.status}>
            <h2 className="font-label text-xs font-medium uppercase tracking-[0.15em] text-ink/50">
              {section.label} ({orders.length})
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} timezone={timezone} canManage={canManage} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function HistoryView({
  timezone,
  canManage,
  filters,
}: {
  timezone: string;
  canManage: boolean;
  filters: { orderNumber?: string; status?: OrderStatus; customerQuery?: string; date?: string; page: number };
}) {
  const { orders, total, page, pageCount } = await getOrderHistory(filters);

  return (
    <div className="space-y-6">
      <form method="GET" className="flex flex-wrap items-end gap-3 rounded-image border border-ink/15 bg-cream p-4">
        <input type="hidden" name="view" value="history" />
        <Field label="Order #">
          <input
            name="orderNumber"
            defaultValue={filters.orderNumber ?? ""}
            className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
          />
        </Field>
        <Field label="Customer (name / phone / email)">
          <input
            name="q"
            defaultValue={filters.customerQuery ?? ""}
            className="w-56 rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
          />
        </Field>
        <Field label="Status">
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
          >
            <option value="">All</option>
            {HISTORY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input
            type="date"
            name="date"
            defaultValue={filters.date ?? ""}
            className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
          />
        </Field>
        <button type="submit" className="rounded-pill bg-saffron px-5 py-2.5 text-sm font-medium text-cream hover:bg-ink">
          Search
        </button>
        <Link href="/admin/orders?view=history" className="text-sm text-ink/50 underline">
          Clear
        </Link>
      </form>

      <p className="text-sm text-ink/50">{total} order{total === 1 ? "" : "s"} found</p>

      {orders.length === 0 ? (
        <p className="rounded-image border border-ink/15 bg-cream p-8 text-center text-sm text-ink/60">
          No orders match those filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} timezone={timezone} canManage={canManage} showEmail />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={{
                pathname: "/admin/orders",
                query: { view: "history", ...cleanFilters(filters), page: p },
              }}
              className={cn(
                "rounded-control px-3 py-1.5 text-sm",
                p === page ? "bg-ink text-cream" : "border border-ink/20 text-ink/70 hover:bg-ink/5"
              )}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function cleanFilters(filters: { orderNumber?: string; status?: OrderStatus; customerQuery?: string; date?: string }) {
  const out: Record<string, string> = {};
  if (filters.orderNumber) out.orderNumber = filters.orderNumber;
  if (filters.status) out.status = filters.status;
  if (filters.customerQuery) out.q = filters.customerQuery;
  if (filters.date) out.date = filters.date;
  return out;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">{label}</span>
      {children}
    </label>
  );
}
