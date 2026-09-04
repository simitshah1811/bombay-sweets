import "server-only";
import { prisma } from "@/lib/db";
import type { DayOfWeek } from "@/lib/generated/prisma/client";

export interface AdminBusinessHours {
  id: string;
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface AdminSpecialHours {
  id: string;
  date: string; // "YYYY-MM-DD"
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  note: string | null;
}

export interface AdminSettingsData {
  restaurantId: string;
  timezone: string;
  orderingEnabled: boolean;
  pickupEnabled: boolean;
  asapPickupEnabled: boolean;
  scheduledPickupEnabled: boolean;
  minPrepTimeMinutes: number;
  pickupIntervalMinutes: number;
  maxAdvanceSchedulingHours: number;
  taxRatePercent: number;
  businessHours: AdminBusinessHours[];
  specialHours: AdminSpecialHours[];
}

const DAY_ORDER: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export async function getAdminSettings(): Promise<AdminSettingsData | null> {
  const restaurant = await prisma.restaurant.findFirst({
    include: {
      settings: true,
      businessHours: true,
      specialHours: { orderBy: { date: "asc" } },
    },
  });
  if (!restaurant || !restaurant.settings) return null;

  const hoursByDay = new Map(restaurant.businessHours.map((h) => [h.dayOfWeek, h]));

  return {
    restaurantId: restaurant.id,
    timezone: restaurant.timezone,
    orderingEnabled: restaurant.settings.orderingEnabled,
    pickupEnabled: restaurant.settings.pickupEnabled,
    asapPickupEnabled: restaurant.settings.asapPickupEnabled,
    scheduledPickupEnabled: restaurant.settings.scheduledPickupEnabled,
    minPrepTimeMinutes: restaurant.settings.minPrepTimeMinutes,
    pickupIntervalMinutes: restaurant.settings.pickupIntervalMinutes,
    maxAdvanceSchedulingHours: restaurant.settings.maxAdvanceSchedulingHours,
    taxRatePercent: Number(restaurant.settings.taxRatePercent),
    businessHours: DAY_ORDER.map((day) => {
      const h = hoursByDay.get(day);
      return {
        id: h?.id ?? day,
        dayOfWeek: day,
        openTime: h?.openTime ?? "10:00",
        closeTime: h?.closeTime ?? "20:00",
        isClosed: h?.isClosed ?? false,
      };
    }),
    specialHours: restaurant.specialHours.map((s) => ({
      id: s.id,
      date: s.date.toISOString().slice(0, 10),
      openTime: s.openTime,
      closeTime: s.closeTime,
      isClosed: s.isClosed,
      note: s.note,
    })),
  };
}

export interface AdminPromotion {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  isActive: boolean;
  isDemoPromotion: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export async function getAdminPromotions(): Promise<AdminPromotion[]> {
  const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
  return promotions.map((p) => ({
    id: p.id,
    code: p.code,
    description: p.description,
    discountType: p.discountType,
    discountValue: Number(p.discountValue),
    isActive: p.isActive,
    isDemoPromotion: p.isDemoPromotion,
    startsAt: p.startsAt?.toISOString() ?? null,
    endsAt: p.endsAt?.toISOString() ?? null,
  }));
}
