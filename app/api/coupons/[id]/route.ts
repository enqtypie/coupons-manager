import { NextResponse } from "next/server";
import { execute } from "@/app/lib/db";
import { requireApprovedUser, authErrorResponse } from "@/app/lib/auth-server";
import { sweepExpiredCoupons } from "@/app/lib/coupons-sweep";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApprovedUser();
  } catch (e) {
    return authErrorResponse(e);
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  await execute(
    `UPDATE coupons SET
       date = ?, status = ?, source = ?, source_ref = ?, sender = ?, type = ?,
       promo_title = ?, code = ?, promo_link = ?, redemption_type = ?, start_date = ?,
       end_date = ?, participating_stores = ?, agent_handling = ?, agent_sign_off = ?,
       start_of_day_check = ?, calendar_invite_created = ?
     WHERE id = ?`,
    [
      body.date,
      body.status,
      body.source,
      body.sourceRef || null,
      body.sender,
      body.type,
      body.promoTitle,
      body.code,
      body.promoLink || null,
      body.redemptionType,
      body.startDate || null,
      body.endDate || null,
      body.participatingStores || null,
      body.agentHandling,
      body.agentSignOff || null,
      body.startOfDayCheck || null,
      body.calendarInviteCreated || null,
      id,
    ]
  );

  await sweepExpiredCoupons();

  return NextResponse.json({ ok: true });
}
