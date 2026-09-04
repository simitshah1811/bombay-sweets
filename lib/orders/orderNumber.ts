import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";

function randomOrderNumber(now: Date): string {
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BS-${y}${m}${d}-${rand}`;
}

/** Generates a human-friendly order number, retrying on the rare collision. */
export async function generateUniqueOrderNumber(
  tx: Prisma.TransactionClient,
  now: Date = new Date()
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = randomOrderNumber(now);
    const existing = await tx.order.findUnique({ where: { orderNumber: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  throw new Error("Unable to generate a unique order number after multiple attempts.");
}
