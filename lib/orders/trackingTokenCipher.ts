import "server-only";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

/**
 * Phase 10.1: makes the customer tracking token recoverable server-side
 * (for building notification links autonomously, days after order
 * creation) WITHOUT storing it in plaintext. This is the only place in the
 * codebase that encrypts or decrypts a tracking token -- every caller
 * (order creation, the notification service) goes through here.
 *
 * This is NOT an authentication mechanism. Order.trackingTokenHash (see
 * lib/orders/trackingToken.ts) remains the sole thing the tracking page's
 * access check compares against. Encryption here exists purely so a
 * legitimate server-side process can reconstruct a working tracking URL
 * without needing the customer to present the token again.
 *
 * AES-256-GCM: authenticated encryption, so a tampered or corrupted
 * ciphertext fails loudly (decipher.final() throws) rather than silently
 * returning garbage. Key is 32 random bytes, base64-encoded, read only from
 * TRACKING_TOKEN_ENCRYPTION_KEY -- never derived from any other value in
 * this system, never logged, never returned from any API.
 */
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // NIST-recommended nonce size for GCM

function getEncryptionKey(): Buffer {
  const raw = process.env.TRACKING_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("TRACKING_TOKEN_ENCRYPTION_KEY is missing.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("TRACKING_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256).");
  }
  return key;
}

/** Returns "<iv>.<ciphertext>.<authTag>", all base64. */
export function encryptTrackingToken(token: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), ciphertext.toString("base64"), authTag.toString("base64")].join(".");
}

/** Throws if the value is malformed, was encrypted under a different key, or has been tampered with. */
export function decryptTrackingToken(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted tracking token.");
  }
  const [ivB64, ciphertextB64, authTagB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
