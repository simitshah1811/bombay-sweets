import "server-only";
import { Resend } from "resend";
import { isProductionEnvironment } from "@/lib/env";
import type { EmailContent } from "./types";

let cachedClient: Resend | null = null;

// Lazy, not built at module-evaluation time -- same reasoning as
// lib/stripe/client.ts: Next's build step evaluates route modules'
// imports, and a missing EMAIL_PROVIDER_API_KEY must only ever surface
// when a request actually tries to send, not break `next build` itself.
function getResendClient(): Resend {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new Error("EMAIL_PROVIDER_API_KEY is missing. Add your Resend API key before sending notifications.");
  }
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

export function notificationsEnabled(): boolean {
  return process.env.NOTIFICATIONS_ENABLED === "true";
}

export type RecipientSkipReason = "disabled" | "no-test-recipient";
export type RecipientResolution = { send: true; recipientEmail: string } | { send: false; reason: RecipientSkipReason };

/**
 * The production-safety gate (requirements #5, #6, #39, #40). This is the
 * ONE place that decides who actually receives an email -- every other
 * piece of this system just asks it "should I send, and to whom."
 *
 * Production: sends to the real customer, but only when
 * NOTIFICATIONS_ENABLED=true. Until that's explicitly turned on, nothing
 * goes out even though the code is fully deployed.
 *
 * Development/Preview: NEVER reaches a real customer inbox, full stop --
 * not even if NOTIFICATIONS_ENABLED is true. It either redirects to
 * NOTIFICATION_TEST_EMAIL (a destination the project owner configures
 * themselves, not a customer address) or is skipped entirely if that
 * isn't set. There is no environment variable combination that lets a
 * non-production deploy email a real customer.
 */
export function resolveRecipient(customerEmail: string): RecipientResolution {
  if (!notificationsEnabled()) {
    return { send: false, reason: "disabled" };
  }
  if (isProductionEnvironment()) {
    return { send: true, recipientEmail: customerEmail };
  }
  const testEmail = process.env.NOTIFICATION_TEST_EMAIL?.trim();
  if (!testEmail) {
    return { send: false, reason: "no-test-recipient" };
  }
  return { send: true, recipientEmail: testEmail };
}

export type SendEmailResult = { ok: true; providerMessageId: string } | { ok: false; error: string };

/**
 * The only function in this codebase that actually calls the email
 * provider. Never invoked from a browser-reachable path -- callers are
 * always server-side business logic (see lib/notifications/service.ts).
 */
export async function sendEmail(to: string, content: EmailContent): Promise<SendEmailResult> {
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Bombay Sweets";
  if (!fromAddress) {
    return { ok: false, error: "EMAIL_FROM_ADDRESS is not configured." };
  }

  try {
    const client = getResendClient();
    const result = await client.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, providerMessageId: result.data.id };
  } catch (error) {
    // Never include headers/request details here -- just enough to debug
    // without risking a leaked credential fragment in a stack trace.
    return { ok: false, error: error instanceof Error ? error.message : "Unknown email provider error." };
  }
}
