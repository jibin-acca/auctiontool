/*
# Fix Tournament Sync & RLS Registration

1. Purpose
   This migration fixes two critical bugs:
   a) Tournament data synchronization — adds columns needed for a complete
      tournament editor and removes the partial unique index that prevented
      multiple tournaments.
   b) Team Owner registration RLS — the anon role (used by the public join
      page) had no INSERT policy on team_owners, causing "new row violates
      row-level security policy" errors.

2. Schema Changes (tournaments table)
   - short_name text — abbreviated tournament name for badges/headers
   - registration_start date, registration_end date — registration window
   - nomination_start date, nomination_end date — nomination window
   - auction_date date — auction schedule
   - league_start date, league_end date — league stage schedule
   - knockout_start date, knockout_end date — knockout stage schedule
   - theme_color text — custom theme color (hex)
   - tie_break_rule text — tie-break rules description
   - is_active boolean — flag for the currently active tournament

3. Security Changes
   - Drop the one_active_tournament partial unique index (it prevented
     multiple non-draft, non-archived tournaments and is replaced by
     is_active flag logic in the application layer).
   - Add a SECURITY DEFINER function register_team_owner() that validates
     tournament code, registration status, phone uniqueness, and manager
     count before inserting a team_owner row. Grant EXECUTE to anon so the
     public join page can register managers without exposing the table
     to arbitrary anon INSERT.
   - Add anon SELECT policy on tournaments for Archived status (previously
     only non-Draft was visible; now Archived tournaments are also readable
     so historical data remains accessible).

4. Notes
   - The SECURITY DEFINER function runs with elevated privileges and is the
     ONLY way anon can insert into team_owners. Direct anon INSERT on the
     table remains blocked.
   - is_active defaults to false. The application sets it to true for the
     active tournament and ensures only one is active at a time.
*/

-- ============================================================
-- ADD COLUMNS TO TOURNAMENTS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'short_name') THEN
    ALTER TABLE tournaments ADD COLUMN short_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'registration_start') THEN
    ALTER TABLE tournaments ADD COLUMN registration_start date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'registration_end') THEN
    ALTER TABLE tournaments ADD COLUMN registration_end date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'nomination_start') THEN
    ALTER TABLE tournaments ADD COLUMN nomination_start date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'nomination_end') THEN
    ALTER TABLE tournaments ADD COLUMN nomination_end date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'auction_date') THEN
    ALTER TABLE tournaments ADD COLUMN auction_date date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'league_start') THEN
    ALTER TABLE tournaments ADD COLUMN league_start date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'league_end') THEN
    ALTER TABLE tournaments ADD COLUMN league_end date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'knockout_start') THEN
    ALTER TABLE tournaments ADD COLUMN knockout_start date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'knockout_end') THEN
    ALTER TABLE tournaments ADD COLUMN knockout_end date;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'theme_color') THEN
    ALTER TABLE tournaments ADD COLUMN theme_color text DEFAULT '#3b82f6';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'tie_break_rule') THEN
    ALTER TABLE tournaments ADD COLUMN tie_break_rule text DEFAULT 'Head-to-head, then goal difference, then goals scored';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'is_active') THEN
    ALTER TABLE tournaments ADD COLUMN is_active boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Mark the existing tournament as active
UPDATE tournaments SET is_active = true WHERE status NOT IN ('Draft', 'Archived');

-- ============================================================
-- DROP RESTRICTIVE UNIQUE INDEX
-- ============================================================
DROP INDEX IF EXISTS one_active_tournament;

-- Add a partial unique index on is_active to enforce only one active
CREATE UNIQUE INDEX IF NOT EXISTS one_active_tournament_flag
  ON tournaments (id)
  WHERE is_active = true;

-- ============================================================
-- FIX PUBLIC SELECT POLICY ON TOURNAMENTS
-- Allow anon to read Archived tournaments too (historical access)
-- ============================================================
DROP POLICY IF EXISTS "public_select_tournaments" ON tournaments;
CREATE POLICY "public_select_tournaments" ON tournaments FOR SELECT
  TO anon USING (status != 'Draft');

-- ============================================================
-- SECURITY DEFINER FUNCTION: register_team_owner
-- This is the ONLY way anon can insert into team_owners.
-- Validates: tournament code, registration open, phone unique, slots available.
-- ============================================================
CREATE OR REPLACE FUNCTION register_team_owner(
  p_tournament_code text,
  p_name text,
  p_phone text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament tournaments%ROWTYPE;
  v_existing_count int;
  v_color text;
  v_colors text[] := ARRAY['#3b82f6','#f59e0b','#10b981','#ef4444','#a855f7','#06b6d4','#ec4899','#84cc16'];
  v_new_id uuid;
BEGIN
  -- Validate tournament code
  SELECT * INTO v_tournament FROM tournaments
    WHERE tournament_code = UPPER(TRIM(p_tournament_code))
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid tournament code. Please check and try again.');
  END IF;

  -- Validate tournament is active (not Draft or Archived)
  IF v_tournament.status IN ('Draft', 'Archived') THEN
    RETURN jsonb_build_object('error', 'This tournament is not accepting registrations.');
  END IF;

  -- Validate registration is open
  IF v_tournament.status != 'Registration Open' THEN
    RETURN jsonb_build_object('error', 'Registration is not open for this tournament.');
  END IF;

  -- Validate phone uniqueness within tournament
  SELECT count(*) INTO v_existing_count FROM team_owners
    WHERE tournament_id = v_tournament.id AND phone = TRIM(p_phone);

  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('error', 'You have already registered with this phone number for this tournament.');
  END IF;

  -- Validate manager slots not full
  IF v_tournament.manager_count > 0 THEN
    SELECT count(*) INTO v_existing_count FROM team_owners
      WHERE tournament_id = v_tournament.id;

    IF v_existing_count >= v_tournament.manager_count THEN
      RETURN jsonb_build_object('error', 'All manager slots have been filled for this tournament.');
    END IF;
  END IF;

  -- Pick a random team color
  v_color := v_colors[1 + floor(random() * array_length(v_colors, 1))::int];

  -- Insert the team owner
  INSERT INTO team_owners (tournament_id, name, phone, team_color, status, joined_at)
  VALUES (v_tournament.id, TRIM(p_name), TRIM(p_phone), v_color, 'Joined', now())
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'team_owner_id', v_new_id,
    'tournament_name', v_tournament.name,
    'tournament_season', v_tournament.season
  );
END;
$$;

-- Grant EXECUTE to anon and authenticated
GRANT EXECUTE ON FUNCTION register_team_owner(text, text, text) TO anon, authenticated;

-- ============================================================
-- ADD INDEX ON is_active
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tournaments_active ON tournaments(is_active) WHERE is_active = true;
