import { NextResponse } from "next/server";
import { execute } from "@/app/lib/db";
import { requireApprovedUser, authErrorResponse } from "@/app/lib/auth-server";

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const { id } = await ctx.params;
  await execute("DELETE FROM manual_reminders WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
