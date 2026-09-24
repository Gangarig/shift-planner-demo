alter table public.workers drop constraint if exists workers_status_check;
alter table public.workers add constraint workers_status_check check (status in ('available', 'late', 'sick', 'holiday', 'inactive'));

create or replace function public.ensure_assignment_worker_available()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare worker_status text; station_active boolean; holiday_name text;
begin
  if TG_OP = 'UPDATE' and new."workerId" is not distinct from old."workerId" and new."stationId" is not distinct from old."stationId" and new.date is not distinct from old.date then return new; end if;
  holiday_name := private.austrian_public_holiday(new.date::date);
  if holiday_name is not null then raise exception 'The workplace is closed on %.', holiday_name; end if;
  select status into worker_status from public.workers where id = new."workerId" for share;
  select active into station_active from public.stations where id = new."stationId" for share;
  if worker_status not in ('available', 'late') then raise exception 'This worker is unavailable.'; end if;
  if station_active is distinct from true then raise exception 'This station is inactive.'; end if;
  return new;
end $$;

create or replace function public.auto_assign_preferred_workers(week_start date)
returns integer language plpgsql security invoker set search_path = '' as $$
declare inserted_count integer;
begin
  if not private.is_manager() then raise exception 'Manager access required' using errcode = '42501'; end if;
  if week_start is null or extract(isodow from week_start) <> 1 then raise exception 'Choose a Monday as week start'; end if;
  insert into public.assignments ("workerId", "stationId", date, note)
  select w.id, w."preferredStationId", d.day::date::text, null
  from public.workers w join public.stations s on s.id = w."preferredStationId" and s.active
  cross join lateral generate_series(week_start, week_start + 4, interval '1 day') d(day)
  where w.status in ('available', 'late') and private.austrian_public_holiday(d.day::date) is null
    and not exists (select 1 from public.assignments a where a."workerId" = w.id and a.date = d.day::date::text)
  on conflict ("workerId", date) do nothing;
  get diagnostics inserted_count = row_count; return inserted_count;
end $$;

create or replace function public.update_worker_for_week(worker_record jsonb, week_start date)
returns void language plpgsql security invoker set search_path = '' as $$
declare previous_status text; target_id uuid := (worker_record->>'id')::uuid;
begin
  if not private.is_manager() then raise exception 'Manager access required' using errcode = '42501'; end if;
  if week_start is null or extract(isodow from week_start) <> 1 then raise exception 'Choose a Monday as week start'; end if;
  select status into previous_status from public.workers where id = target_id for update;
  if not found then raise exception 'Worker not found'; end if;
  update public.workers set name = btrim(worker_record->>'name'), email = btrim(worker_record->>'email'), role = worker_record->>'role', status = worker_record->>'status',
    "phoneNumber" = nullif(worker_record->>'phoneNumber', ''), "vacationDays" = nullif(worker_record->>'vacationDays', '')::integer,
    "plusHours" = nullif(worker_record->>'plusHours', '')::integer, "preferredStationId" = nullif(worker_record->>'preferredStationId', '')::uuid where id = target_id;
  if previous_status is distinct from (worker_record->>'status') and worker_record->>'status' not in ('available', 'late') then
    delete from public.assignments where "workerId" = target_id and date::date between week_start and week_start + 4;
  end if;
end $$;
