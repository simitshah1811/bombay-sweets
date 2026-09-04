import { NextResponse } from "next/server";
import { getPublicBusinessSettings } from "@/lib/business/queries";

// Public, read-only operational settings (currently just the demo tax rate)
// used by the cart to display an estimated tax line without hardcoding it.
export async function GET() {
  try {
    const settings = await getPublicBusinessSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to load business settings:", error);
    return NextResponse.json({ error: "Unable to load settings." }, { status: 500 });
  }
}
