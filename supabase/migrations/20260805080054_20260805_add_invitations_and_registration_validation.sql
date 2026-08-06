/*
# Add manager_invitations table + registration window validation

1. Purpose
   The user spec requires that registration validates:
   - Invitation exists
   - Invitation active
   - Invitation not expired
   - Invitation unused
   - Tournament active
   - Registration window open
   - Phone unique

   Previously register_team_owner() only validated tournament code, status,
   phone uniqueness, and slot count. This migration adds:
   a) A manager_invitations table tracking per-manager invitations.
   b) Registration window date validation in register_team_owner().
   c) Optional invitation validation: if an invitation code is provided,
      the function validates it exists, is active, is unused, and is not
      expired. If no invitation code is provided, the tournament code alone
      is accepted (backward compatible with the existing tournament-code flow).
*/

-- ============================================================
-- MANAGER INVITATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS manager_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_owner_id uuid REFERENCES team_owners(id) ON DELETE SET NULL,
  invitation_code text NOT NULL UNIQUE,
  manager_name text,
  manager_phone text,
  status text NOT NULL DEFAULT 'Active',  -- Active | Used | Expired | Cancelled
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_tournament ON manager_invitations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON manager_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON manager_invitations(status);

-- ============================================================
-- RLS ON MANAGER INVITATIONS
-- ============================================================
ALTER TABLE manager_invitations ENABLE ROW LEVEL SECURITY;

-- Admin (authenticated) full CRUD
CREATE POLICY "admin_select_invitations" ON manager_invitations FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_invitations" ON manager_invitations FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "admin_update_invitations" ON manager_invitations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_invitations" ON manager_invitations FOR DELETE
  TO authenticated USING (true);

-- Public: can validate an invitation by code (SELECT only, for validation)
CREATE POLICY "public_select_invitations" ON manager_invitations FOR SELECT
  TO anon USING (true);

-- ============================================================
-- UPDATE register_team_owner FUNCTION
-- Add registration window validation + optional invitation validation
-- ============================================================
CREATE OR REPLACE FUNCTION register_team_owner(
  p_tournament_code text,
  p_name text,
  p_phone text,
  p_invitation_code text DEFAULT NULL
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
  v_invitation manager_invitations%ROWTYPE;
  v_today date := CURRENT_DATE;
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

  -- Validate registration is open (status check)
  IF v_tournament.status != 'Registration Open' THEN
    RETURN jsonb_build_object('error', 'Registration is not open for this tournament.');
  END IF;

  -- Validate registration window dates (if set)
  IF v_tournament.registration_start IS NOT NULL AND v_today < v_tournament.registration_start THEN
    RETURN jsonb_build_object('error', 'Registration has not opened yet. Please check the registration start date.');
  END IF;
  IF v_tournament.registration_end IS NOT NULL AND v_today > v_tournament.registration_end THEN
    RETURN jsonb_build_object('error', 'Registration has closed. The registration window has ended.');
  END IF;

  -- Validate invitation code (if provided)
  IF p_invitation_code IS NOT NULL AND TRIM(p_invitation_code) != '' THEN
    SELECT * INTO v_invitation FROM manager_invitations
      WHERE invitation_code = UPPER(TRIM(p_invitation_code))
      LIMIT 1;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Invalid invitation code. Please check your invitation link.');
    END IF;

    -- Validate invitation belongs to this tournament
    IF v_invitation.tournament_id != v_tournament.id THEN
      RETURN jsonb_build_object('error', 'This invitation is not for the specified tournament.');
    END IF;

    -- Validate invitation is active
    IF v_invitation.status != 'Active' THEN
      RETURN jsonb_build_object('error', 'This invitation is no longer active.');
    END IF;

    -- Validate invitation not expired
    IF v_invitation.expires_at IS NOT NULL AND now() > v_invitation.expires_at THEN
      RETURN jsonb_build_object('error', 'This invitation has expired. Please contact the tournament administrator.');
    END IF;

    -- Validate invitation unused
    IF v_invitation.team_owner_id IS NOT NULL OR v_invitation.used_at IS NOT NULL THEN
      RETURN jsonb_build_object('error', 'This invitation has already been used.');
    END IF;
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

  -- Mark invitation as used (if provided)
  IF p_invitation_code IS NOT NULL AND TRIM(p_invitation_code) != '' THEN
    UPDATE manager_invitations
    SET status = 'Used', used_at = now(), team_owner_id = v_new_id
    WHERE id = v_invitation.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'team_owner_id', v_new_id,
    'tournament_name', v_tournament.name,
    'tournament_season', v_tournament.season
  );
END;
$$;

-- Grant EXECUTE to anon and authenticated (re-grant since function signature changed)
GRANT EXECUTE ON FUNCTION register_team_owner(text, text, text, text) TO anon, authenticated;
