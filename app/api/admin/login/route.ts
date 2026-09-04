import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { logAdminActivity } from "@/lib/auth/activityLog";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});

// A precomputed hash with no matching plaintext -- compared against on every
// "user not found" path so a login attempt for a nonexistent email takes
// roughly the same time as one for a real email with a wrong password.
// Without this, response timing itself would leak which emails exist.
const DUMMY_HASH = "$2b$12$Vj8lVbbA79R0GL90gtCFDuSoCkbeA5.06kseAe9m7ZP4Ku7dCFvUa";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid email or password." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const user = await prisma.adminUser.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      await bcrypt.compare(parsed.data.password, DUMMY_HASH);
      return NextResponse.json({ ok: false, message: "Invalid email or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, message: "Invalid email or password." }, { status: 401 });
    }

    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.role = user.role;
    session.firstName = user.firstName;
    session.lastName = user.lastName;
    await session.save();

    await logAdminActivity({ adminUserId: user.id, action: "LOGIN" });

    return NextResponse.json({ ok: true, role: user.role });
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ ok: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
