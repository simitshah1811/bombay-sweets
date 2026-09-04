import type { PreparationStatus } from "@/lib/generated/prisma/client";

/**
 * Single source of truth for turning a PreparationStatus + optional minutes
 * into customer-facing text. Never expose the raw "GREEN"/"YELLOW"/"RED"
 * enum name in UI copy -- always go through this. Color alone never carries
 * the meaning; every caller renders this text alongside the colored dot.
 */
export const PREP_STATUS_SHORT_LABEL: Record<PreparationStatus, string> = {
  GREEN: "Quick",
  YELLOW: "Moderate",
  RED: "Longer wait",
};

// Shown when the owner hasn't set an exact minute estimate for this item.
export const PREP_STATUS_FALLBACK_LABEL: Record<PreparationStatus, string> = {
  GREEN: "Quick preparation",
  YELLOW: "Moderate wait",
  RED: "Longer wait",
};

export const PREP_STATUS_ADMIN_LABEL: Record<PreparationStatus, string> = {
  GREEN: "Green – Quick",
  YELLOW: "Yellow – Moderate",
  RED: "Red – Longer wait",
};

export function formatPrepLabel(status: PreparationStatus, minutes: number | null): string {
  if (minutes != null) {
    return `${PREP_STATUS_SHORT_LABEL[status]} · ~${minutes} min`;
  }
  return PREP_STATUS_FALLBACK_LABEL[status];
}
