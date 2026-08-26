-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query) against
-- your Supabase Postgres database, or against any Postgres instance.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role TEXT NULL CHECK (role IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  -- UUID, not SERIAL — matches the table as it actually exists in production
  -- (left over from the very first Supabase integration, before this file's
  -- other tables existed). Kept this way rather than converting so existing
  -- data and every other table's assumptions stay correct.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive')),
  source TEXT NOT NULL CHECK (source IN ('Email', 'Slack', 'Zendesk', 'Basecamp')),
  source_ref VARCHAR(255) NULL,
  sender VARCHAR(255) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('LOKE Discount', 'Hot Deals')),
  promo_title VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  promo_link VARCHAR(500) NULL,
  redemption_type TEXT NOT NULL CHECK (redemption_type IN ('Multi', 'Single')),
  start_date DATE NULL,
  end_date DATE NULL,
  participating_stores TEXT NULL,
  agent_handling TEXT NOT NULL CHECK (agent_handling IN ('Mark', 'Noli')),
  agent_sign_off VARCHAR(255) NULL,
  start_of_day_check DATE NULL,
  calendar_invite_created DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons (status);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON coupons (created_at);

-- Quarterly Hot Deals: each CSV import creates one named batch (e.g. "Q3 Hot
-- Deals"). Deal columns vary quarter to quarter, so they're stored as rows
-- rather than fixed columns; per-store band values live in a JSON blob since
-- which deals apply also varies per batch.
CREATE TABLE IF NOT EXISTS hot_deals_batches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hot_deals_deals (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES hot_deals_batches(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('flat', 'band')),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hot_deals_deals_batch ON hot_deals_deals (batch_id);

CREATE TABLE IF NOT EXISTS hot_deals_store_rows (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES hot_deals_batches(id) ON DELETE CASCADE,
  store_id VARCHAR(50) NOT NULL,
  expiration_date DATE NULL,
  band_values JSONB NULL
);
CREATE INDEX IF NOT EXISTS idx_hot_deals_store_rows_batch ON hot_deals_store_rows (batch_id);

-- Manually-added dashboard reminders (separate from the auto-generated
-- sign-off/checklist reminders, which are derived from coupons on the fly
-- and never stored).
CREATE TABLE IF NOT EXISTS manual_reminders (
  id SERIAL PRIMARY KEY,
  text VARCHAR(255) NOT NULL,
  due_date DATE NULL,
  created_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Push notifications: one row per subscribed browser/device (a user can have
-- several — laptop, phone, etc). endpoint is the push service URL the
-- browser gave us; p256dh/auth are the keys web-push needs to encrypt the
-- payload for that specific subscription.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions (user_id);

-- Tracks which activation/deactivation notifications have already gone out
-- so the daily cron run never double-sends if it's ever triggered twice in
-- one day.
CREATE TABLE IF NOT EXISTS sent_coupon_notifications (
  id SERIAL PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('activation_soon', 'activation', 'deactivation_soon', 'deactivation')),
  sent_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, kind, sent_date)
);

-- One-time bootstrap: after you sign up through the app once (so a users row
-- exists), promote yourself to an approved admin so you can approve everyone
-- else from the Settings page:
--
-- UPDATE users SET status = 'approved', role = 'admin' WHERE email = 'you@loke.com';

-- Migration: if your coupons table already exists with calendar_invite_created
-- as a BOOLEAN, run this once to switch it to a DATE (existing true/false
-- values are dropped since there's no date to recover them from):
--
-- ALTER TABLE coupons
--   ALTER COLUMN calendar_invite_created DROP DEFAULT,
--   ALTER COLUMN calendar_invite_created DROP NOT NULL,
--   ALTER COLUMN calendar_invite_created TYPE DATE USING NULL;

-- Migration: "Discount" was renamed to "LOKE Discount". Run this once against
-- an existing database to relabel existing rows and update the constraint
-- (check \d coupons in the SQL Editor if the constraint name differs):
--
-- UPDATE coupons SET type = 'LOKE Discount' WHERE type = 'Discount';
-- ALTER TABLE coupons DROP CONSTRAINT coupons_type_check;
-- ALTER TABLE coupons ADD CONSTRAINT coupons_type_check CHECK (type IN ('LOKE Discount', 'Hot Deals'));

-- Schedules the notify-coupons Edge Function to run daily. Run this ONCE,
-- AFTER deploying the function (`supabase functions deploy notify-coupons
-- --no-verify-jwt`) — replace <CRON_SECRET> below with the same value you
-- set via `supabase secrets set CRON_SECRET=...`. Adjust the '0 13 * * *'
-- schedule (UTC) if 13:00 UTC (~8-9am US Eastern) isn't the right time for
-- your team.
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- SELECT cron.schedule(
--   'notify-coupons-daily',
--   '0 13 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://owcbibukjljezdyqvnyi.supabase.co/functions/v1/notify-coupons',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer <CRON_SECRET>',
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- To check it's registered: SELECT * FROM cron.job;
-- To remove it later:       SELECT cron.unschedule('notify-coupons-daily');
