-- ============================================================
-- Single authoritative tournament phase field
-- current_phase is the source of truth; status is derived from it
-- ============================================================

-- 1. Sync function: set_tournament_phase(p_tournament_id, p_new_phase)
--    Atomically updates current_phase AND derives status
CREATE OR REPLACE FUNCTION set_tournament_phase(
  p_tournament_id uuid,
  p_new_phase text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament tournaments%ROWTYPE;
  v_new_status text;
  v_phase_order text[] := ARRAY['Draft','Registration','Player Nominations','Auction Preparation','Auction Live','Squad Finalized','League Stage','Knockout Stage','Completed'];
  v_old_index int;
  v_new_index int;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = p_tournament_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found.');
  END IF;

  -- Validate the new phase is a known phase
  v_new_index := array_position(v_phase_order, p_new_phase);
  IF v_new_index IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid phase: ' || p_new_phase);
  END IF;

  v_old_index := array_position(v_phase_order, v_tournament.current_phase);

  -- Derive status from phase
  v_new_status := CASE p_new_phase
    WHEN 'Draft' THEN 'Draft'
    WHEN 'Registration' THEN 'Registration Open'
    WHEN 'Player Nominations' THEN 'Player Nominations'
    WHEN 'Auction Preparation' THEN 'Auction Preparation'
    WHEN 'Auction Live' THEN 'Auction Live'
    WHEN 'Squad Finalized' THEN 'Squad Finalized'
    WHEN 'League Stage' THEN 'League Stage'
    WHEN 'Knockout Stage' THEN 'Knockout Stage'
    WHEN 'Completed' THEN 'Completed'
  END;

  -- Update the tournament
  UPDATE tournaments
    SET current_phase = p_new_phase,
        status = v_new_status,
        updated_at = now()
    WHERE id = p_tournament_id;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'previous_phase', v_tournament.current_phase,
    'new_phase', p_new_phase,
    'new_status', v_new_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION set_tournament_phase(uuid, text) TO anon, authenticated;

-- 2. Trigger to keep status in sync with current_phase on any direct UPDATE
CREATE OR REPLACE FUNCTION sync_tournament_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync if current_phase changed and status wasn't explicitly set to Archived
  IF NEW.current_phase IS DISTINCT FROM OLD.current_phase AND NEW.status != 'Archived' THEN
    NEW.status := CASE NEW.current_phase
      WHEN 'Draft' THEN 'Draft'
      WHEN 'Registration' THEN 'Registration Open'
      WHEN 'Player Nominations' THEN 'Player Nominations'
      WHEN 'Auction Preparation' THEN 'Auction Preparation'
      WHEN 'Auction Live' THEN 'Auction Live'
      WHEN 'Squad Finalized' THEN 'Squad Finalized'
      WHEN 'League Stage' THEN 'League Stage'
      WHEN 'Knockout Stage' THEN 'Knockout Stage'
      WHEN 'Completed' THEN 'Completed'
      ELSE NEW.status
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_tournament_status ON tournaments;
CREATE TRIGGER trigger_sync_tournament_status
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION sync_tournament_status();

-- 3. Backfill: sync any existing tournaments where status != derived status
UPDATE tournaments SET status = CASE current_phase
    WHEN 'Draft' THEN 'Draft'
    WHEN 'Registration' THEN 'Registration Open'
    WHEN 'Player Nominations' THEN 'Player Nominations'
    WHEN 'Auction Preparation' THEN 'Auction Preparation'
    WHEN 'Auction Live' THEN 'Auction Live'
    WHEN 'Squad Finalized' THEN 'Squad Finalized'
    WHEN 'League Stage' THEN 'League Stage'
    WHEN 'Knockout Stage' THEN 'Knockout Stage'
    WHEN 'Completed' THEN 'Completed'
    ELSE status
  END
  WHERE status != 'Archived';
