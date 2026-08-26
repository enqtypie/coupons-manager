// Supabase Edge Function — checks which coupons are activating/deactivating
// today or tomorrow and pushes a notification to every approved user's
// subscribed devices. Deploy with:
//
//   supabase functions deploy notify-coupons --no-verify-jwt
//
// --no-verify-jwt is required: this is called by pg_cron with our own
// CRON_SECRET bearer token, not a Supabase-issued JWT, so the platform's
// default JWT check would reject it before our code even runs.
//
// Secrets needed (set via `supabase secrets set KEY=value`):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are already available in every
// Edge Function automatically — no need to set those yourself.
//
// Schedule it with pg_cron — see the SQL block at the bottom of
// db/schema.sql.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

type CouponHit = { id: string; code: string; promo_title: string }; // id is a uuid
type NotificationKind = "activation_soon" | "activation" | "deactivation_soon" | "deactivation";

type PushSubscriptionRow = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const MESSAGES: Record<NotificationKind, (c: CouponHit) => { title: string; body: string }> = {
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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";
  if (!vapidPublicKey || !vapidPrivateKey) {
    return json({ error: "VAPID keys are not configured." }, 500);
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);

  async function findCoupons(filter: Record<string, string>): Promise<CouponHit[]> {
    const { data, error } = await supabase.from("coupons").select("id, code, promo_title").match(filter);
    if (error) throw error;
    return (data ?? []) as CouponHit[];
  }

  const [activationSoon, activation, deactivationSoon, deactivation] = await Promise.all([
    findCoupons({ status: "Active", start_date: tomorrow }),
    findCoupons({ status: "Active", start_date: today }),
    findCoupons({ end_date: tomorrow }),
    findCoupons({ end_date: today }),
  ]);

  const candidates: { kind: NotificationKind; coupon: CouponHit }[] = [
    ...activationSoon.map((coupon) => ({ kind: "activation_soon" as const, coupon })),
    ...activation.map((coupon) => ({ kind: "activation" as const, coupon })),
    ...deactivationSoon.map((coupon) => ({ kind: "deactivation_soon" as const, coupon })),
    ...deactivation.map((coupon) => ({ kind: "deactivation" as const, coupon })),
  ];

  if (candidates.length === 0) {
    return json({ ok: true, notifications: 0, sent: 0 });
  }

  // Atomically claim each coupon+kind+day so a second run today can't
  // re-notify — a unique-constraint conflict means it's already claimed.
  const toSend: typeof candidates = [];
  for (const c of candidates) {
    const { data, error } = await supabase
      .from("sent_coupon_notifications")
      .insert({ coupon_id: c.coupon.id, kind: c.kind, sent_date: today })
      .select("id");
    if (error) {
      if (error.code === "23505") continue; // already sent today
      throw error;
    }
    if (data && data.length > 0) toSend.push(c);
  }

  if (toSend.length === 0) {
    return json({ ok: true, notifications: 0, sent: 0, note: "Already sent today." });
  }

  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, users!inner(status)")
    .eq("users.status", "approved");
  if (subsError) throw subsError;

  const subscriptions = (subs ?? []) as unknown as PushSubscriptionRow[];

  let sentCount = 0;
  const expiredIds: number[] = [];

  for (const item of toSend) {
    const payload = JSON.stringify({ ...MESSAGES[item.kind](item.coupon), url: "/coupons-tracker" });
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sentCount++;
        } catch (e) {
          const statusCode = (e as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            expiredIds.push(sub.id);
          } else {
            console.error("Push send failed:", e);
          }
        }
      })
    );
  }

  if (expiredIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return json({
    ok: true,
    notifications: toSend.length,
    subscriptions: subscriptions.length,
    sent: sentCount,
    expiredRemoved: expiredIds.length,
  });
});
