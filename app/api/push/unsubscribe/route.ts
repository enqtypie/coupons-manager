import { NextResponse } from "next/server";
import { execute } from "@/app/lib/db";
import { requireApprovedUser, authErrorResponse } from "@/app/lib/auth-server";

export async function POST(request: Request) {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  await execute("DELETE FROM push_subscriptions WHERE endpoint = ?", [endpoint]);
  return NextResponse.json({ ok: true });
}
