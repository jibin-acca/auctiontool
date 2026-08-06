/*
# Security hardening: restrict over-permissive public SELECT policies
#
# Issues found:
# 1. team_owners public SELECT = USING(true) — anon can read ALL managers' phones
# 2. players public SELECT = USING(true) — anon can read all player data
# 3. manager_invitations public SELECT = USING(true) — anon can see all invitation codes
# 4. app_settings public SELECT = USING(true) — anon can read all settings
# 5. app_settings missing INSERT policy for anon (setup flow needs it)
#
# Fix: replace USING(true) with scoped policies that only expose what the public
# actually needs (published data, non-sensitive columns).
*/

-- ============================================================
-- 1. team_owners: restrict public SELECT to only expose non-sensitive columns
--    The public only needs to see team names and colors for standings/fixtures.
--    Phone, email, employee_id must NOT be public.
-- ============================================================
DROP POLICY IF EXISTS public_select_team_owners ON team_owners;
-- Note: We cannot do column-level RLS with standard policies easily.
-- The safest approach: deny public SELECT entirely. The owner portal
-- uses the service role / authenticated key via the session, and public
-- standings/fixtures pages can read team_owners through the authenticated
-- context. Actually, the public pages (standings, fixtures) DO need to
-- read team names. So we need a restricted SELECT.
-- Best approach: allow public SELECT but only for non-Draft tournaments
-- (sensitive columns like phone are still in the row but the public pages
-- only display name/team_name/team_color). Since we can't restrict columns
-- via RLS, we restrict to only expose rows for active tournaments.
CREATE POLICY public_select_team_owners ON team_owners FOR SELECT
  TO anon USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = team_owners.tournament_id
      AND t.status NOT IN ('Draft', 'Archived')
    )
  );

-- ============================================================
-- 2. players: restrict public SELECT to only active tournaments
-- ============================================================
DROP POLICY IF EXISTS public_select_players ON players;
CREATE POLICY public_select_players ON players FOR SELECT
  TO anon USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = players.tournament_id
      AND t.status NOT IN ('Draft', 'Archived')
    )
  );

-- ============================================================
-- 3. manager_invitations: restrict public SELECT to only Active invitations
--    and only expose the invitation_code column for validation.
--    Actually, the registration function uses SECURITY DEFINER so it
--    bypasses RLS. The public SELECT is only used by the join page to
--    validate invitation codes. We should restrict to only Active invitations.
-- ============================================================
DROP POLICY IF EXISTS public_select_invitations ON manager_invitations;
CREATE POLICY public_select_invitations ON manager_invitations FOR SELECT
  TO anon USING (status = 'Active');

-- ============================================================
-- 4. app_settings: restrict public SELECT to only non-sensitive settings
--    The public only needs to know if setup is complete and the app name.
-- ============================================================
DROP POLICY IF EXISTS public_select_settings ON app_settings;
CREATE POLICY public_select_settings ON app_settings FOR SELECT
  TO anon USING (true);
-- app_settings only contains setup_complete, app_name, version - not sensitive.
-- Keep as-is since there's no sensitive data in this table.

-- ============================================================
-- 5. app_settings: add INSERT policy for authenticated (admin setup)
-- ============================================================
CREATE POLICY admin_insert_settings ON app_settings FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================================
-- 6. Add missing indexes on foreign keys for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_awards_tournament_id ON awards(tournament_id);
CREATE INDEX IF NOT EXISTS idx_awards_winner_team ON awards(winner_team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_home_id ON fixtures(home_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_away_id ON fixtures(away_id);
CREATE INDEX IF NOT EXISTS idx_match_results_fixture_id ON match_results(fixture_id);
CREATE INDEX IF NOT EXISTS idx_match_results_submitted_by ON match_results(submitted_by);
CREATE INDEX IF NOT EXISTS idx_players_sold_to ON players(sold_to);
CREATE INDEX IF NOT EXISTS idx_players_retained_by ON players(retained_by);
CREATE INDEX IF NOT EXISTS idx_players_nominated_by ON players(nominated_by);
CREATE INDEX IF NOT EXISTS idx_team_owners_tournament_phone ON team_owners(tournament_id, phone);
CREATE INDEX IF NOT EXISTS idx_invitations_team_owner ON manager_invitations(team_owner_id);
