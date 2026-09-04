import { NextResponse } from "next/server";
import { z } from "zod";
import { validatePromotion, describePromotionRejection } from "@/lib/orders/validatePromotion";
import { toCents, fromCents } from "@/lib/money";

const schema = z.object({
  code: z.string().trim().min(1).max(50),
  customerEmail: z.email(),
  subtotal: z.number().min(0),
});

// Preview-only endpoint so checkout can show the discount before the
// customer places the order. Not authoritative -- the real order-creation
// endpoint re-validates the promo code and recalculates the discount from
// scratch regardless of what this returned.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Please enter a valid promo code." }, { status: 400 });
  }

  try {
    const result = await validatePromotion({
      code: parsed.data.code,
      customerEmail: parsed.data.customerEmail,
      subtotalCents: toCents(parsed.data.subtotal),
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: describePromotionRejection(result.reason) }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      code: result.code,
      discountType: result.discountType,
      discountValue: result.discountValue,
      discountAmount: fromCents(result.discountCents),
    });
  } catch (error) {
    console.error("Failed to validate promotion:", error);
    return NextResponse.json(
      { ok: false, message: "We couldn't check that code right now. Please try again." },
      { status: 500 }
    );
  }
}
