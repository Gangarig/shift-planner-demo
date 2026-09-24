-- These tables were added after the original grant-hardening migration.
-- Keep only the operations the frontend actually uses; RLS remains the
-- row-level authorization layer for each permitted operation.
revoke truncate, references, trigger on table public.daily_notes from authenticated;
revoke truncate, references, trigger on table public.worker_absences from authenticated;

grant select, insert, update, delete on table public.daily_notes to authenticated;
grant select, insert, update, delete on table public.worker_absences to authenticated;
