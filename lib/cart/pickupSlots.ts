const PREP_MINUTES = 20;
const STEP_MINUTES = 15;
const DAYS_TO_OFFER = 2;
const MAX_SLOTS = 16;

export interface PickupSlot {
  value: string;
  label: string;
}

function hoursForDate(date: Date): { open: number; close: number } {
  const isSunday = date.getDay() === 0;
  return isSunday ? { open: 10 * 60, close: 19 * 60 + 30 } : { open: 10 * 60, close: 20 * 60 };
}

function formatSlotLabel(date: Date, dayOffset: number): string {
  const time = date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  if (dayOffset === 0) return `Today, ${time}`;
  if (dayOffset === 1) return `Tomorrow, ${time}`;
  return `${date.toLocaleDateString("en-CA", { weekday: "long" })}, ${time}`;
}

export function getPickupSlots(now: Date = new Date()): PickupSlot[] {
  const slots: PickupSlot[] = [];

  for (let dayOffset = 0; dayOffset < DAYS_TO_OFFER && slots.length < MAX_SLOTS; dayOffset++) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() + dayOffset);
    dayStart.setHours(0, 0, 0, 0);

    const { open, close } = hoursForDate(dayStart);

    let startMinutes = open;
    if (dayOffset === 0) {
      const earliestReady = now.getHours() * 60 + now.getMinutes() + PREP_MINUTES;
      startMinutes = Math.max(open, Math.ceil(earliestReady / STEP_MINUTES) * STEP_MINUTES);
    }

    for (let minutes = startMinutes; minutes <= close && slots.length < MAX_SLOTS; minutes += STEP_MINUTES) {
      const slotDate = new Date(dayStart.getTime() + minutes * 60000);
      slots.push({
        value: slotDate.toISOString(),
        label: formatSlotLabel(slotDate, dayOffset),
      });
    }
  }

  return slots;
}
