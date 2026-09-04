// Explicitly formats in the given IANA timezone rather than relying on the
// server or browser's local zone -- admin order times are always shown in
// the RESTAURANT's timezone, never whatever machine happens to render them.
export function formatInTimezone(iso: string, timeZone: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleString("en-US", { timeZone, ...opts });
}

export function formatOrderTimestamp(iso: string, timeZone: string): string {
  return formatInTimezone(iso, timeZone, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPickupTime(
  pickupType: "ASAP" | "SCHEDULED",
  requestedPickupTime: string | null,
  timeZone: string
): string {
  if (pickupType === "ASAP" || !requestedPickupTime) return "ASAP";
  return formatInTimezone(requestedPickupTime, timeZone, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
