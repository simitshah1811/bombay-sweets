import "server-only";
import { prisma } from "@/lib/db";
import type { NotificationRestaurantInfo } from "./types";

/** The single restaurant row is the authoritative source -- never duplicated into template-local constants. */
export async function getRestaurantInfoForNotifications(): Promise<NotificationRestaurantInfo | null> {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) return null;
  return {
    name: restaurant.name,
    phone: restaurant.phone,
    phoneHref: restaurant.phoneHref,
    addressLine: restaurant.addressLine,
    email: restaurant.email,
    timezone: restaurant.timezone,
  };
}
