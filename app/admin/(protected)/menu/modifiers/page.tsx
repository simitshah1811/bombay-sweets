import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { getAdminModifierGroups } from "@/lib/admin/menu";
import { formatPrice } from "@/lib/utils/formatPrice";
import {
  createModifierGroup,
  updateModifierGroup,
  createModifierOption,
  updateModifierOption,
  toggleModifierOptionAvailability,
} from "./actions";

export const metadata = { title: "Modifiers" };

export default async function AdminModifiersPage() {
  await requirePermission("menu:manage");
  const groups = await getAdminModifierGroups();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Modifiers</h1>
          <p className="mt-1 text-sm text-ink/60">
            Reusable option groups (e.g. &ldquo;Naan Type&rdquo;) that can be attached to any menu item.
          </p>
        </div>
        <Link href="/admin/menu" className="rounded-pill border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:bg-ink/5">
          &larr; Back to menu
        </Link>
      </div>

      <details className="rounded-image border border-ink/15 bg-cream p-4">
        <summary className="cursor-pointer font-label text-xs font-medium uppercase tracking-[0.1em] text-ink/50">
          Add modifier group
        </summary>
        <GroupForm action={createModifierGroup} />
      </details>

      <div className="space-y-6">
        {groups.length === 0 && <p className="text-sm text-ink/50">No modifier groups yet.</p>}
        {groups.map((group) => (
          <div key={group.id} className="rounded-image border border-ink/15 bg-cream p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">{group.name}</h2>
                <p className="mt-0.5 text-xs text-ink/50">
                  {group.isRequired ? "Required" : "Optional"} &middot; Select {group.minSelect}&ndash;{group.maxSelect}
                </p>
              </div>
              <details>
                <summary className="cursor-pointer list-none rounded-control border border-ink/20 px-3 py-1.5 text-xs text-ink/70 hover:bg-ink/5">
                  Edit
                </summary>
                <GroupForm action={updateModifierGroup.bind(null, group.id)} group={group} />
              </details>
            </div>

            <div className="mt-4 space-y-2">
              {group.options.map((option) => (
                <div key={option.id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-ink/10 px-3 py-2">
                  <div className="text-sm text-ink/80">
                    {option.name}{" "}
                    <span className="text-ink/50">
                      {option.priceAdjustment === 0
                        ? "no charge"
                        : option.priceAdjustment > 0
                          ? `+${formatPrice(option.priceAdjustment)}`
                          : `-${formatPrice(Math.abs(option.priceAdjustment))}`}
                    </span>
                    {!option.isAvailable && <span className="ml-2 text-xs text-maroon">(Unavailable)</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <details>
                      <summary className="cursor-pointer list-none rounded-control border border-ink/20 px-3 py-1 text-xs text-ink/70 hover:bg-ink/5">
                        Edit
                      </summary>
                      <OptionForm action={updateModifierOption.bind(null, option.id)} option={option} />
                    </details>
                    <form action={toggleModifierOptionAvailability.bind(null, option.id, !option.isAvailable)}>
                      <button type="submit" className="rounded-control border border-ink/20 px-3 py-1 text-xs text-ink/70 hover:bg-ink/5">
                        {option.isAvailable ? "Mark unavailable" : "Mark available"}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">
                Add option
              </summary>
              <OptionForm action={createModifierOption.bind(null, group.id)} />
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupForm({
  action,
  group,
}: {
  action: (formData: FormData) => Promise<void>;
  group?: { name: string; isRequired: boolean; minSelect: number; maxSelect: number };
}) {
  return (
    <form action={action} className="mt-3 grid grid-cols-1 gap-3 rounded-control border border-ink/15 bg-peach/20 p-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Name</span>
        <input
          name="name"
          required
          defaultValue={group?.name}
          className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Min select</span>
        <input
          name="minSelect"
          type="number"
          min="0"
          defaultValue={group?.minSelect ?? 0}
          className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Max select</span>
        <input
          name="maxSelect"
          type="number"
          min="1"
          defaultValue={group?.maxSelect ?? 1}
          className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" name="isRequired" defaultChecked={group?.isRequired} />
        Required (customer must choose at least one)
      </label>
      <button type="submit" className="sm:col-span-2 w-fit rounded-pill bg-ink px-5 py-2.5 text-sm font-medium text-cream hover:bg-saffron">
        {group ? "Save changes" : "Add group"}
      </button>
    </form>
  );
}

function OptionForm({
  action,
  option,
}: {
  action: (formData: FormData) => Promise<void>;
  option?: { name: string; priceAdjustment: number };
}) {
  return (
    <form action={action} className="mt-2 flex flex-wrap items-end gap-3 rounded-control border border-ink/15 bg-peach/20 p-3">
      <label className="flex flex-col gap-1">
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Option name</span>
        <input
          name="name"
          required
          defaultValue={option?.name}
          className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Price adjustment</span>
        <input
          name="priceAdjustment"
          type="number"
          step="0.01"
          defaultValue={option?.priceAdjustment ?? 0}
          className="w-28 rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
        />
      </label>
      <button type="submit" className="rounded-control bg-ink px-4 py-2 text-xs text-cream">
        {option ? "Save" : "Add"}
      </button>
    </form>
  );
}
