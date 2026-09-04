import { requirePermission } from "@/lib/auth/guard";
import { getAdminSettings, getAdminPromotions } from "@/lib/admin/settings";
import { getTimezoneDisplayName } from "@/lib/pickup/schedule";
import { isProductionEnvironment } from "@/lib/env";
import { updateBusinessSettings, updateBusinessHours, createSpecialHours, deleteSpecialHours } from "./actions";
import type { DayOfWeek } from "@/lib/generated/prisma/client";

export const metadata = { title: "Settings" };

const DAY_LABEL: Record<DayOfWeek, string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

function DemoBadge() {
  return (
    <span className="rounded-pill bg-saffron/15 px-3 py-1 font-label text-[11px] font-medium uppercase tracking-[0.1em] text-saffron">
      Demo / client approval pending
    </span>
  );
}

export default async function AdminSettingsPage() {
  await requirePermission("settings:manage");
  const [settings, promotions] = await Promise.all([getAdminSettings(), getAdminPromotions()]);
  const productionGateActive = isProductionEnvironment();

  if (!settings) {
    return <p className="text-sm text-ink/60">No restaurant record found.</p>;
  }

  const now = new Date();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink/60">
          Every value on this page is demo configuration used to build and test the ordering system. None of it
          should be treated as Bombay Sweets&rsquo; approved final business rules until explicitly confirmed.
        </p>
      </div>

      <section className="rounded-image border border-ink/15 bg-cream p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Restaurant timezone</h2>
        <p className="mt-1 text-sm text-ink/60">
          The single source of truth for all pickup scheduling. This is read-only here on purpose &mdash; your own
          browser&rsquo;s timezone must never be able to change it. Contact an engineer to update it.
        </p>
        <div className="mt-3 rounded-control bg-peach/30 px-4 py-3 text-sm text-ink">
          <span className="font-medium">{settings.timezone}</span> &mdash; currently {getTimezoneDisplayName(settings.timezone, now)}
        </div>
      </section>

      <section className="rounded-image border border-ink/15 bg-cream p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">Ordering &amp; pickup configuration</h2>
          <DemoBadge />
        </div>
        <form action={updateBusinessSettings} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" name="orderingEnabled" defaultChecked={settings.orderingEnabled} />
            Online ordering enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" name="pickupEnabled" defaultChecked={settings.pickupEnabled} />
            Pickup enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" name="asapPickupEnabled" defaultChecked={settings.asapPickupEnabled} />
            ASAP pickup enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" name="scheduledPickupEnabled" defaultChecked={settings.scheduledPickupEnabled} />
            Scheduled pickup enabled
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Minimum prep time (minutes)</span>
            <input
              name="minPrepTimeMinutes"
              type="number"
              min="0"
              defaultValue={settings.minPrepTimeMinutes}
              className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Pickup slot interval (minutes)</span>
            <input
              name="pickupIntervalMinutes"
              type="number"
              min="5"
              defaultValue={settings.pickupIntervalMinutes}
              className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Max advance scheduling (hours)</span>
            <input
              name="maxAdvanceSchedulingHours"
              type="number"
              min="1"
              defaultValue={settings.maxAdvanceSchedulingHours}
              className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Tax rate (%)</span>
            <input
              name="taxRatePercent"
              type="number"
              step="0.01"
              min="0"
              defaultValue={settings.taxRatePercent}
              className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
            />
          </label>
          <p className="sm:col-span-2 text-xs text-ink/50">
            Changing the tax rate only affects orders placed after saving &mdash; every past order keeps the tax
            amount it was actually charged.
          </p>
          <button type="submit" className="sm:col-span-2 w-fit rounded-pill bg-saffron px-6 py-2.5 text-sm font-medium text-cream hover:bg-ink">
            Save configuration
          </button>
        </form>
      </section>

      <section className="rounded-image border border-ink/15 bg-cream p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">Regular business hours</h2>
          <DemoBadge />
        </div>
        <form action={updateBusinessHours} className="mt-4 space-y-2">
          {settings.businessHours.map((h) => (
            <div key={h.dayOfWeek} className="flex flex-wrap items-center gap-3 rounded-control border border-ink/10 px-3 py-2">
              <span className="w-24 text-sm text-ink/80">{DAY_LABEL[h.dayOfWeek]}</span>
              <label className="flex items-center gap-1.5 text-xs text-ink/60">
                <input type="checkbox" name={`${h.dayOfWeek}_isClosed`} defaultChecked={h.isClosed} />
                Closed
              </label>
              <input
                type="time"
                name={`${h.dayOfWeek}_openTime`}
                defaultValue={h.openTime}
                className="rounded-control border border-ink/20 bg-cream px-2 py-1.5 text-sm text-ink outline-none focus:border-ink/60"
              />
              <span className="text-ink/40">to</span>
              <input
                type="time"
                name={`${h.dayOfWeek}_closeTime`}
                defaultValue={h.closeTime}
                className="rounded-control border border-ink/20 bg-cream px-2 py-1.5 text-sm text-ink outline-none focus:border-ink/60"
              />
            </div>
          ))}
          <button type="submit" className="w-fit rounded-pill bg-saffron px-6 py-2.5 text-sm font-medium text-cream hover:bg-ink">
            Save hours
          </button>
        </form>
      </section>

      <section className="rounded-image border border-ink/15 bg-cream p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">Special / holiday hours</h2>
          <DemoBadge />
        </div>
        <div className="mt-4 space-y-2">
          {settings.specialHours.length === 0 && <p className="text-sm text-ink/40">No overrides scheduled.</p>}
          {settings.specialHours.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-ink/10 px-3 py-2 text-sm">
              <div>
                <span className="text-ink">{s.date}</span>{" "}
                <span className="text-ink/60">
                  {s.isClosed ? "Closed" : `${s.openTime ?? "?"}–${s.closeTime ?? "?"}`}
                  {s.note ? ` · ${s.note}` : ""}
                </span>
              </div>
              <form action={deleteSpecialHours.bind(null, s.id)}>
                <button type="submit" className="rounded-control border border-maroon/30 px-3 py-1 text-xs text-maroon hover:bg-maroon hover:text-cream">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer font-label text-xs font-medium uppercase tracking-[0.1em] text-ink/50">
            Add a date override
          </summary>
          <form action={createSpecialHours} className="mt-3 flex flex-wrap items-end gap-3 rounded-control border border-ink/15 bg-peach/20 p-4">
            <label className="flex flex-col gap-1">
              <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Date</span>
              <input
                type="date"
                name="date"
                required
                className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-ink/60">
              <input type="checkbox" name="isClosed" />
              Closed all day
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Open</span>
              <input
                type="time"
                name="openTime"
                className="rounded-control border border-ink/20 bg-cream px-2 py-1.5 text-sm text-ink outline-none focus:border-ink/60"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Close</span>
              <input
                type="time"
                name="closeTime"
                className="rounded-control border border-ink/20 bg-cream px-2 py-1.5 text-sm text-ink outline-none focus:border-ink/60"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Note</span>
              <input
                name="note"
                placeholder="e.g. Statutory holiday"
                className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
              />
            </label>
            <button type="submit" className="rounded-control bg-ink px-4 py-2 text-xs text-cream">
              Add
            </button>
          </form>
        </details>
      </section>

      <section className="rounded-image border border-ink/15 bg-cream p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Promotions</h2>
        <div
          className={`mt-3 rounded-control px-4 py-3 text-sm ${
            productionGateActive ? "bg-green/10 text-green" : "bg-saffron/10 text-ink"
          }`}
        >
          {productionGateActive
            ? "Production redemption gate: ACTIVE — no promotion code can be redeemed on the live site until Bombay Sweets explicitly approves real promotion rules."
            : "This is a non-production environment (local or preview). The production redemption gate only applies to the live Production deployment."}
        </div>
        <p className="mt-3 text-xs text-ink/50">
          Promotion codes are managed at the database level in this demo phase, not through this dashboard.
        </p>
        <div className="mt-3 space-y-2">
          {promotions.length === 0 && <p className="text-sm text-ink/40">No promotions configured.</p>}
          {promotions.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-ink/10 px-3 py-2 text-sm">
              <div>
                <span className="font-medium text-ink">{p.code}</span>{" "}
                <span className="text-ink/60">
                  {p.discountType === "PERCENTAGE" ? `${p.discountValue}% off` : `$${p.discountValue} off`}
                  {p.description ? ` · ${p.description}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {p.isDemoPromotion && <span className="rounded-pill bg-saffron/15 px-2 py-0.5 text-saffron">Demo</span>}
                <span className={p.isActive ? "text-green" : "text-ink/40"}>{p.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
