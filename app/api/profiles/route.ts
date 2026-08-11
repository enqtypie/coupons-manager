import { NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { requireRole, authErrorResponse, type PublicUser } from "@/app/lib/auth-server";

export async function GET() {
  try {
    await requireRole(["admin"]);
  } catch (e) {
    return authErrorResponse(e);
  }

  const rows = await query<PublicUser>(
    "SELECT id, email, display_name, status, role, created_at FROM users ORDER BY created_at DESC"
  );
  return NextResponse.json({ profiles: rows });
}
