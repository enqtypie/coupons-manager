import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { query, execute } from "@/app/lib/db";

export type UserStatus = "pending" | "approved" | "rejected";
export type UserRole = "view" | "edit" | "admin";

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
  status: UserStatus;
  role: UserRole | null;
  created_at: string;
};

export type PublicUser = Omit<UserRow, "password_hash">;

const SESSION_COOKIE = "session_token";
const SESSION_DAYS = 30;

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    status: row.status,
    role: row.role,
    created_at: row.created_at,
  };
}

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", [
    token,
    userId,
    expiresAt,
  ]);
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await execute("DELETE FROM sessions WHERE token = ?", [token]);
}

export async function getUserByToken(token: string): Promise<UserRow | null> {
  const rows = await query<UserRow>(
    `SELECT users.* FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token = ? AND sessions.expires_at > NOW()`,
    [token]
  );
  return rows[0] ?? null;
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return getUserByToken(token);
}

/** Throws a Response-shaped error the caller should return directly. */
export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireApprovedUser(): Promise<UserRow> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Not signed in");
  if (user.status !== "approved") throw new AuthError(403, "Account not approved");
  return user;
}

export async function requireRole(roles: UserRole[]): Promise<UserRow> {
  const user = await requireApprovedUser();
  if (!user.role || !roles.includes(user.role)) {
    throw new AuthError(403, "Insufficient permissions");
  }
  return user;
}

/** Route handlers: `try { ... } catch (e) { return authErrorResponse(e); }` */
export function authErrorResponse(e: unknown): NextResponse {
  if (e instanceof AuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  throw e;
}
