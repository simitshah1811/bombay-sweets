/**
 * Interactive, local-only script to create or update a Bombay Sweets admin
 * account. Run this yourself in your own terminal:
 *
 *   npm run create-admin
 *
 * Nobody else ever sees the password you type here -- it's hashed locally
 * with bcrypt and only the hash is written to the database. This
 * deliberately does NOT go through any deployed API route or Server
 * Action: creating the very first OWNER account can't depend on already
 * having an authenticated admin session to call one.
 *
 * Uses its own raw Prisma client (not lib/db.ts) so it can run standalone
 * via `tsx` outside the Next.js build pipeline, where "server-only"-tagged
 * imports aren't available.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type AdminRole } from "../lib/generated/prisma/client";

const ROLES: AdminRole[] = ["OWNER", "MANAGER", "STAFF"];

const KEY_ENTER = "\r";
const KEY_NEWLINE = "\n";
const KEY_CTRL_C = "";
const KEY_CTRL_D = "";
const KEY_BACKSPACE_DEL = "";
const KEY_BACKSPACE_BS = "\b";

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return rl.question(question).then((answer) => answer.trim());
}

// Reads a line with the input masked as asterisks, so a password never
// echoes to the terminal in plain text.
async function askPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(question);
    const chars: string[] = [];

    const onData = (buffer: Buffer) => {
      const char = buffer.toString("utf8");

      if (char === KEY_NEWLINE || char === KEY_ENTER || char === KEY_CTRL_D) {
        stdin.setRawMode?.(false);
        stdin.removeListener("data", onData);
        stdin.pause();
        stdout.write("\n");
        resolve(chars.join(""));
        return;
      }

      if (char === KEY_CTRL_C) {
        stdout.write("\n");
        process.exit(1);
      }

      if (char === KEY_BACKSPACE_DEL || char === KEY_BACKSPACE_BS) {
        if (chars.length > 0) {
          chars.pop();
          stdout.write("\b \b");
        }
        return;
      }

      chars.push(char);
      stdout.write("*");
    };

    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function main() {
  console.log("Bombay Sweets — Create/Update Admin Account");
  console.log("This runs entirely on your own machine. Nothing you type is sent anywhere but your database.\n");

  const rl = createInterface({ input: stdin, output: stdout });

  const email = (await ask(rl, "Email: ")).toLowerCase();
  if (!isValidEmail(email)) {
    console.error("That doesn't look like a valid email address. Aborting.");
    rl.close();
    process.exit(1);
  }

  const firstName = await ask(rl, "First name: ");
  const lastName = await ask(rl, "Last name: ");

  let role: string;
  do {
    role = (await ask(rl, `Role (${ROLES.join(" / ")}): `)).toUpperCase();
  } while (!ROLES.includes(role as AdminRole));

  rl.close();

  let password = await askPassword("Password (min 12 characters): ");
  while (password.length < 12) {
    console.log("Password must be at least 12 characters.");
    password = await askPassword("Password (min 12 characters): ");
  }
  const confirm = await askPassword("Confirm password: ");
  if (confirm !== password) {
    console.error("Passwords didn't match. Aborting -- nothing was changed.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await prisma.adminUser.findUnique({ where: { email } });

    const user = await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash, firstName, lastName, role: role as AdminRole, isActive: true },
      create: { email, passwordHash, firstName, lastName, role: role as AdminRole, isActive: true },
    });

    console.log(
      existing
        ? `\nUpdated existing account: ${user.email} (${user.role})`
        : `\nCreated new account: ${user.email} (${user.role})`
    );
    console.log("You can sign in at /admin/login now.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Something went wrong:", error);
  process.exit(1);
});
