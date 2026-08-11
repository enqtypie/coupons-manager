import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/app/lib/db";
import { createSession, setSessionCookie, toPublicUser, type UserRow } from "@/app/lib/auth-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const rows = await query<UserRow>("SELECT * FROM users WHERE email = ?", [email]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ user: toPublicUser(user) });
}
