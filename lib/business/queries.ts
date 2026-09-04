import "server-only";
import { prisma } from "@/lib/db";

export interface PublicBusinessSettings {
  taxRatePercent: number;
}

/**
 * Only the operational settings safe to expose to customers (e.g. for
 * displaying an estimated tax line in the cart). Never return the full
 * BusinessSettings row -- most of it is internal restaurant configuration.
 */
export async function getPublicBusinessSettings(): Promise<PublicBusinessSettings> {
  const settings = await prisma.businessSettings.findFirst();
  return {
    taxRatePercent: settings ? Number(settings.taxRatePercent) : 0,
  };
}

/**
 * The single source of truth for "what is this restaurant called" --
 * anywhere in the app that would otherwise hardcode a restaurant name
 * (admin login heading, Stripe line-item description, etc.) reads it from
 * here instead, so cloning this project for a different restaurant is a
 * database-row change, not a source-code one.
 */
export async function getRestaurantName(): Promise<string> {
  const restaurant = await prisma.restaurant.findFirst();
  return restaurant?.name ?? "Restaurant";
}
