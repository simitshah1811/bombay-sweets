"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guard";
import { logAdminActivity } from "@/lib/auth/activityLog";
import type { DayOfWeek } from "@/lib/generated/prisma/client";

async function requireSettingsManager() {
  return requirePermission("settings:manage");
}

function revalidateSettings() {
  revalidatePath("/admin/settings");
  revalidatePath("/menu");
  revalidatePath("/checkout");
}

const DAYS: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const settingsSchema = z.object({
  orderingEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  asapPickupEnabled: z.boolean(),
  scheduledPickupEnabled: z.boolean(),
  minPrepTimeMinutes: z.coerce.number().int().min(0).max(240),
  pickupIntervalMinutes: z.coerce.number().int().min(5).max(120),
  maxAdvanceSchedulingHours: z.coerce.number().int().min(1).max(720),
  taxRatePercent: z.coerce.number().min(0).max(100),
});

// This form is explicitly labeled DEMO / CLIENT-APPROVAL-PENDING in the UI
// -- editing it is a rehearsal of the admin workflow, not a claim that these
// values are Bombay Sweets' approved final business rules.
export async function updateBusinessSettings(formData: FormData): Promise<void> {
  const session = await requireSettingsManager();
  const parsed = settingsSchema.safeParse({
    orderingEnabled: formData.get("orderingEnabled") === "on",
    pickupEnabled: formData.get("pickupEnabled") === "on",
    asapPickupEnabled: formData.get("asapPickupEnabled") === "on",
    scheduledPickupEnabled: formData.get("scheduledPickupEnabled") === "on",
    minPrepTimeMinutes: formData.get("minPrepTimeMinutes"),
    pickupIntervalMinutes: formData.get("pickupIntervalMinutes"),
    maxAdvanceSchedulingHours: formData.get("maxAdvanceSchedulingHours"),
    taxRatePercent: formData.get("taxRatePercent"),
  });
  if (!parsed.success) return;

  const restaurant = await prisma.restaurant.findFirst({ select: { id: true } });
  if (!restaurant) return;

  // taxRatePercent only affects orders placed AFTER this change -- every
  // existing Order already has its own taxAmount snapshotted at checkout
  // time, so this can never retroactively alter a past order's total.
  await prisma.businessSettings.update({ where: { restaurantId: restaurant.id }, data: parsed.data });
  await logAdminActivity({ adminUserId: session.userId, action: "SETTINGS_UPDATED", targetType: "BusinessSettings", targetId: restaurant.id });
  revalidateSettings();
}

export async function updateBusinessHours(formData: FormData): Promise<void> {
  const session = await requireSettingsManager();
  const restaurant = await prisma.restaurant.findFirst({ select: { id: true } });
  if (!restaurant) return;

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  const updates = DAYS.map((day) => {
    const openTime = String(formData.get(`${day}_openTime`) ?? "10:00");
    const closeTime = String(formData.get(`${day}_closeTime`) ?? "20:00");
    const isClosed = formData.get(`${day}_isClosed`) === "on";
    if (!timePattern.test(openTime) || !timePattern.test(closeTime)) return null;
    return { day, openTime, closeTime, isClosed };
  }).filter((v): v is NonNullable<typeof v> => v !== null);

  await prisma.$transaction(
    updates.map((u) =>
      prisma.businessHours.upsert({
        where: { restaurantId_dayOfWeek: { restaurantId: restaurant.id, dayOfWeek: u.day } },
        update: { openTime: u.openTime, closeTime: u.closeTime, isClosed: u.isClosed },
        create: { restaurantId: restaurant.id, dayOfWeek: u.day, openTime: u.openTime, closeTime: u.closeTime, isClosed: u.isClosed },
      })
    )
  );
  await logAdminActivity({ adminUserId: session.userId, action: "BUSINESS_HOURS_UPDATED", targetType: "BusinessHours", targetId: restaurant.id });
  revalidateSettings();
}

const specialHoursSchema = z.object({
  date: z.iso.date(),
  isClosed: z.boolean(),
  openTime: z.string().trim().optional(),
  closeTime: z.string().trim().optional(),
  note: z.string().trim().max(200).optional(),
});

export async function createSpecialHours(formData: FormData): Promise<void> {
  const session = await requireSettingsManager();
  const parsed = specialHoursSchema.safeParse({
    date: formData.get("date"),
    isClosed: formData.get("isClosed") === "on",
    openTime: formData.get("openTime") || undefined,
    closeTime: formData.get("closeTime") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;

  const restaurant = await prisma.restaurant.findFirst({ select: { id: true } });
  if (!restaurant) return;

  await prisma.specialHours.upsert({
    where: { restaurantId_date: { restaurantId: restaurant.id, date: new Date(`${d.date}T00:00:00.000Z`) } },
    update: { isClosed: d.isClosed, openTime: d.isClosed ? null : d.openTime || null, closeTime: d.isClosed ? null : d.closeTime || null, note: d.note || null },
    create: {
      restaurantId: restaurant.id,
      date: new Date(`${d.date}T00:00:00.000Z`),
      isClosed: d.isClosed,
      openTime: d.isClosed ? null : d.openTime || null,
      closeTime: d.isClosed ? null : d.closeTime || null,
      note: d.note || null,
    },
  });
  await logAdminActivity({ adminUserId: session.userId, action: "SPECIAL_HOURS_SET", targetType: "SpecialHours", targetId: d.date });
  revalidateSettings();
}

// SpecialHours rows are never referenced by any other table (unlike
// MenuItem/ModifierOption, which orders snapshot from) -- deleting one is
// safe and doesn't risk any historical data.
export async function deleteSpecialHours(id: string): Promise<void> {
  const session = await requireSettingsManager();
  await prisma.specialHours.delete({ where: { id } }).catch(() => null);
  await logAdminActivity({ adminUserId: session.userId, action: "SPECIAL_HOURS_DELETED", targetType: "SpecialHours", targetId: id });
  revalidateSettings();
}
