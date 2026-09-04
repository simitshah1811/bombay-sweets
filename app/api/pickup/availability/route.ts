import { NextResponse } from "next/server";
import { getOperationalContext, buildAuthoritativeSlots, getTimezoneDisplayName } from "@/lib/pickup/schedule";
import { isProductionEnvironment } from "@/lib/env";

// Public, read-only pickup configuration. Slots are computed entirely
// server-side, in the restaurant's own timezone -- the browser never
// generates pickup times from its own clock or timezone. The server
// independently re-validates the customer's actual chosen time again at
// order-creation time regardless of what this endpoint suggested.
export async function GET() {
  try {
    const context = await getOperationalContext();
    if (!context) {
      return NextResponse.json({ error: "Pickup configuration unavailable." }, { status: 503 });
    }

    const now = new Date();
    const slots = await buildAuthoritativeSlots(context, now);

    return NextResponse.json({
      orderingEnabled: context.orderingEnabled,
      pickupEnabled: context.pickupEnabled,
      asapEnabled: context.asapEnabled,
      scheduledEnabled: context.scheduledEnabled,
      minPrepTimeMinutes: context.minPrepTimeMinutes,
      timezoneLabel: getTimezoneDisplayName(context.timezone, now),
      serverNow: now.toISOString(),
      slots,
      // Only demo promotions exist right now -- hide the promo code field
      // entirely in Production rather than show a field that can never
      // succeed there. See lib/orders/validatePromotion.ts.
      promotionsEnabled: !isProductionEnvironment(),
    });
  } catch (error) {
    console.error("Failed to load pickup availability:", error);
    return NextResponse.json({ error: "Unable to load pickup availability." }, { status: 500 });
  }
}
