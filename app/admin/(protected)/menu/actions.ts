"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guard";
import { logAdminActivity } from "@/lib/auth/activityLog";
import { slugify } from "@/lib/admin/slug";

async function requireMenuManager() {
  return requirePermission("menu:manage");
}

function revalidateMenu() {
  revalidatePath("/admin/menu");
  // Changing menu/pricing/availability must show up on the live site right
  // away, not wait out the public page's normal ISR window.
  revalidatePath("/menu");
}

async function uniqueId(model: "menuCategory" | "menuItem", base: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  // Both tables use short, human-readable slug ids (not cuids) so a new
  // category/item fits the same id style as the original hand-authored data.
  while (
    model === "menuCategory"
      ? await prisma.menuCategory.findUnique({ where: { id: candidate } })
      : await prisma.menuItem.findUnique({ where: { id: candidate } })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export async function createCategory(formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return;

  const id = await uniqueId("menuCategory", slugify(parsed.data.name));
  const maxOrder = await prisma.menuCategory.aggregate({ _max: { displayOrder: true } });

  await prisma.menuCategory.create({
    data: { id, name: parsed.data.name, displayOrder: (maxOrder._max.displayOrder ?? -1) + 1 },
  });
  await logAdminActivity({ adminUserId: session.userId, action: "CATEGORY_CREATED", targetType: "MenuCategory", targetId: id });
  revalidateMenu();
}

export async function updateCategory(id: string, formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return;

  await prisma.menuCategory.update({ where: { id }, data: { name: parsed.data.name } });
  await logAdminActivity({ adminUserId: session.userId, action: "CATEGORY_UPDATED", targetType: "MenuCategory", targetId: id });
  revalidateMenu();
}

export async function toggleCategoryActive(id: string, nextActive: boolean): Promise<void> {
  const session = await requireMenuManager();
  await prisma.menuCategory.update({ where: { id }, data: { isActive: nextActive } });
  await logAdminActivity({
    adminUserId: session.userId,
    action: nextActive ? "CATEGORY_UNARCHIVED" : "CATEGORY_ARCHIVED",
    targetType: "MenuCategory",
    targetId: id,
  });
  revalidateMenu();
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<void> {
  const session = await requireMenuManager();
  const categories = await prisma.menuCategory.findMany({ orderBy: { displayOrder: "asc" } });
  const index = categories.findIndex((c) => c.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= categories.length) return;

  const a = categories[index];
  const b = categories[swapWith];
  await prisma.$transaction([
    prisma.menuCategory.update({ where: { id: a.id }, data: { displayOrder: b.displayOrder } }),
    prisma.menuCategory.update({ where: { id: b.id }, data: { displayOrder: a.displayOrder } }),
  ]);
  await logAdminActivity({ adminUserId: session.userId, action: "CATEGORY_REORDERED", targetType: "MenuCategory", targetId: id });
  revalidateMenu();
}

const itemSchema = z.object({
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(500).optional(),
  price: z.coerce.number().min(0).max(1000),
  imageUrl: z.string().trim().max(500).optional(),
  isVegetarian: z.boolean(),
  spiceLevel: z.string().optional(), // "", "0", "1", "2", "3"
});

function parseItemForm(formData: FormData) {
  return itemSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    imageUrl: formData.get("imageUrl") || undefined,
    isVegetarian: formData.get("isVegetarian") === "on",
    spiceLevel: formData.get("spiceLevel") || undefined,
  });
}

export async function createItem(formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const parsed = parseItemForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  const id = await uniqueId("menuItem", slugify(d.name));
  const maxOrder = await prisma.menuItem.aggregate({
    where: { categoryId: d.categoryId },
    _max: { displayOrder: true },
  });

  await prisma.menuItem.create({
    data: {
      id,
      categoryId: d.categoryId,
      name: d.name,
      description: d.description || null,
      price: d.price,
      imageUrl: d.imageUrl || null,
      isVegetarian: d.isVegetarian,
      spiceLevel: d.spiceLevel ? Number(d.spiceLevel) : null,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });
  await logAdminActivity({ adminUserId: session.userId, action: "ITEM_CREATED", targetType: "MenuItem", targetId: id });
  revalidateMenu();
}

// Price changes never touch OrderItem/OrderItemModifier -- those snapshot
// name/price at order time and are never rewritten here.
export async function updateItem(id: string, formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const parsed = parseItemForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  await prisma.menuItem.update({
    where: { id },
    data: {
      categoryId: d.categoryId,
      name: d.name,
      description: d.description || null,
      price: d.price,
      imageUrl: d.imageUrl || null,
      isVegetarian: d.isVegetarian,
      spiceLevel: d.spiceLevel ? Number(d.spiceLevel) : null,
    },
  });
  await logAdminActivity({ adminUserId: session.userId, action: "ITEM_UPDATED", targetType: "MenuItem", targetId: id });
  revalidateMenu();
}

export async function toggleItemAvailability(id: string, nextAvailable: boolean): Promise<void> {
  const session = await requireMenuManager();
  await prisma.menuItem.update({ where: { id }, data: { isAvailable: nextAvailable } });
  await logAdminActivity({
    adminUserId: session.userId,
    action: nextAvailable ? "ITEM_MARKED_AVAILABLE" : "ITEM_MARKED_UNAVAILABLE",
    targetType: "MenuItem",
    targetId: id,
  });
  revalidateMenu();
}

// Archiving hides an item from customers entirely without deleting it --
// its id must survive so past OrderItem rows (which snapshot name/price,
// not a live reference) stay exactly as they were.
export async function toggleItemArchived(id: string, nextArchived: boolean): Promise<void> {
  const session = await requireMenuManager();
  await prisma.menuItem.update({ where: { id }, data: { isArchived: nextArchived } });
  await logAdminActivity({
    adminUserId: session.userId,
    action: nextArchived ? "ITEM_ARCHIVED" : "ITEM_UNARCHIVED",
    targetType: "MenuItem",
    targetId: id,
  });
  revalidateMenu();
}

export async function moveItem(id: string, direction: "up" | "down"): Promise<void> {
  const session = await requireMenuManager();
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) return;

  const siblings = await prisma.menuItem.findMany({
    where: { categoryId: item.categoryId },
    orderBy: { displayOrder: "asc" },
  });
  const index = siblings.findIndex((i) => i.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= siblings.length) return;

  const a = siblings[index];
  const b = siblings[swapWith];
  await prisma.$transaction([
    prisma.menuItem.update({ where: { id: a.id }, data: { displayOrder: b.displayOrder } }),
    prisma.menuItem.update({ where: { id: b.id }, data: { displayOrder: a.displayOrder } }),
  ]);
  await logAdminActivity({ adminUserId: session.userId, action: "ITEM_REORDERED", targetType: "MenuItem", targetId: id });
  revalidateMenu();
}

const preparationStatusSchema = z.enum(["GREEN", "YELLOW", "RED"]);

// Distinct from itemSchema's price validation on purpose -- an empty/missing
// value here means "no estimate configured" (null), not a rejected form,
// since preparationMinutes is genuinely optional (section 2 of the brief).
function parsePreparationMinutes(raw: FormDataEntryValue | null): { ok: true; value: number | null } | { ok: false } {
  if (raw == null || String(raw).trim() === "") return { ok: true, value: null };
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 600) return { ok: false };
  return { ok: true, value: n };
}

/**
 * Quick preparation-status change for a single item -- deliberately its own
 * action, separate from updateItem(), so the owner never has to open the
 * full name/price/description/modifiers form just to bump a wait time
 * during a rush (brief section 6).
 */
export async function updatePreparation(itemId: string, formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const statusParsed = preparationStatusSchema.safeParse(formData.get("preparationStatus"));
  if (!statusParsed.success) return;
  const minutesParsed = parsePreparationMinutes(formData.get("preparationMinutes"));
  if (!minutesParsed.ok) return;

  await prisma.menuItem.update({
    where: { id: itemId },
    data: { preparationStatus: statusParsed.data, preparationMinutes: minutesParsed.value },
  });
  await logAdminActivity({
    adminUserId: session.userId,
    action: "ITEM_PREP_UPDATED",
    targetType: "MenuItem",
    targetId: itemId,
    note: `Preparation set to ${statusParsed.data}${minutesParsed.value != null ? ` (~${minutesParsed.value} min)` : " (no estimate)"}`,
  });
  revalidateMenu();
}

/**
 * Sets preparation status (not minutes -- see brief section 7's example,
 * which only ever bulk-sets the color) on every selected item in one
 * category at once, for busy-kitchen moments. Scoped to a single category
 * per call, matching how the admin menu page is already organized.
 */
export async function bulkUpdatePreparationStatus(categoryId: string, formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const statusParsed = preparationStatusSchema.safeParse(formData.get("preparationStatus"));
  if (!statusParsed.success) return;

  const itemIds = formData.getAll("itemIds").map(String).filter(Boolean);
  if (itemIds.length === 0) return;

  const { count } = await prisma.menuItem.updateMany({
    where: { id: { in: itemIds }, categoryId },
    data: { preparationStatus: statusParsed.data },
  });
  if (count === 0) return;

  await logAdminActivity({
    adminUserId: session.userId,
    action: "ITEM_PREP_BULK_UPDATED",
    targetType: "MenuCategory",
    targetId: categoryId,
    note: `Set ${count} item(s) to ${statusParsed.data}`,
  });
  revalidateMenu();
}

export async function setItemModifierGroups(itemId: string, formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const selected = formData.getAll("modifierGroupIds").map(String);

  const existing = await prisma.menuItemModifierGroup.findMany({ where: { menuItemId: itemId } });
  const existingIds = new Set(existing.map((e) => e.modifierGroupId));
  const selectedIds = new Set(selected);

  const toRemove = existing.filter((e) => !selectedIds.has(e.modifierGroupId));
  const toAdd = selected.filter((id) => !existingIds.has(id));

  await prisma.$transaction([
    ...toRemove.map((link) => prisma.menuItemModifierGroup.delete({ where: { id: link.id } })),
    ...toAdd.map((modifierGroupId, i) =>
      prisma.menuItemModifierGroup.create({
        data: { menuItemId: itemId, modifierGroupId, displayOrder: existing.length + i },
      })
    ),
  ]);
  await logAdminActivity({ adminUserId: session.userId, action: "ITEM_MODIFIERS_UPDATED", targetType: "MenuItem", targetId: itemId });
  revalidateMenu();
}
