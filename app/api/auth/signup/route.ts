import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, execute } from "@/app/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || password.length < 6) {
    return NextResponse.json(
      { error: "A valid email and a password of at least 6 characters are required." },
      { status: 400 }
    );
  }

  const existing = await query<{ id: number }>("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await execute(
    "INSERT INTO users (email, password_hash, status, role) VALUES (?, ?, 'pending', NULL)",
    [email, passwordHash]
  );

  return NextResponse.json({ ok: true });
}
