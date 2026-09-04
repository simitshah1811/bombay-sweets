import { NextResponse } from "next/server";
import { getMenuItemsForCart } from "@/lib/menu/queries";

// Lightweight, read-only menu snapshot (including modifier groups) used only
// by the client-side cart to resolve item/modifier names, current prices, and
// availability. Not an authoritative pricing endpoint.
export async function GET() {
  try {
    const items = await getMenuItemsForCart();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to load menu items:", error);
    return NextResponse.json({ error: "Unable to load menu items." }, { status: 500 });
  }
}
