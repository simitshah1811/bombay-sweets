"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keeps the order queue "reasonably current" without WebSockets or any
// realtime infrastructure -- just a periodic server-data revalidation via
// Next's router.refresh(), which re-runs the page's server-side queries.
const REFRESH_INTERVAL_MS = 20_000;

export function QueueAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
