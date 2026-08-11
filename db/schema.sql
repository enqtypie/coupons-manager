-- Run this in MySQL Workbench against your local server to set up the database.
-- File > Open SQL Script > run (the lightning bolt icon), or paste into a new query tab.

CREATE DATABASE IF NOT EXISTS coupons_manager
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE coupons_manager;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  role ENUM('view', 'edit', 'admin') NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(64) PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  status ENUM('Active', 'Inactive') NOT NULL,
  source ENUM('Email', 'Slack', 'Zendesk', 'Basecamp') NOT NULL,
  source_ref VARCHAR(255) NULL,
  sender VARCHAR(255) NOT NULL,
  type ENUM('Discount', 'Hot Deals') NOT NULL,
  promo_title VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  promo_link VARCHAR(500) NULL,
  redemption_type ENUM('Multi', 'Single') NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  participating_stores TEXT NULL,
  agent_handling ENUM('Mark', 'Noli') NOT NULL,
  agent_sign_off VARCHAR(255) NULL,
  start_of_day_check DATE NULL,
  calendar_invite_created BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coupons_status (status),
  INDEX idx_coupons_created_at (created_at)
);

-- Quarterly Hot Deals: each CSV import creates one named batch (e.g. "Q3 Hot
-- Deals"). Deal columns vary quarter to quarter, so they're stored as rows
-- rather than fixed columns; per-store band values live in a JSON blob since
-- which deals apply also varies per batch.
CREATE TABLE IF NOT EXISTS hot_deals_batches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hot_deals_deals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  position INT NOT NULL,
  kind ENUM('flat', 'band') NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES hot_deals_batches(id) ON DELETE CASCADE,
  INDEX idx_hot_deals_deals_batch (batch_id)
);

CREATE TABLE IF NOT EXISTS hot_deals_store_rows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_id INT NOT NULL,
  store_id VARCHAR(50) NOT NULL,
  expiration_date DATE NULL,
  band_values JSON NULL,
  FOREIGN KEY (batch_id) REFERENCES hot_deals_batches(id) ON DELETE CASCADE,
  INDEX idx_hot_deals_store_rows_batch (batch_id)
);

-- Manually-added dashboard reminders (separate from the auto-generated
-- sign-off/checklist/activation reminders, which are derived from coupons
-- on the fly and never stored).
CREATE TABLE IF NOT EXISTS manual_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text VARCHAR(255) NOT NULL,
  due_date DATE NULL,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- One-time bootstrap: after you sign up through the app once (so a users row
-- exists), promote yourself to an approved admin so you can approve everyone
-- else from the Settings page:
--
-- UPDATE users SET status = 'approved', role = 'admin' WHERE email = 'you@loke.com';
