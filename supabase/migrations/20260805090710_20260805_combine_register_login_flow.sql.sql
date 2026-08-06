-- ============================================================
-- Combined Register/Login: authenticate_team_owner function
-- If phone exists for the tournament → login (return existing owner)
-- If phone exists for a DIFFERENT tournament → error
-- If phone doesn't exist anywhere → register (create new owner)
-- ============================================================

CREATE OR REPLACE FUNCTION authenticate_team_owner(
  p_tournament_code text,
  p_phone text,
  p_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament tournaments%ROWTYPE;
  v_owner team_owners%ROWTYPE;
  v_existing_count int;
  v_color text;
  v_colors text[] := ARRAY['#3b82f6','#f59e0b','#10b981','#ef4444','#a855f7','#06b6d4','#ec4899','#84cc16'];
  v_new_id uuid;
  v_cross_tournament text;
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

  -- Check if phone already exists for THIS tournament
  SELECT * INTO v_owner FROM team_owners
    WHERE tournament_id = v_tournament.id AND phone = TRIM(p_phone)
    LIMIT 1;

  IF FOUND THEN
    -- LOGIN: phone exists for this tournament → authenticate existing owner
    RETURN jsonb_build_object(
      'success', true,
      'action', 'login',
      'team_owner_id', v_owner.id,
      'name', v_owner.name,
      'tournament_name', v_tournament.name,
      'tournament_season', v_tournament.season
    );
  END IF;

  -- Check if phone exists for a DIFFERENT tournament
  SELECT name INTO v_cross_tournament FROM tournaments t
    WHERE t.id IN (
      SELECT tournament_id FROM team_owners WHERE phone = TRIM(p_phone)
    )
    AND t.id != v_tournament.id
    LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'error',
      'This phone number is already registered for a different tournament (' || v_cross_tournament || '). Please use a different phone number or contact the administrator.'
    );
  END IF;

  -- REGISTER: phone doesn't exist for this tournament → create new owner
  -- For new registration, name is required
  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RETURN jsonb_build_object('error', 'Full name is required for new registrations.');
  END IF;

  -- Validate registration is open (only for new registrations)
  IF v_tournament.status != 'Registration Open' THEN
    RETURN jsonb_build_object('error', 'Registration is not open for this tournament. New registrations are not accepted at this time.');
  END IF;

  -- Validate registration window dates (if set)
  IF v_tournament.registration_start IS NOT NULL AND CURRENT_DATE < v_tournament.registration_start THEN
    RETURN jsonb_build_object('error', 'Registration has not opened yet. Please check the registration start date.');
  END IF;
  IF v_tournament.registration_end IS NOT NULL AND CURRENT_DATE > v_tournament.registration_end THEN
    RETURN jsonb_build_object('error', 'Registration has closed. The registration window has ended.');
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
    'action', 'register',
    'team_owner_id', v_new_id,
    'name', TRIM(p_name),
    'tournament_name', v_tournament.name,
    'tournament_season', v_tournament.season
  );
END;
$$;

GRANT EXECUTE ON FUNCTION authenticate_team_owner(text, text, text) TO anon, authenticated;
