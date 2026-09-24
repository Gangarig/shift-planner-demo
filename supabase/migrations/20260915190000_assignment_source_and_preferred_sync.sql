alter table public.assignments add column if not exists source text not null default 'manual';
alter table public.assignments drop constraint if exists assignments_source_check;
alter table public.assignments add constraint assignments_source_check check (source in ('manual', 'preferred'));

create index if not exists assignments_preferred_worker_date_idx
  on public.assignments ("workerId", date) where source = 'preferred';

create or replace function public.auto_assign_preferred_workers(week_start date)
returns integer language plpgsql security invoker set search_path = '' as $$
declare inserted_count integer;
begin
  if not private.is_manager() then raise exception 'Manager access required' using errcode = '42501'; end if;
  if week_start is null or extract(isodow from week_start) <> 1 then raise exception 'Choose a Monday as week start'; end if;
  insert into public.assignments ("workerId", "stationId", date, note, source)
  select w.id, w."preferredStationId", d.day::date::text, null, 'preferred'
  from public.workers w join public.stations s on s.id = w."preferredStationId" and s.active
  cross join lateral generate_series(week_start, week_start + 4, interval '1 day') d(day)
  where w.status in ('available', 'late') and private.austrian_public_holiday(d.day::date) is null
    and not exists (select 1 from public.assignments a where a."workerId" = w.id and a.date = d.day::date::text)
  on conflict ("workerId", date) do nothing;
  get diagnostics inserted_count = row_count; return inserted_count;
end $$;

create or replace function public.update_worker_for_week(worker_record jsonb, week_start date)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  previous_status text;
  target_status text := worker_record->>'status';
  target_id uuid := (worker_record->>'id')::uuid;
  target_station uuid := nullif(worker_record->>'preferredStationId', '')::uuid;
begin
  if not private.is_manager() then raise exception 'Manager access required' using errcode = '42501'; end if;
  if week_start is null or extract(isodow from week_start) <> 1 then raise exception 'Choose a Monday as week start'; end if;
  select status into previous_status from public.workers where id = target_id for update;
  if not found then raise exception 'Worker not found'; end if;

  if target_station is not null and not exists (select 1 from public.stations where id = target_station and active) then
    raise exception 'Choose an active main station';
  end if;

  update public.workers set name = btrim(worker_record->>'name'), email = btrim(worker_record->>'email'), role = worker_record->>'role', status = target_status,
    "phoneNumber" = nullif(worker_record->>'phoneNumber', ''), "vacationDays" = nullif(worker_record->>'vacationDays', '')::integer,
    "plusHours" = nullif(worker_record->>'plusHours', '')::integer, "preferredStationId" = target_station where id = target_id;

  if target_status not in ('available', 'late') then
    delete from public.assignments where "workerId" = target_id and date::date between week_start and week_start + 4;
    return;
  end if;

  if target_station is null then
    delete from public.assignments where "workerId" = target_id and source = 'preferred' and date::date between week_start and week_start + 4;
    return;
  end if;

  update public.assignments set "stationId" = target_station
  where "workerId" = target_id and source = 'preferred' and date::date between week_start and week_start + 4;

  insert into public.assignments ("workerId", "stationId", date, note, source)
  select target_id, target_station, d.day::date::text, null, 'preferred'
  from generate_series(week_start, week_start + 4, interval '1 day') d(day)
  where private.austrian_public_holiday(d.day::date) is null
    and not exists (select 1 from public.assignments a where a."workerId" = target_id and a.date = d.day::date::text)
  on conflict ("workerId", date) do nothing;
end $$;
