-- Drop the old 3-argument version of register_team_owner to avoid ambiguity
DROP FUNCTION IF EXISTS register_team_owner(text, text, text);
