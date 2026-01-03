-- Fix: RLS policies reference internal helper functions, but authenticated users lacked EXECUTE privilege.
-- Granting EXECUTE does NOT weaken RLS; it only allows policy evaluation.

GRANT EXECUTE ON FUNCTION public._internal_is_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._internal_is_team_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._internal_is_team_admin_or_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._internal_get_team_seat_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._internal_get_team_max_seats(uuid) TO authenticated;
