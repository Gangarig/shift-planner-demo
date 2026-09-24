-- Safe follow-up for both the existing workspace and fresh baseline installs.
drop policy if exists "Enable read access for all users" on public.workers;
revoke all on public.workers, public.stations, public.assignments, public.profiles from anon;
grant usage on schema private to authenticated;
grant execute on function private.is_manager() to authenticated;
grant execute on function private.worker_is_available(uuid) to authenticated;

alter table public.assignments alter column "workerId" drop default, alter column "stationId" drop default;
alter table public.assignments alter column "workerId" set not null, alter column "stationId" set not null, alter column date set not null;
alter table public.assignments add constraint assignments_calendar_date check (date = (date::date)::text);

create or replace function public.ensure_assignment_worker_available()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare worker_status text; station_active boolean;
begin
  if TG_OP = 'UPDATE' then
    if new."workerId" is not distinct from old."workerId"
       and new."stationId" is not distinct from old."stationId"
       and new.date is not distinct from old.date then return new; end if;
  end if;
  select status into worker_status from public.workers where id = new."workerId" for share;
  select active into station_active from public.stations where id = new."stationId" for share;
  if worker_status is distinct from 'available' then raise exception 'This worker is unavailable.'; end if;
  if station_active is distinct from true then raise exception 'This station is inactive.'; end if;
  return new;
end $$;
drop trigger if exists assignments_worker_available on public.assignments;
create trigger assignments_worker_available before insert or update on public.assignments
for each row execute function public.ensure_assignment_worker_available();

-- The worker edit and selected-week cleanup succeed or fail together.
create or replace function public.update_worker_for_week(worker_record jsonb, week_start date)
returns void language plpgsql security invoker set search_path = '' as $$
declare previous_status text; target_id uuid := (worker_record->>'id')::uuid;
begin
  if not private.is_manager() then raise exception 'Manager access required' using errcode = '42501'; end if;
  if week_start is null or extract(isodow from week_start) <> 1 then raise exception 'Choose a Monday as week start'; end if;
  select status into previous_status from public.workers where id = target_id for update;
  if not found then raise exception 'Worker not found'; end if;
  update public.workers set
    name = btrim(worker_record->>'name'), email = btrim(worker_record->>'email'),
    role = worker_record->>'role', status = worker_record->>'status',
    "phoneNumber" = worker_record->>'phoneNumber',
    "vacationDays" = (worker_record->>'vacationDays')::integer,
    "plusHours" = (worker_record->>'plusHours')::integer
  where id = target_id;
  if previous_status is distinct from (worker_record->>'status') and worker_record->>'status' <> 'available' then
    delete from public.assignments where "workerId" = target_id and date::date between week_start and week_start + 4;
  end if;
end $$;
revoke all on function public.update_worker_for_week(jsonb, date) from public, anon;
grant execute on function public.update_worker_for_week(jsonb, date) to authenticated;
