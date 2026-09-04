import "server-only";
import { prisma } from "@/lib/db";
import { DayOfWeek } from "@/lib/generated/prisma/client";

const WEEKDAY_TO_ENUM: Record<string, DayOfWeek> = {
  Sun: "SUNDAY",
  Mon: "MONDAY",
  Tue: "TUESDAY",
  Wed: "WEDNESDAY",
  Thu: "THURSDAY",
  Fri: "FRIDAY",
  Sat: "SATURDAY",
};

export interface LocalDateParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  dayOfWeek: DayOfWeek;
}

/**
 * Converts an absolute instant to wall-clock date/time in the given IANA
 * timezone. This is what makes every pickup check timezone-correct
 * regardless of where the customer's browser happens to be -- the customer
 * only ever supplies an absolute instant (an ISO string); every comparison
 * against business hours re-derives the RESTAURANT's local time from it.
 */
export function getLocalParts(date: Date, timeZone: string): LocalDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: parts.hour === "24" ? 0 : Number(parts.hour),
    minute: Number(parts.minute),
    dayOfWeek: WEEKDAY_TO_ENUM[parts.weekday],
  };
}

/**
 * The inverse of getLocalParts: given a wall-clock date/time as it should
 * read IN the given timezone, returns the absolute UTC instant that
 * produces it. Used to turn "10:00 AM Pacific" into a real, correct Date
 * regardless of what timezone this server process happens to be running in
 * -- never assumes the server or the customer's browser is in the
 * restaurant's timezone. Converges via two passes through the actual ICU
 * timezone database (handled by Intl), so DST transitions are respected
 * without hardcoding any offset.
 */
export function zonedTimeToUtc(
  timeZone: string,
  parts: { year: number; month: number; day: number; hour: number; minute: number }
): Date {
  const desiredAsUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
  let guess = new Date(desiredAsUtcMs);

  for (let i = 0; i < 2; i++) {
    const guessedLocal = getLocalParts(guess, timeZone);
    const guessedAsUtcMs = Date.UTC(
      guessedLocal.year,
      guessedLocal.month - 1,
      guessedLocal.day,
      guessedLocal.hour,
      guessedLocal.minute,
      0,
      0
    );
    const diff = desiredAsUtcMs - guessedAsUtcMs;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff);
  }

  return guess;
}

/**
 * Human-friendly timezone label for the given instant (e.g. "Pacific
 * Daylight Time" vs. "Pacific Standard Time"), derived from the IANA
 * identifier via Intl rather than hardcoded -- correctly reflects whether
 * daylight saving is in effect on that date.
 */
export function getTimezoneDisplayName(timeZone: string, date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "long" }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

/**
 * The UTC instant range covering "today" as a calendar date in the
 * restaurant's own timezone -- e.g. for a dashboard's "Today's Orders"
 * count. Deliberately ignores the caller's (browser/server process)
 * timezone entirely; only the restaurant's IANA identifier decides where
 * the day boundary falls.
 */
export function getRestaurantDayRange(timeZone: string, now: Date): { start: Date; end: Date } {
  const local = getLocalParts(now, timeZone);
  const start = zonedTimeToUtc(timeZone, { year: local.year, month: local.month, day: local.day, hour: 0, minute: 0 });
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Matches how SpecialHours.date (a @db.Date column) is stored: a bare calendar date. */
function localDateKey(parts: { year: number; month: number; day: number }): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function minutesSinceMidnight(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export interface DayHours {
  isClosed: boolean;
  openTime: string | null; // "HH:mm"
  closeTime: string | null;
  isSpecial: boolean;
  note: string | null;
}

export interface OperationalContext {
  restaurantId: string;
  /** IANA timezone identifier, e.g. "America/Los_Angeles" -- the sole authority for all pickup scheduling. */
  timezone: string;
  orderingEnabled: boolean;
  pickupEnabled: boolean;
  asapEnabled: boolean;
  scheduledEnabled: boolean;
  minPrepTimeMinutes: number;
  pickupIntervalMinutes: number;
  maxAdvanceSchedulingHours: number;
}

/** All values here come from the database -- never hardcoded in application logic. */
export async function getOperationalContext(): Promise<OperationalContext | null> {
  const restaurant = await prisma.restaurant.findFirst({ include: { settings: true } });
  if (!restaurant || !restaurant.settings) return null;
  const s = restaurant.settings;
  return {
    restaurantId: restaurant.id,
    timezone: restaurant.timezone,
    orderingEnabled: s.orderingEnabled,
    pickupEnabled: s.pickupEnabled,
    asapEnabled: s.asapPickupEnabled,
    scheduledEnabled: s.scheduledPickupEnabled,
    minPrepTimeMinutes: s.minPrepTimeMinutes,
    pickupIntervalMinutes: s.pickupIntervalMinutes,
    maxAdvanceSchedulingHours: s.maxAdvanceSchedulingHours,
  };
}

/** Special-date hours override the day-of-week's regular hours when present. */
export async function getHoursForLocalDate(
  restaurantId: string,
  parts: { year: number; month: number; day: number; dayOfWeek: DayOfWeek }
): Promise<DayHours> {
  const special = await prisma.specialHours.findUnique({
    where: { restaurantId_date: { restaurantId, date: localDateKey(parts) } },
  });
  if (special) {
    return {
      isClosed: special.isClosed,
      openTime: special.isClosed ? null : special.openTime,
      closeTime: special.isClosed ? null : special.closeTime,
      isSpecial: true,
      note: special.note,
    };
  }

  const regular = await prisma.businessHours.findUnique({
    where: { restaurantId_dayOfWeek: { restaurantId, dayOfWeek: parts.dayOfWeek } },
  });
  if (!regular || regular.isClosed) {
    return { isClosed: true, openTime: null, closeTime: null, isSpecial: false, note: null };
  }
  return { isClosed: false, openTime: regular.openTime, closeTime: regular.closeTime, isSpecial: false, note: null };
}

export interface UpcomingDayHours extends DayHours {
  dateKey: string; // "YYYY-MM-DD", restaurant-local calendar date
  year: number;
  month: number;
  day: number;
  dayOfWeek: DayOfWeek;
}

/** Hours for today plus enough future days to cover the max advance-scheduling window, all in restaurant-local terms. */
export async function getUpcomingHours(context: OperationalContext, now: Date): Promise<UpcomingDayHours[]> {
  const daysAhead = Math.ceil(context.maxAdvanceSchedulingHours / 24) + 1;
  const results: UpcomingDayHours[] = [];

  for (let i = 0; i <= daysAhead; i++) {
    const parts = getLocalParts(new Date(now.getTime() + i * 86400000), context.timezone);
    const hours = await getHoursForLocalDate(context.restaurantId, parts);
    results.push({
      ...hours,
      dateKey: `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
      year: parts.year,
      month: parts.month,
      day: parts.day,
      dayOfWeek: parts.dayOfWeek,
    });
  }

  return results;
}

export interface PickupSlot {
  value: string; // ISO instant
  label: string; // formatted in the restaurant's timezone, e.g. "Today, 5:45 PM Pacific Time"
}

const MAX_SLOTS = 16;

function formatSlotLabel(date: Date, timeZone: string, dayOffset: number): string {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  if (dayOffset === 0) return `Today, ${time}`;
  if (dayOffset === 1) return `Tomorrow, ${time}`;
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(date);
  return `${weekday}, ${time}`;
}

/**
 * Builds the actual list of selectable pickup times, entirely from the
 * restaurant's real hours/prep-time/interval settings and its own
 * timezone -- never from the customer's browser clock or timezone. This is
 * the single source of truth for "what times can be picked"; the client
 * only ever renders whatever this returns.
 */
export async function buildAuthoritativeSlots(context: OperationalContext, now: Date): Promise<PickupSlot[]> {
  const days = await getUpcomingHours(context, now);
  const slots: PickupSlot[] = [];
  const earliestReadyMs = now.getTime() + context.minPrepTimeMinutes * 60000;
  const latestAllowedMs = now.getTime() + context.maxAdvanceSchedulingHours * 3600000;

  for (let dayOffset = 0; dayOffset < days.length && slots.length < MAX_SLOTS; dayOffset++) {
    const day = days[dayOffset];
    if (day.isClosed || !day.openTime || !day.closeTime) continue;

    const [openH, openM] = day.openTime.split(":").map(Number);
    const [closeH, closeM] = day.closeTime.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    const dayOpenMs = zonedTimeToUtc(context.timezone, {
      year: day.year,
      month: day.month,
      day: day.day,
      hour: openH,
      minute: openM,
    }).getTime();
    const earliestMinutesThisDay = Math.ceil((earliestReadyMs - dayOpenMs) / 60000) + openMinutes;
    const startMinutes = Math.max(
      openMinutes,
      Math.ceil(earliestMinutesThisDay / context.pickupIntervalMinutes) * context.pickupIntervalMinutes
    );

    for (
      let minutes = startMinutes;
      minutes <= closeMinutes && slots.length < MAX_SLOTS;
      minutes += context.pickupIntervalMinutes
    ) {
      const slotDate = zonedTimeToUtc(context.timezone, {
        year: day.year,
        month: day.month,
        day: day.day,
        hour: Math.floor(minutes / 60),
        minute: minutes % 60,
      });
      const slotMs = slotDate.getTime();
      if (slotMs > latestAllowedMs) break;
      if (slotMs < earliestReadyMs) continue;
      slots.push({ value: slotDate.toISOString(), label: formatSlotLabel(slotDate, context.timezone, dayOffset) });
    }
  }

  return slots;
}

export interface PickupValidationInput {
  pickupType: "ASAP" | "SCHEDULED";
  requestedPickupTime: Date | null;
  now?: Date;
}

export interface PickupValidationResult {
  valid: boolean;
  error?: string;
  /** null for ASAP (schema convention: null means "as soon as possible"). */
  resolvedPickupTime: Date | null;
}

/**
 * Authoritative, server-side pickup time check. Never trusts the browser --
 * re-derives "is the restaurant open," "is this within prep/scheduling
 * limits," and "does this respect special/holiday hours" entirely from the
 * database and the restaurant's own timezone, using the instant supplied by
 * the client only as the candidate time to validate. A customer in any
 * timezone (Chicago, New York, India, anywhere) submits the same kind of
 * absolute instant and is validated identically -- their browser's
 * timezone never enters the calculation.
 */
export async function validatePickupSelection(input: PickupValidationInput): Promise<PickupValidationResult> {
  const now = input.now ?? new Date();
  const context = await getOperationalContext();

  if (!context) {
    return {
      valid: false,
      error: "Ordering is temporarily unavailable. Please call us to order.",
      resolvedPickupTime: null,
    };
  }
  if (!context.orderingEnabled || !context.pickupEnabled) {
    return {
      valid: false,
      error: "We're not accepting online orders right now. Please call us to order.",
      resolvedPickupTime: null,
    };
  }

  if (input.pickupType === "ASAP") {
    if (!context.asapEnabled) {
      return {
        valid: false,
        error: "ASAP pickup isn't available right now -- please choose a scheduled pickup time instead.",
        resolvedPickupTime: null,
      };
    }
    const nowParts = getLocalParts(now, context.timezone);
    const hours = await getHoursForLocalDate(context.restaurantId, nowParts);
    if (hours.isClosed || !hours.openTime || !hours.closeTime) {
      return {
        valid: false,
        error: "We're currently closed. Please choose a scheduled pickup time during our open hours.",
        resolvedPickupTime: null,
      };
    }
    const nowMinutes = minutesSinceMidnight(nowParts.hour, nowParts.minute);
    const openMinutes = parseTimeToMinutes(hours.openTime);
    const closeMinutes = parseTimeToMinutes(hours.closeTime);
    if (nowMinutes < openMinutes || nowMinutes >= closeMinutes) {
      return {
        valid: false,
        error: `We're currently closed. Today's pickup hours are ${hours.openTime}–${hours.closeTime} ${getTimezoneDisplayName(context.timezone, now)}.`,
        resolvedPickupTime: null,
      };
    }
    return { valid: true, resolvedPickupTime: null };
  }

  // SCHEDULED
  if (!context.scheduledEnabled) {
    return {
      valid: false,
      error: "Scheduled pickup isn't available right now -- please choose ASAP instead.",
      resolvedPickupTime: null,
    };
  }
  if (!input.requestedPickupTime || Number.isNaN(input.requestedPickupTime.getTime())) {
    return { valid: false, error: "Please choose a pickup time.", resolvedPickupTime: null };
  }

  const requested = input.requestedPickupTime;
  const earliestAllowed = new Date(now.getTime() + context.minPrepTimeMinutes * 60000);
  if (requested < earliestAllowed) {
    return {
      valid: false,
      error: `That pickup time is too soon -- we need at least ${context.minPrepTimeMinutes} minutes to prepare your order.`,
      resolvedPickupTime: null,
    };
  }

  const latestAllowed = new Date(now.getTime() + context.maxAdvanceSchedulingHours * 3600000);
  if (requested > latestAllowed) {
    return {
      valid: false,
      error: `That pickup time is too far in advance -- we accept orders up to ${context.maxAdvanceSchedulingHours} hours ahead.`,
      resolvedPickupTime: null,
    };
  }

  const requestedParts = getLocalParts(requested, context.timezone);
  const hours = await getHoursForLocalDate(context.restaurantId, requestedParts);
  if (hours.isClosed || !hours.openTime || !hours.closeTime) {
    return { valid: false, error: "We're closed on that day. Please choose another pickup time.", resolvedPickupTime: null };
  }
  const requestedMinutes = minutesSinceMidnight(requestedParts.hour, requestedParts.minute);
  const openMinutes = parseTimeToMinutes(hours.openTime);
  const closeMinutes = parseTimeToMinutes(hours.closeTime);
  if (requestedMinutes < openMinutes || requestedMinutes >= closeMinutes) {
    return {
      valid: false,
      error: `That time is outside our pickup hours (${hours.openTime}–${hours.closeTime} ${getTimezoneDisplayName(context.timezone, requested)}).`,
      resolvedPickupTime: null,
    };
  }

  return { valid: true, resolvedPickupTime: requested };
}
