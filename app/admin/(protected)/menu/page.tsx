import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { getAdminMenu, getAdminModifierGroups } from "@/lib/admin/menu";
import { formatPrice } from "@/lib/utils/formatPrice";
import { formatPrepLabel, PREP_STATUS_ADMIN_LABEL } from "@/lib/menu/prepStatus";
import type { PreparationStatus } from "@/lib/generated/prisma/client";
import {
  createCategory,
  updateCategory,
  toggleCategoryActive,
  moveCategory,
  createItem,
  updateItem,
  toggleItemAvailability,
  toggleItemArchived,
  moveItem,
  setItemModifierGroups,
  updatePreparation,
  bulkUpdatePreparationStatus,
} from "./actions";

export const metadata = { title: "Menu" };

const SPICE_LABELS = ["None", "Mild", "Medium", "Hot"];
const PREP_STATUS_OPTIONS: PreparationStatus[] = ["GREEN", "YELLOW", "RED"];
const PREP_TEXT_TONE: Record<PreparationStatus, string> = {
  GREEN: "text-green",
  YELLOW: "text-saffron",
  RED: "text-maroon",
};

export default async function AdminMenuPage() {
  await requirePermission("menu:manage");
  const [categories, modifierGroups] = await Promise.all([getAdminMenu(), getAdminModifierGroups()]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Menu</h1>
          <p className="mt-1 text-sm text-ink/60">
            Changes here go live on the website immediately. Price changes never affect past orders.
          </p>
        </div>
        <Link href="/admin/menu/modifiers" className="rounded-pill border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:bg-ink/5">
          Manage modifiers &rarr;
        </Link>
      </div>

      <form action={createCategory} className="flex flex-wrap items-end gap-3 rounded-image border border-ink/15 bg-cream p-4">
        <label className="flex flex-col gap-1">
          <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">New category name</span>
          <input
            name="name"
            required
            className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
          />
        </label>
        <button type="submit" className="rounded-pill bg-saffron px-5 py-2.5 text-sm font-medium text-cream hover:bg-ink">
          Add category
        </button>
      </form>

      <div className="space-y-6">
        {categories.map((category, index) => (
          <div key={category.id} className="rounded-image border border-ink/15 bg-cream p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-semibold text-ink">{category.name}</h2>
                {!category.isActive && (
                  <span className="rounded-pill bg-maroon/10 px-3 py-1 font-label text-[11px] font-medium uppercase tracking-[0.1em] text-maroon">
                    Archived
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <form action={moveCategory.bind(null, category.id, "up")}>
                  <button type="submit" disabled={index === 0} className="rounded-control border border-ink/20 px-2 py-1 text-xs text-ink/70 disabled:opacity-30">
                    &uarr;
                  </button>
                </form>
                <form action={moveCategory.bind(null, category.id, "down")}>
                  <button
                    type="submit"
                    disabled={index === categories.length - 1}
                    className="rounded-control border border-ink/20 px-2 py-1 text-xs text-ink/70 disabled:opacity-30"
                  >
                    &darr;
                  </button>
                </form>
                <details className="relative">
                  <summary className="cursor-pointer list-none rounded-control border border-ink/20 px-3 py-1.5 text-xs text-ink/70 hover:bg-ink/5">
                    Rename
                  </summary>
                  <form
                    action={updateCategory.bind(null, category.id)}
                    className="absolute right-0 z-10 mt-2 flex w-64 gap-2 rounded-control border border-ink/15 bg-cream p-3 shadow-lg"
                  >
                    <input
                      name="name"
                      defaultValue={category.name}
                      required
                      className="w-full rounded-control border border-ink/20 bg-cream px-2 py-1.5 text-sm text-ink outline-none focus:border-ink/60"
                    />
                    <button type="submit" className="shrink-0 rounded-control bg-ink px-3 py-1.5 text-xs text-cream">
                      Save
                    </button>
                  </form>
                </details>
                <form action={toggleCategoryActive.bind(null, category.id, !category.isActive)}>
                  <button type="submit" className="rounded-control border border-ink/20 px-3 py-1.5 text-xs text-ink/70 hover:bg-ink/5">
                    {category.isActive ? "Archive" : "Unarchive"}
                  </button>
                </form>
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-label text-xs font-medium uppercase tracking-[0.1em] text-ink/50">
                Add item to {category.name}
              </summary>
              <ItemForm action={createItem} categoryId={category.id} />
            </details>

            {category.items.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer font-label text-xs font-medium uppercase tracking-[0.1em] text-ink/50">
                  Bulk-update prep time in {category.name}
                </summary>
                <div className="mt-2 rounded-control border border-ink/15 bg-peach/20 p-3">
                  <p className="mb-2 text-xs text-ink/50">
                    Check the items below, then pick a status to apply to all of them at once &mdash; handy during a
                    rush.
                  </p>
                  <form id={`bulk-prep-${category.id}`} action={bulkUpdatePreparationStatus.bind(null, category.id)} className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      name="preparationStatus"
                      value="GREEN"
                      className="rounded-pill border border-ink/20 px-3 py-1.5 text-xs text-green hover:bg-ink/5"
                    >
                      Set selected &middot; Green
                    </button>
                    <button
                      type="submit"
                      name="preparationStatus"
                      value="YELLOW"
                      className="rounded-pill border border-ink/20 px-3 py-1.5 text-xs text-saffron hover:bg-ink/5"
                    >
                      Set selected &middot; Yellow
                    </button>
                    <button
                      type="submit"
                      name="preparationStatus"
                      value="RED"
                      className="rounded-pill border border-ink/20 px-3 py-1.5 text-xs text-maroon hover:bg-ink/5"
                    >
                      Set selected &middot; Red
                    </button>
                  </form>
                </div>
              </details>
            )}

            <div className="mt-4 space-y-3">
              {category.items.length === 0 && <p className="text-sm text-ink/40">No items yet.</p>}
              {category.items.map((item, itemIndex) => (
                <div key={item.id} className="rounded-control border border-ink/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="itemIds"
                          value={item.id}
                          form={`bulk-prep-${category.id}`}
                          aria-label={`Select ${item.name} for bulk prep-status update`}
                          className="h-3.5 w-3.5"
                        />
                        <span className="font-body text-ink">{item.name}</span>
                        <span className="text-sm text-ink/60">{formatPrice(item.price)}</span>
                        {item.isVegetarian && <span className="text-xs text-green">Veg</span>}
                        {!!item.spiceLevel && <span className="text-xs text-maroon">{SPICE_LABELS[item.spiceLevel]}</span>}
                        {!item.isAvailable && <span className="text-xs text-ink/40">(Unavailable)</span>}
                        {item.isArchived && <span className="text-xs text-maroon">(Archived)</span>}
                      </div>
                      {item.description && <p className="mt-0.5 text-xs text-ink/50">{item.description}</p>}
                      <p className={`mt-1 text-xs ${PREP_TEXT_TONE[item.preparationStatus]}`}>
                        &#9679; {formatPrepLabel(item.preparationStatus, item.preparationMinutes)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <details>
                        <summary className="cursor-pointer list-none rounded-control border border-ink/20 px-3 py-1.5 text-xs text-ink/70 hover:bg-ink/5">
                          Change prep time
                        </summary>
                        <form
                          action={updatePreparation.bind(null, item.id)}
                          className="mt-2 flex flex-col gap-2 rounded-control border border-ink/15 bg-peach/20 p-3"
                        >
                          <div className="flex flex-col gap-1.5">
                            {PREP_STATUS_OPTIONS.map((status) => (
                              <label key={status} className="flex items-center gap-2 text-sm text-ink/80">
                                <input
                                  type="radio"
                                  name="preparationStatus"
                                  value={status}
                                  defaultChecked={item.preparationStatus === status}
                                />
                                {PREP_STATUS_ADMIN_LABEL[status]}
                              </label>
                            ))}
                          </div>
                          <label className="flex flex-col gap-1">
                            <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">
                              Estimated minutes (optional)
                            </span>
                            <input
                              name="preparationMinutes"
                              type="number"
                              min="1"
                              max="600"
                              step="1"
                              defaultValue={item.preparationMinutes ?? ""}
                              placeholder="e.g. 20"
                              className="w-32 rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
                            />
                          </label>
                          <button type="submit" className="mt-1 w-fit rounded-control bg-ink px-3 py-1.5 text-xs text-cream">
                            Save
                          </button>
                        </form>
                      </details>
                      <form action={moveItem.bind(null, item.id, "up")}>
                        <button type="submit" disabled={itemIndex === 0} className="rounded-control border border-ink/20 px-2 py-1 text-xs text-ink/70 disabled:opacity-30">
                          &uarr;
                        </button>
                      </form>
                      <form action={moveItem.bind(null, item.id, "down")}>
                        <button
                          type="submit"
                          disabled={itemIndex === category.items.length - 1}
                          className="rounded-control border border-ink/20 px-2 py-1 text-xs text-ink/70 disabled:opacity-30"
                        >
                          &darr;
                        </button>
                      </form>
                      <form action={toggleItemAvailability.bind(null, item.id, !item.isAvailable)}>
                        <button type="submit" className="rounded-control border border-ink/20 px-3 py-1.5 text-xs text-ink/70 hover:bg-ink/5">
                          {item.isAvailable ? "Mark unavailable" : "Mark available"}
                        </button>
                      </form>
                      <form action={toggleItemArchived.bind(null, item.id, !item.isArchived)}>
                        <button type="submit" className="rounded-control border border-ink/20 px-3 py-1.5 text-xs text-ink/70 hover:bg-ink/5">
                          {item.isArchived ? "Unarchive" : "Archive"}
                        </button>
                      </form>
                      <details>
                        <summary className="cursor-pointer list-none rounded-control border border-ink/20 px-3 py-1.5 text-xs text-ink/70 hover:bg-ink/5">
                          Edit
                        </summary>
                        <ItemForm action={updateItem.bind(null, item.id)} categoryId={category.id} item={item} categories={categories} />
                      </details>
                      {modifierGroups.length > 0 && (
                        <details>
                          <summary className="cursor-pointer list-none rounded-control border border-ink/20 px-3 py-1.5 text-xs text-ink/70 hover:bg-ink/5">
                            Modifiers ({item.modifierGroupIds.length})
                          </summary>
                          <form action={setItemModifierGroups.bind(null, item.id)} className="mt-2 flex flex-col gap-2 rounded-control border border-ink/15 bg-peach/20 p-3">
                            {modifierGroups.map((group) => (
                              <label key={group.id} className="flex items-center gap-2 text-sm text-ink/80">
                                <input
                                  type="checkbox"
                                  name="modifierGroupIds"
                                  value={group.id}
                                  defaultChecked={item.modifierGroupIds.includes(group.id)}
                                />
                                {group.name}
                              </label>
                            ))}
                            <button type="submit" className="mt-1 w-fit rounded-control bg-ink px-3 py-1.5 text-xs text-cream">
                              Save modifiers
                            </button>
                          </form>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemForm({
  action,
  categoryId,
  item,
  categories,
}: {
  action: (formData: FormData) => Promise<void>;
  categoryId: string;
  item?: {
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isVegetarian: boolean;
    spiceLevel: number | null;
  };
  categories?: { id: string; name: string }[];
}) {
  return (
    <form action={action} className="mt-2 grid grid-cols-1 gap-3 rounded-control border border-ink/15 bg-peach/20 p-4 sm:grid-cols-2">
      {categories ? (
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Category</span>
          <select
            name="categoryId"
            defaultValue={categoryId}
            className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="categoryId" value={categoryId} />
      )}
      <label className="flex flex-col gap-1">
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Name</span>
        <input
          name="name"
          required
          defaultValue={item?.name}
          className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Price (CAD)</span>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={item?.price}
          className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
        />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={item?.description ?? ""}
          className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
        />
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Image URL</span>
        <input
          name="imageUrl"
          defaultValue={item?.imageUrl ?? ""}
          className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-label text-[11px] font-medium uppercase tracking-[0.1em] text-ink/50">Spice level</span>
        <select
          name="spiceLevel"
          defaultValue={item?.spiceLevel != null ? String(item.spiceLevel) : ""}
          className="rounded-control border border-ink/20 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-ink/60"
        >
          <option value="">Not applicable</option>
          <option value="0">None</option>
          <option value="1">Mild</option>
          <option value="2">Medium</option>
          <option value="3">Hot</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" name="isVegetarian" defaultChecked={item?.isVegetarian} />
        Vegetarian
      </label>
      <button type="submit" className="sm:col-span-2 w-fit rounded-pill bg-ink px-5 py-2.5 text-sm font-medium text-cream hover:bg-saffron">
        {item ? "Save changes" : "Add item"}
      </button>
    </form>
  );
}
