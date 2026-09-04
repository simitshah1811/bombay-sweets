"use client";

import { cn } from "@/lib/utils/cn";
import type { PickupSlot } from "@/lib/pickup/schedule";

export function PickupTimePicker({
  asapEnabled,
  scheduledEnabled,
  pickupType,
  onPickupTypeChange,
  slots,
  slotsLoading,
  selectedSlotValue,
  onSlotChange,
  timezoneLabel,
}: {
  asapEnabled: boolean;
  scheduledEnabled: boolean;
  pickupType: "ASAP" | "SCHEDULED";
  onPickupTypeChange: (type: "ASAP" | "SCHEDULED") => void;
  slots: PickupSlot[];
  slotsLoading: boolean;
  selectedSlotValue: string;
  onSlotChange: (value: string) => void;
  timezoneLabel: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="font-label text-xs uppercase tracking-[0.15em] text-ink/60">Pickup</span>
        {timezoneLabel && (
          <span className="font-body text-xs text-ink/40">Times shown in {timezoneLabel}</span>
        )}
      </div>
      <div className="flex gap-2.5">
        {asapEnabled && (
          <button
            type="button"
            onClick={() => onPickupTypeChange("ASAP")}
            className={cn(
              "flex-1 rounded-pill border px-4 py-3 font-body text-sm transition-colors",
              pickupType === "ASAP" ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink hover:border-ink/50"
            )}
          >
            As soon as possible
          </button>
        )}
        {scheduledEnabled && (
          <button
            type="button"
            onClick={() => onPickupTypeChange("SCHEDULED")}
            className={cn(
              "flex-1 rounded-pill border px-4 py-3 font-body text-sm transition-colors",
              pickupType === "SCHEDULED" ? "border-ink bg-ink text-cream" : "border-ink/20 text-ink hover:border-ink/50"
            )}
          >
            Schedule for later
          </button>
        )}
      </div>

      {pickupType === "SCHEDULED" && (
        <select
          required
          value={selectedSlotValue}
          onChange={(event) => onSlotChange(event.target.value)}
          className="rounded-control border border-ink/20 bg-transparent px-4 py-3 font-body text-ink outline-none focus:border-ink/60"
        >
          <option value="">{slotsLoading ? "Loading times…" : "Choose a pickup time"}</option>
          {slots.map((slot) => (
            <option key={slot.value} value={slot.value}>
              {slot.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
