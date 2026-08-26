import { NextResponse } from "next/server";
import { query, execute } from "@/app/lib/db";
import { sendPush, type PushSubscriptionRow, type PushPayload } from "@/app/lib/push";

// This route reads the Authorization header off the raw Request object
// (not next/headers' cookies()/headers()), which doesn't count as one of the
// signals Next.js uses to opt a GET route handler into per-request dynamic
// execution — without this, it can get statically cached at build time and
// keep serving that same frozen response to every request afterward.
export const dynamic = "force-dynamic";

type CouponHit = { id: number; code: string; promo_title: string };
type NotificationKind = "activation_soon" | "activation" | "deactivation_soon" | "deactivation";

const MESSAGES: Record<NotificationKind, (c: CouponHit) => Omit<PushPayload, "url">> = {
  activation_soon: (c) => ({
    title: `Activating tomorrow: ${c.code}`,
    body: `${c.promo_title} goes live tomorrow.`,
  }),
  activation: (c) => ({
    title: `Now active: ${c.code}`,
    body: `${c.promo_title} is live today.`,
  }),
  deactivation_soon: (c) => ({
    title: `Deactivating tomorrow: ${c.code}`,
    body: `${c.promo_title} ends tomorrow.`,
  }),
  deactivation: (c) => ({
    title: `Deactivated: ${c.code}`,
    body: `${c.promo_title} has ended today.`,
  }),
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// Triggered daily by Vercel Cron (see vercel.json). Checks which coupons are
// activating/deactivating today or tomorrow and pushes a notification to
// every approved user's subscribed devices — at most once per coupon+kind
// per day, even if this ever runs twice.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    // TEMPORARY DEBUG — never reveals the actual secret, only whether Vercel
    // sees it and how the two lengths compare. Remove once CRON_SECRET is
    // confirmed working.
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    return NextResponse.json(
      {
        error: "Unauthorized",
        debug: {
          envVarPresent: Boolean(secret),
          envVarLength: secret?.length ?? 0,
          receivedHeader: Boolean(authHeader),
          receivedHeaderLength: authHeader?.length ?? 0,
        },
      },
      { status: 401 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);

  const [activationSoon, activation, deactivationSoon, deactivation] = await Promise.all([
    query<CouponHit>("SELECT id, code, promo_title FROM coupons WHERE status = 'Active' AND start_date = ?", [tomorrow]),
    query<CouponHit>("SELECT id, code, promo_title FROM coupons WHERE status = 'Active' AND start_date = ?", [today]),
    query<CouponHit>("SELECT id, code, promo_title FROM coupons WHERE end_date = ?", [tomorrow]),
    query<CouponHit>("SELECT id, code, promo_title FROM coupons WHERE end_date = ?", [today]),
  ]);

  const candidates: { kind: NotificationKind; coupon: CouponHit }[] = [
    ...activationSoon.map((coupon) => ({ kind: "activation_soon" as const, coupon })),
    ...activation.map((coupon) => ({ kind: "activation" as const, coupon })),
    ...deactivationSoon.map((coupon) => ({ kind: "deactivation_soon" as const, coupon })),
    ...deactivation.map((coupon) => ({ kind: "deactivation" as const, coupon })),
  ];

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, notifications: 0, sent: 0 });
  }

  // Atomically claim each coupon+kind+day so a second run today can't
  // re-notify — ON CONFLICT DO NOTHING means insertId is 0 for anything
  // already claimed.
  const toSend: typeof candidates = [];
  for (const c of candidates) {
    const result = await execute(
      `INSERT INTO sent_coupon_notifications (coupon_id, kind, sent_date) VALUES (?, ?, ?)
       ON CONFLICT (coupon_id, kind, sent_date) DO NOTHING
       RETURNING id`,
      [c.coupon.id, c.kind, today]
    );
    if (result.insertId) toSend.push(c);
  }

  if (toSend.length === 0) {
    return NextResponse.json({ ok: true, notifications: 0, sent: 0, note: "Already sent today." });
  }

  const subs = await query<PushSubscriptionRow>(
    `SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh, ps.auth
     FROM push_subscriptions ps
     JOIN users u ON u.id = ps.user_id
     WHERE u.status = 'approved'`
  );

  let sentCount = 0;
  const expiredIds: number[] = [];

  for (const item of toSend) {
    const payload: PushPayload = { ...MESSAGES[item.kind](item.coupon), url: "/coupons-tracker" };
    const results = await Promise.all(subs.map((sub) => sendPush(sub, payload)));
    results.forEach((result, i) => {
      if (result === "sent") sentCount++;
      if (result === "expired") expiredIds.push(subs[i].id);
    });
  }

  if (expiredIds.length > 0) {
    const placeholders = expiredIds.map(() => "?").join(", ");
    await execute(`DELETE FROM push_subscriptions WHERE id IN (${placeholders})`, expiredIds);
  }

  return NextResponse.json({
    ok: true,
    notifications: toSend.length,
    subscriptions: subs.length,
    sent: sentCount,
    expiredRemoved: expiredIds.length,
  });
}
