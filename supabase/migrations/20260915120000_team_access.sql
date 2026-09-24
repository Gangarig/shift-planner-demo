alter table public.profiles
  add column if not exists worker_id uuid references public.workers(id) on delete set null;

create unique index if not exists profiles_worker_id_key
  on public.profiles (worker_id)
  where worker_id is not null;

comment on column public.profiles.worker_id is
  'Optional link between a login account and a schedulable worker record.';

-- Remove inherited broad grants. RLS covers row operations, but not TRUNCATE.
revoke all on public.profiles, public.workers, public.stations, public.assignments from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.workers, public.stations, public.assignments to authenticated;

-- Profiles are changed only by the trusted manage-team Edge Function.
