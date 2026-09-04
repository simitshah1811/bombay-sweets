"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 15_000;

/**
 * Keeps the tracking page reasonably current without accounts, websockets,
 * or a separate public data API -- router.refresh() just re-runs this
 * Server Component page, which re-executes the same token-checked lookup
 * every time (see lib/orders/getOrderForTracking.ts). There is no
 * lower-level endpoint this trades away security for.
 *
 * Only rendered by the page while the order is in a non-terminal state
 * (see app/(site)/order/[orderNumber]/page.tsx) -- once COMPLETED,
 * CANCELLED, or REJECTED, the page stops including this component at all,
 * so polling naturally stops. Also pauses while the tab isn't visible, to
 * avoid polling a backgrounded tab indefinitely.
 */
export function OrderTrackingPoll() {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
