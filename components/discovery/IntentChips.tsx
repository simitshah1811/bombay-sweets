"use client";

import { Chip } from "@/components/ui/Chip";
import { CHIPS, type ChipId } from "@/lib/discovery/chips";

export function IntentChips({
  active,
  onToggle,
}: {
  active: ChipId[];
  onToggle: (id: ChipId) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {CHIPS.map((chip) => (
        <Chip key={chip.id} selected={active.includes(chip.id)} onClick={() => onToggle(chip.id)}>
          {chip.label}
        </Chip>
      ))}
    </div>
  );
}
