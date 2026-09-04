"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guard";
import { logAdminActivity } from "@/lib/auth/activityLog";

async function requireMenuManager() {
  return requirePermission("menu:manage");
}

function revalidateMenu() {
  revalidatePath("/admin/menu");
  revalidatePath("/admin/menu/modifiers");
  revalidatePath("/menu");
}

const groupSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    isRequired: z.boolean(),
    minSelect: z.coerce.number().int().min(0).max(20),
    maxSelect: z.coerce.number().int().min(1).max(20),
  })
  .refine((v) => v.maxSelect >= v.minSelect, { message: "Max must be >= min" });

function parseGroupForm(formData: FormData) {
  return groupSchema.safeParse({
    name: formData.get("name"),
    isRequired: formData.get("isRequired") === "on",
    minSelect: formData.get("minSelect"),
    maxSelect: formData.get("maxSelect"),
  });
}

export async function createModifierGroup(formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const parsed = parseGroupForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  const maxOrder = await prisma.modifierGroup.aggregate({ _max: { displayOrder: true } });
  const group = await prisma.modifierGroup.create({
    data: {
      name: d.name,
      isRequired: d.isRequired,
      minSelect: d.isRequired ? Math.max(1, d.minSelect) : d.minSelect,
      maxSelect: d.maxSelect,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });
  await logAdminActivity({ adminUserId: session.userId, action: "MODIFIER_GROUP_CREATED", targetType: "ModifierGroup", targetId: group.id });
  revalidateMenu();
}

export async function updateModifierGroup(id: string, formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const parsed = parseGroupForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  await prisma.modifierGroup.update({
    where: { id },
    data: {
      name: d.name,
      isRequired: d.isRequired,
      minSelect: d.isRequired ? Math.max(1, d.minSelect) : d.minSelect,
      maxSelect: d.maxSelect,
    },
  });
  await logAdminActivity({ adminUserId: session.userId, action: "MODIFIER_GROUP_UPDATED", targetType: "ModifierGroup", targetId: id });
  revalidateMenu();
}

const optionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  priceAdjustment: z.coerce.number().min(-1000).max(1000),
});

function parseOptionForm(formData: FormData) {
  return optionSchema.safeParse({
    name: formData.get("name"),
    priceAdjustment: formData.get("priceAdjustment") || "0",
  });
}

export async function createModifierOption(groupId: string, formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const parsed = parseOptionForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  const maxOrder = await prisma.modifierOption.aggregate({
    where: { modifierGroupId: groupId },
    _max: { displayOrder: true },
  });
  const option = await prisma.modifierOption.create({
    data: {
      modifierGroupId: groupId,
      name: d.name,
      priceAdjustment: d.priceAdjustment,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });
  await logAdminActivity({ adminUserId: session.userId, action: "MODIFIER_OPTION_CREATED", targetType: "ModifierOption", targetId: option.id });
  revalidateMenu();
}

export async function updateModifierOption(id: string, formData: FormData): Promise<void> {
  const session = await requireMenuManager();
  const parsed = parseOptionForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  await prisma.modifierOption.update({
    where: { id },
    data: { name: d.name, priceAdjustment: d.priceAdjustment },
  });
  await logAdminActivity({ adminUserId: session.userId, action: "MODIFIER_OPTION_UPDATED", targetType: "ModifierOption", targetId: id });
  revalidateMenu();
}

// No hard delete for groups or options -- OrderItemModifier snapshots the
// group/option name and price at order time, but ModifierOption rows can
// still be FK-referenced by past orders (modifierOptionId), so removing one
// could break history. Availability is the only "make this go away" lever.
export async function toggleModifierOptionAvailability(id: string, nextAvailable: boolean): Promise<void> {
  const session = await requireMenuManager();
  await prisma.modifierOption.update({ where: { id }, data: { isAvailable: nextAvailable } });
  await logAdminActivity({
    adminUserId: session.userId,
    action: nextAvailable ? "MODIFIER_OPTION_MARKED_AVAILABLE" : "MODIFIER_OPTION_MARKED_UNAVAILABLE",
    targetType: "ModifierOption",
    targetId: id,
  });
  revalidateMenu();
}
