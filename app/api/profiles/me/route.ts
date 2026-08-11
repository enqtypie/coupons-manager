import { NextResponse } from "next/server";
import { execute } from "@/app/lib/db";
import { requireApprovedUser, authErrorResponse, toPublicUser } from "@/app/lib/auth-server";

export async function PATCH(request: Request) {
  let user;
  try {
    user = await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const body = await request.json().catch(() => null);
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() || null : null;

  await execute("UPDATE users SET display_name = ? WHERE id = ?", [displayName, user.id]);

  return NextResponse.json({ user: { ...toPublicUser(user), display_name: displayName } });
}
