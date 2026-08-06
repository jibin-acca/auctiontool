/*
# Notifications table, player category column, and budget tracking column

## New Tables
- `notifications` — stores admin and owner notifications
  - `id` (uuid PK)
  - `tournament_id` (uuid FK → tournaments)
  - `recipient_role` (text: 'admin' | 'owner')
  - `recipient_id` (uuid, nullable — null means all admins)
  - `title` (text)
  - `body` (text, nullable)
  - `category` (text: 'info' | 'success' | 'warning' | 'error')
  - `is_read` (boolean, default false)
  - `created_at` (timestamptz)

## Modified Tables
- `players` — add `category` column (text, nullable) for player categorization
- `team_owners` — add `budget_spent` column (numeric, default 0) for auction budget tracking

## Security
- Notifications: admin CRUD (authenticated), owner can read/update their own
- Players: existing policies cover the new column
- Team owners: existing policies cover the new column
*/

-- ============================================================
-- 1. Notifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
  recipient_role text NOT NULL DEFAULT 'admin',
  recipient_id uuid,
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admin can do everything with notifications
DROP POLICY IF EXISTS admin_select_notifications ON notifications;
CREATE POLICY admin_select_notifications ON notifications FOR SELECT
  TO authenticated USING (recipient_role = 'admin');

DROP POLICY IF EXISTS admin_insert_notifications ON notifications;
CREATE POLICY admin_insert_notifications ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS admin_update_notifications ON notifications;
CREATE POLICY admin_update_notifications ON notifications FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_delete_notifications ON notifications;
CREATE POLICY admin_delete_notifications ON notifications FOR DELETE
  TO authenticated USING (true);

-- Owner can read and update (mark as read) their own notifications
-- Owners use anon key, so we allow anon to read owner notifications
DROP POLICY IF EXISTS owner_select_notifications ON notifications;
CREATE POLICY owner_select_notifications ON notifications FOR SELECT
  TO anon USING (recipient_role = 'owner');

DROP POLICY IF EXISTS owner_update_notifications ON notifications;
CREATE POLICY owner_update_notifications ON notifications FOR UPDATE
  TO anon USING (recipient_role = 'owner') WITH CHECK (recipient_role = 'owner');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_tournament ON notifications(tournament_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_role, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(tournament_id, recipient_role, is_read) WHERE (is_read = false);

-- ============================================================
-- 2. Players: add category column
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'category'
  ) THEN
    ALTER TABLE players ADD COLUMN category text;
  END IF;
END $$;

-- ============================================================
-- 3. Team owners: add budget_spent column
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'team_owners' AND column_name = 'budget_spent'
  ) THEN
    ALTER TABLE team_owners ADD COLUMN budget_spent numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Index for player category searches
CREATE INDEX IF NOT EXISTS idx_players_category ON players(tournament_id, category) WHERE category IS NOT NULL;
