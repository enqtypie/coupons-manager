import { NextResponse } from "next/server";
import { execute } from "@/app/lib/db";
import { requireRole, authErrorResponse } from "@/app/lib/auth-server";

const ROLES = ["view", "edit", "admin"] as const;
const STATUSES = ["pending", "approved", "rejected"] as const;

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireRole(["admin"]);
  } catch (e) {
    return authErrorResponse(e);
  }

  const { id } = await ctx.params;
  if (String(admin.id) === id) {
    return NextResponse.json({ error: "You can't change your own access." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const sets: string[] = [];
  const params: unknown[] = [];

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    sets.push("status = ?");
    params.push(body.status);
  }

  if (body.role !== undefined) {
    if (body.role !== null && !ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    sets.push("role = ?");
    params.push(body.role);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  params.push(id);
  await execute(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, params);

  return NextResponse.json({ ok: true });
}
