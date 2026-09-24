alter table public.stations add column if not exists "defaultStartTime" text check ("defaultStartTime" is null or "defaultStartTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.stations add column if not exists "defaultEndTime" text check ("defaultEndTime" is null or "defaultEndTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.assignments add column if not exists "startTime" text check ("startTime" is null or "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.assignments add column if not exists "endTime" text check ("endTime" is null or "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

create table public.worker_absences (
  id uuid primary key default gen_random_uuid(),
  "workerId" uuid not null references public.workers(id) on delete cascade,
  "startDate" text not null check ("startDate" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and "startDate" = ("startDate"::date)::text),
  "endDate" text not null check ("endDate" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and "endDate" = ("endDate"::date)::text),
  status text not null check (status in ('late', 'sick', 'holiday')),
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  check ("endDate"::date >= "startDate"::date)
);
create index worker_absences_worker_dates_idx on public.worker_absences ("workerId", "startDate", "endDate");
alter table public.worker_absences enable row level security;
revoke all on public.worker_absences from public, anon;
grant select, insert, update, delete on public.worker_absences to authenticated;
create policy "Active users read absences" on public.worker_absences for select to authenticated using ((select private.current_user_is_active()));
create policy "Managers insert absences" on public.worker_absences for insert to authenticated with check ((select private.is_manager()));
create policy "Managers update absences" on public.worker_absences for update to authenticated using ((select private.is_manager())) with check ((select private.is_manager()));
create policy "Managers delete absences" on public.worker_absences for delete to authenticated using ((select private.is_manager()));
create trigger audit_worker_absences_changes after insert or update or delete on public.worker_absences for each row execute function private.record_planner_change();

do $$
declare table_name text;
begin
  foreach table_name in array array['workers','stations','assignments','daily_notes','worker_absences'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

create or replace function public.apply_worker_absence()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.status in ('sick', 'holiday') then
    delete from public.assignments where "workerId" = new."workerId" and date::date between new."startDate"::date and new."endDate"::date;
  end if;
  return new;
end $$;
revoke all on function public.apply_worker_absence() from public, anon, authenticated;
create trigger worker_absence_clears_assignments after insert or update on public.worker_absences for each row execute function public.apply_worker_absence();

create or replace function public.auto_assign_preferred_workers(week_start date)
returns integer language plpgsql security invoker set search_path = '' as $$
declare inserted_count integer;
begin
  if not private.is_manager() then raise exception 'Manager access required' using errcode = '42501'; end if;
  if week_start is null or extract(isodow from week_start) <> 1 then raise exception 'Choose a Monday as week start'; end if;
  insert into public.assignments ("workerId", "stationId", date, note, source, "startTime", "endTime")
  select w.id, s.id, d.day::date::text, null, 'preferred', s."defaultStartTime", s."defaultEndTime"
  from public.workers w join public.stations s on s.id = w."preferredStationId" and s.active
  cross join lateral generate_series(week_start, week_start + 4, interval '1 day') d(day)
  where w.status in ('available', 'late') and private.austrian_public_holiday(d.day::date) is null
    and not exists (select 1 from public.worker_absences x where x."workerId" = w.id and x.status in ('sick','holiday') and d.day::date between x."startDate"::date and x."endDate"::date)
    and not exists (select 1 from public.assignments a where a."workerId" = w.id and a.date = d.day::date::text)
  on conflict ("workerId", date) do nothing;
  get diagnostics inserted_count = row_count; return inserted_count;
end $$;

create or replace function public.update_worker_for_week(worker_record jsonb, week_start date)
returns void language plpgsql security invoker set search_path = '' as $$
declare target_status text := worker_record->>'status'; target_id uuid := (worker_record->>'id')::uuid; target_station uuid := nullif(worker_record->>'preferredStationId', '')::uuid; target_start text; target_end text;
begin
  if not private.is_manager() then raise exception 'Manager access required' using errcode = '42501'; end if;
  if week_start is null or extract(isodow from week_start) <> 1 then raise exception 'Choose a Monday as week start'; end if;
  perform 1 from public.workers where id = target_id for update; if not found then raise exception 'Worker not found'; end if;
  if target_station is not null then select "defaultStartTime", "defaultEndTime" into target_start, target_end from public.stations where id = target_station and active; if not found then raise exception 'Choose an active main station'; end if; end if;
  update public.workers set name=btrim(worker_record->>'name'),email=btrim(worker_record->>'email'),role=worker_record->>'role',status=target_status,"phoneNumber"=nullif(worker_record->>'phoneNumber',''),"vacationDays"=nullif(worker_record->>'vacationDays','')::integer,"plusHours"=nullif(worker_record->>'plusHours','')::integer,"preferredStationId"=target_station where id=target_id;
  if target_status not in ('available','late') then delete from public.assignments where "workerId"=target_id and date::date between week_start and week_start+4; return; end if;
  if target_station is null then delete from public.assignments where "workerId"=target_id and source='preferred' and date::date between week_start and week_start+4; return; end if;
  update public.assignments set "stationId"=target_station,"startTime"=target_start,"endTime"=target_end where "workerId"=target_id and source='preferred' and date::date between week_start and week_start+4;
  insert into public.assignments ("workerId","stationId",date,note,source,"startTime","endTime")
  select target_id,target_station,d.day::date::text,null,'preferred',target_start,target_end from generate_series(week_start,week_start+4,interval '1 day') d(day)
  where private.austrian_public_holiday(d.day::date) is null
    and not exists (select 1 from public.worker_absences x where x."workerId"=target_id and x.status in ('sick','holiday') and d.day::date between x."startDate"::date and x."endDate"::date)
    and not exists (select 1 from public.assignments a where a."workerId"=target_id and a.date=d.day::date::text)
  on conflict ("workerId",date) do nothing;
end $$;

create or replace function public.ensure_assignment_worker_available()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare worker_status text; station_active boolean; holiday_name text; absence_status text;
begin
  if TG_OP = 'UPDATE' and new."workerId" is not distinct from old."workerId" and new."stationId" is not distinct from old."stationId" and new.date is not distinct from old.date then return new; end if;
  holiday_name := private.austrian_public_holiday(new.date::date);
  if holiday_name is not null then raise exception 'The workplace is closed on %.', holiday_name; end if;
  select status into worker_status from public.workers where id = new."workerId" for share;
  select active into station_active from public.stations where id = new."stationId" for share;
  select status into absence_status from public.worker_absences where "workerId" = new."workerId" and new.date::date between "startDate"::date and "endDate"::date and status in ('sick','holiday') limit 1;
  if worker_status not in ('available', 'late') or absence_status is not null then raise exception 'This worker is unavailable on this date.'; end if;
  if station_active is distinct from true then raise exception 'This station is inactive.'; end if;
  return new;
end $$;
