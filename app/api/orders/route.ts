import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/orders/createOrder";
import type { CartProblem } from "@/lib/orders/validateCart";

const cartLineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  modifierOptionIds: z.array(z.string().min(1)).max(50),
  specialInstructions: z.string().max(500),
  expectedUnitPrice: z.number().min(0),
  expectedModifierPrices: z.record(z.string(), z.number()),
});

const orderRequestSchema = z.object({
  idempotencyKey: z.string().min(10).max(100),
  customer: z.object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.email().max(200),
    phone: z.string().trim().min(7).max(30),
  }),
  pickup: z.object({
    type: z.enum(["ASAP", "SCHEDULED"]),
    requestedPickupTime: z.iso.datetime().nullable(),
  }),
  notes: z.string().max(1000),
  promoCode: z.string().trim().max(50).nullable(),
  lines: z.array(cartLineSchema).min(1).max(50),
});

function describeProblem(problem: CartProblem): string {
  switch (problem.type) {
    case "CART_EMPTY":
      return "Your cart is empty.";
    case "ITEM_NOT_FOUND":
      return "One of the items in your cart is no longer on our menu.";
    case "ITEM_UNAVAILABLE":
      return `${problem.itemName} is currently unavailable.`;
    case "INVALID_QUANTITY":
      return `The quantity for ${problem.itemName} isn't valid.`;
    case "PRICE_CHANGED":
      return `The price of ${problem.itemName} has changed.`;
    case "MODIFIER_PRICE_CHANGED":
      return `The price of "${problem.modifierName}" for ${problem.itemName} has changed.`;
    case "MODIFIER_INVALID":
      return `One of the selected options for ${problem.itemName} is no longer valid.`;
    case "MODIFIER_UNAVAILABLE":
      return `"${problem.modifierName}" for ${problem.itemName} is no longer available.`;
    case "MODIFIER_GROUP_INVALID":
      return problem.reason === "too_few"
        ? `Please make a selection for "${problem.groupName}" on ${problem.itemName}.`
        : `Too many options selected for "${problem.groupName}" on ${problem.itemName}.`;
    default:
      return "One of the items in your cart needs attention.";
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "We couldn't read your order. Please try again." }, { status: 400 });
  }

  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please check your information and try again." },
      { status: 400 }
    );
  }

  try {
    const result = await createOrder(parsed.data);

    if (result.ok) {
      return NextResponse.json({ ok: true, order: result.order });
    }

    if (result.code === "CART_PROBLEMS") {
      return NextResponse.json(
        {
          ok: false,
          code: result.code,
          message: "One or more items in your cart have changed. Please review your cart before continuing.",
          problems: result.problems.map(describeProblem),
        },
        { status: 409 }
      );
    }

    if (result.code === "PICKUP_INVALID" || result.code === "PROMO_INVALID") {
      return NextResponse.json({ ok: false, code: result.code, message: result.message }, { status: 422 });
    }

    return NextResponse.json({ ok: false, code: "SERVER_ERROR", message: result.message }, { status: 500 });
  } catch (error) {
    console.error("Unhandled error creating order:", error);
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: "Something went wrong. Please try again, or call us directly." },
      { status: 500 }
    );
  }
}
