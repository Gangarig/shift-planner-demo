alter table public.profiles add column if not exists disabled_at timestamptz;

create or replace function private.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and disabled_at is null
  );
$$;

create or replace function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and disabled_at is null
      and role in ('manager', 'admin', 'owner')
  );
$$;

revoke all on function private.current_user_is_active() from public, anon;
grant execute on function private.current_user_is_active() to authenticated;

drop policy if exists "Profiles visible to owner or manager" on public.profiles;
create policy "Profiles visible to active owner or manager"
  on public.profiles for select to authenticated
  using ((select private.current_user_is_active()) and ((select auth.uid()) = id or (select private.is_manager())));

drop policy if exists "Authenticated users can read workers" on public.workers;
create policy "Active users can read workers"
  on public.workers for select to authenticated
  using ((select private.current_user_is_active()));

drop policy if exists "Authenticated users can read stations" on public.stations;
create policy "Active users can read stations"
  on public.stations for select to authenticated
  using ((select private.current_user_is_active()));

drop policy if exists "Authenticated users can read assignments" on public.assignments;
create policy "Active users can read assignments"
  on public.assignments for select to authenticated
  using ((select private.current_user_is_active()));

create table if not exists public.security_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists security_audit_log_actor_created_idx
  on public.security_audit_log (actor_id, created_at desc);

alter table public.security_audit_log enable row level security;
revoke all on public.security_audit_log from public, anon, authenticated;
grant select on public.security_audit_log to authenticated;

create policy "Owners can read security audit log"
  on public.security_audit_log for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'owner' and disabled_at is null
    )
  );

create or replace function private.record_planner_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_id uuid := case when TG_OP = 'DELETE' then old.id else new.id end;
begin
  insert into public.security_audit_log (actor_id, action, entity_type, entity_id)
  values ((select auth.uid()), lower(TG_OP), TG_TABLE_NAME, changed_id);
  return case when TG_OP = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.record_planner_change() from public, anon, authenticated;

drop trigger if exists audit_workers_changes on public.workers;
create trigger audit_workers_changes after insert or update or delete on public.workers
for each row execute function private.record_planner_change();

drop trigger if exists audit_stations_changes on public.stations;
create trigger audit_stations_changes after insert or update or delete on public.stations
for each row execute function private.record_planner_change();

drop trigger if exists audit_assignments_changes on public.assignments;
create trigger audit_assignments_changes after insert or update or delete on public.assignments
for each row execute function private.record_planner_change();
