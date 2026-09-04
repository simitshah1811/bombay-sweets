/**
 * The restaurant's single approved currency for online payments, lowercase
 * to match Stripe's currency-code convention directly (Stripe amounts and
 * ISO 4217 codes are always lowercase in the API).
 *
 * This is a constant, not a database column. Bombay Sweets is a single
 * physical restaurant with one demo `Payment.currency` default ("cad")
 * already baked into the schema, and there is no product requirement or
 * signal anywhere in this system for ever charging in more than one
 * currency. Adding a `Restaurant.currency` column now would be schema churn
 * for a value that has exactly one call site's worth of justification today
 * -- if true multi-currency support becomes a real requirement later, that's
 * a deliberate, separate change, not something to speculatively scaffold
 * here. Every place that needs the currency imports this one constant
 * rather than repeating the literal.
 */
export const RESTAURANT_CURRENCY = "cad";
