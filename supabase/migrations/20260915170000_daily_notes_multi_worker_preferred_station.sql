alter table public.workers add column if not exists "preferredStationId" uuid references public.stations(id) on delete set null;
alter table public.assignments drop constraint if exists "assignments_stationId_date_key";
alter table public.assignments drop constraint if exists assignments_station_date_key;
create index if not exists workers_preferred_station_idx on public.workers ("preferredStationId");

create table if not exists public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  date text not null unique check (date ~ '^\\d{4}-\\d{2}-\\d{2}$' and date = (date::date)::text),
  note text not null check (char_length(note) <= 4000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists daily_notes_date_idx on public.daily_notes (date);
alter table public.daily_notes enable row level security;
revoke all on public.daily_notes from public, anon;
grant select, insert, update, delete on public.daily_notes to authenticated;
create policy "Active users can read daily notes" on public.daily_notes for select to authenticated using ((select private.current_user_is_active()));
create policy "Managers insert daily notes" on public.daily_notes for insert to authenticated with check ((select private.is_manager()));
create policy "Managers update daily notes" on public.daily_notes for update to authenticated using ((select private.is_manager())) with check ((select private.is_manager()));
create policy "Managers delete daily notes" on public.daily_notes for delete to authenticated using ((select private.is_manager()));
create trigger daily_notes_set_updated_at before update on public.daily_notes for each row execute function public.set_updated_at();
create trigger audit_daily_notes_changes after insert or update or delete on public.daily_notes for each row execute function private.record_planner_change();

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
  where w.status = 'available' and private.austrian_public_holiday(d.day::date) is null
    and not exists (select 1 from public.assignments a where a."workerId" = w.id and a.date = d.day::date::text)
  on conflict ("workerId", date) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count;
end $$;
revoke all on function public.auto_assign_preferred_workers(date) from public, anon;
grant execute on function public.auto_assign_preferred_workers(date) to authenticated;

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
    "plusHours" = nullif(worker_record->>'plusHours', '')::integer, "preferredStationId" = nullif(worker_record->>'preferredStationId', '')::uuid
  where id = target_id;
  if previous_status is distinct from (worker_record->>'status') and worker_record->>'status' <> 'available' then
    delete from public.assignments where "workerId" = target_id and date::date between week_start and week_start + 4;
  end if;
end $$;
