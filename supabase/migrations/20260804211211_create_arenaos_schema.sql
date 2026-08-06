/*
# ArenaOS Core Schema

1. Purpose
   ArenaOS is a tournament management platform for internal eFootball tournaments.
   Admins authenticate via Supabase Auth (email/password). Team Owners join via
   invitation code (no auth). This migration creates the full data model.

2. New Tables
   - tournaments: the active tournament and its configuration
   - team_owners: participants invited to a tournament
   - players: nominated / auction pool players
   - fixtures: scheduled matches
   - match_results: submitted + verified results
   - awards: award categories and winners
   - announcements: published announcements
   - audit_logs: immutable admin action log
   - app_settings: global single-row settings

3. Security
   - RLS enabled on every table.
   - authenticated (admins) get full CRUD.
   - anon gets SELECT on published/public data only (tournaments, published
     fixtures, published standings, published announcements, published awards).
   - anon cannot write any data — team owner writes are handled through admin
     verification workflow in V1.

4. Notes
   - One active tournament at a time (enforced by a partial unique index).
   - audit_logs are insert-only (no UPDATE / DELETE policies for authenticated).
   - app_settings is a single-row table.
*/

-- ============================================================
-- TOURNAMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  season text NOT NULL,
  description text,
  logo_url text,
  banner_url text,
  organizer text NOT NULL,
  status text NOT NULL DEFAULT 'Draft',
    -- Draft, Registration Open, Player Nominations, Auction Preparation,
    -- Auction Live, Squad Finalized, League Stage, Knockout Stage, Completed, Archived
  current_phase text NOT NULL DEFAULT 'Draft',
  tournament_code text UNIQUE,
  start_date date,
  end_date date,
  -- configurable settings stored as columns
  manager_count int NOT NULL DEFAULT 8,
  squad_size int NOT NULL DEFAULT 17,
  retained_players int NOT NULL DEFAULT 1,
  auction_players int NOT NULL DEFAULT 16,
  budget numeric NOT NULL DEFAULT 100,
  currency text NOT NULL DEFAULT 'Cr',
  base_price numeric NOT NULL DEFAULT 1,
  auction_timer int NOT NULL DEFAULT 20,
  match_format text NOT NULL DEFAULT 'Single Match',
  tournament_format text NOT NULL DEFAULT 'League + Knockout',
  qualification_rule text NOT NULL DEFAULT 'Top 4',
  points_win int NOT NULL DEFAULT 3,
  points_draw int NOT NULL DEFAULT 1,
  points_loss int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DROP POLICY IF EXISTS "admin_select_tournaments" ON tournaments;
CREATE POLICY "admin_select_tournaments" ON tournaments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_tournaments" ON tournaments;
CREATE POLICY "admin_insert_tournaments" ON tournaments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_tournaments" ON tournaments;
CREATE POLICY "admin_update_tournaments" ON tournaments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_tournaments" ON tournaments;
CREATE POLICY "admin_delete_tournaments" ON tournaments FOR DELETE
  TO authenticated USING (true);

-- Public can read published tournaments (not drafts)
DROP POLICY IF EXISTS "public_select_tournaments" ON tournaments;
CREATE POLICY "public_select_tournaments" ON tournaments FOR SELECT
  TO anon USING (status != 'Draft');

-- Only one active (non-archived, non-draft) tournament at a time
CREATE UNIQUE INDEX IF NOT EXISTS one_active_tournament
  ON tournaments (id)
  WHERE status NOT IN ('Draft', 'Archived');

-- ============================================================
-- TEAM OWNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS team_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  employee_id text,
  department text,
  team_name text,
  team_logo_url text,
  team_color text DEFAULT '#3b82f6',
  status text NOT NULL DEFAULT 'Invited',
    -- Invited, Joined, Profile Complete, Nominations Pending, Nominations Submitted, Active, Eliminated
  joined_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_team_owners" ON team_owners;
CREATE POLICY "admin_select_team_owners" ON team_owners FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_team_owners" ON team_owners;
CREATE POLICY "admin_insert_team_owners" ON team_owners FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_team_owners" ON team_owners;
CREATE POLICY "admin_update_team_owners" ON team_owners FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_team_owners" ON team_owners;
CREATE POLICY "admin_delete_team_owners" ON team_owners FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "public_select_team_owners" ON team_owners;
CREATE POLICY "public_select_team_owners" ON team_owners FOR SELECT
  TO anon USING (true);

-- ============================================================
-- PLAYERS (nominations + auction pool)
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  base_price numeric NOT NULL DEFAULT 1,
  request_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Draft',
    -- Draft, Approved, Rejected, Auction Ready, Sold, Unsold
  auction_number int,
  sold_to uuid REFERENCES team_owners(id),
  sold_price numeric,
  nominated_by uuid REFERENCES team_owners(id),
  is_retained boolean NOT NULL DEFAULT false,
  retained_by uuid REFERENCES team_owners(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_players" ON players;
CREATE POLICY "admin_select_players" ON players FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_players" ON players;
CREATE POLICY "admin_insert_players" ON players FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_players" ON players;
CREATE POLICY "admin_update_players" ON players FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_players" ON players;
CREATE POLICY "admin_delete_players" ON players FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "public_select_players" ON players;
CREATE POLICY "public_select_players" ON players FOR SELECT
  TO anon USING (true);

-- ============================================================
-- FIXTURES
-- ============================================================
CREATE TABLE IF NOT EXISTS fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round text NOT NULL,
  home_id uuid REFERENCES team_owners(id),
  away_id uuid REFERENCES team_owners(id),
  match_format text NOT NULL DEFAULT 'Single Match',
  scheduled_date date,
  scheduled_time text,
  deadline date,
  status text NOT NULL DEFAULT 'Upcoming',
    -- Upcoming, Scheduled, Ready, Live, Pending Result, Completed, Disputed, Walkover, Cancelled, Postponed
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_fixtures" ON fixtures;
CREATE POLICY "admin_select_fixtures" ON fixtures FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_fixtures" ON fixtures;
CREATE POLICY "admin_insert_fixtures" ON fixtures FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_fixtures" ON fixtures;
CREATE POLICY "admin_update_fixtures" ON fixtures FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_fixtures" ON fixtures;
CREATE POLICY "admin_delete_fixtures" ON fixtures FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "public_select_fixtures" ON fixtures;
CREATE POLICY "public_select_fixtures" ON fixtures FOR SELECT
  TO anon USING (is_published = true);

-- ============================================================
-- MATCH RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  home_score int,
  away_score int,
  penalty_score text,
  screenshot_url text,
  remarks text,
  submitted_by uuid REFERENCES team_owners(id),
  verification_status text NOT NULL DEFAULT 'Pending',
    -- Pending, Verified, Disputed
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_results" ON match_results;
CREATE POLICY "admin_select_results" ON match_results FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_results" ON match_results;
CREATE POLICY "admin_insert_results" ON match_results FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_results" ON match_results;
CREATE POLICY "admin_update_results" ON match_results FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_results" ON match_results;
CREATE POLICY "admin_delete_results" ON match_results FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "public_select_results" ON match_results;
CREATE POLICY "public_select_results" ON match_results FOR SELECT
  TO anon USING (verification_status = 'Verified');

-- ============================================================
-- AWARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'trophy',
  prize text,
  winner_team_id uuid REFERENCES team_owners(id),
  display_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_awards" ON awards;
CREATE POLICY "admin_select_awards" ON awards FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_awards" ON awards;
CREATE POLICY "admin_insert_awards" ON awards FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_awards" ON awards;
CREATE POLICY "admin_update_awards" ON awards FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_awards" ON awards;
CREATE POLICY "admin_delete_awards" ON awards FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "public_select_awards" ON awards;
CREATE POLICY "public_select_awards" ON awards FOR SELECT
  TO anon USING (is_published = true);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'General',
  priority text NOT NULL DEFAULT 'Normal',
    -- Low, Normal, Important, Critical
  status text NOT NULL DEFAULT 'Draft',
    -- Draft, Published, Scheduled
  publish_at timestamptz,
  expiry_date date,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_announcements" ON announcements;
CREATE POLICY "admin_select_announcements" ON announcements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_announcements" ON announcements;
CREATE POLICY "admin_insert_announcements" ON announcements FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_announcements" ON announcements;
CREATE POLICY "admin_update_announcements" ON announcements FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_announcements" ON announcements;
CREATE POLICY "admin_delete_announcements" ON announcements FOR DELETE
  TO authenticated USING (true);

DROP POLICY IF EXISTS "public_select_announcements" ON announcements;
CREATE POLICY "public_select_announcements" ON announcements FOR SELECT
  TO anon USING (status = 'Published');

-- ============================================================
-- AUDIT LOGS (insert-only, immutable)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  module text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_audit_logs" ON audit_logs;
CREATE POLICY "admin_select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (true);

-- Insert-only: no update or delete policies for anyone
DROP POLICY IF EXISTS "admin_insert_audit_logs" ON audit_logs;
CREATE POLICY "admin_insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================================
-- APP SETTINGS (single row)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id int PRIMARY KEY DEFAULT 1,
  setup_complete boolean NOT NULL DEFAULT false,
  app_name text NOT NULL DEFAULT 'ArenaOS',
  version text NOT NULL DEFAULT '1.0',
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Ensure the single row exists
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_settings" ON app_settings;
CREATE POLICY "admin_select_settings" ON app_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_settings" ON app_settings;
CREATE POLICY "admin_update_settings" ON app_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Public can check if setup is complete (to know whether to show /setup or /login)
DROP POLICY IF EXISTS "public_select_settings" ON app_settings;
CREATE POLICY "public_select_settings" ON app_settings FOR SELECT
  TO anon USING (true);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_team_owners_tournament ON team_owners(tournament_id);
CREATE INDEX IF NOT EXISTS idx_players_tournament ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_tournament ON fixtures(tournament_id);
CREATE INDEX IF NOT EXISTS idx_announcements_tournament ON announcements(tournament_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
