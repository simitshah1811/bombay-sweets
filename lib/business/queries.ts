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
