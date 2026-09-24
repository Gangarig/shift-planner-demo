create table public.company_closures (
  id uuid primary key default gen_random_uuid(),
  label text not null default 'Betriebsurlaub' check (char_length(label) between 1 and 120),
  start_date date not null,
  end_date date not null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index company_closures_dates_idx on public.company_closures (start_date, end_date);
alter table public.company_closures enable row level security;
revoke all on public.company_closures from public, anon, authenticated;
grant select, insert, update, delete on public.company_closures to authenticated;

create or replace function private.is_admin_or_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and disabled_at is null and role in ('admin','owner'));
$$;
revoke all on function private.is_admin_or_owner() from public, anon;
grant execute on function private.is_admin_or_owner() to authenticated;

create policy "Active users read company closures" on public.company_closures for select to authenticated
using ((select private.current_user_is_active()));
create policy "Admins create company closures" on public.company_closures for insert to authenticated
with check ((select private.is_admin_or_owner()));
create policy "Admins update company closures" on public.company_closures for update to authenticated
using ((select private.is_admin_or_owner())) with check ((select private.is_admin_or_owner()));
create policy "Admins delete company closures" on public.company_closures for delete to authenticated
using ((select private.is_admin_or_owner()));

create trigger company_closures_set_updated_at before update on public.company_closures
for each row execute function public.set_updated_at();
create trigger audit_company_closures_changes after insert or update or delete on public.company_closures
for each row execute function private.record_planner_change();

create or replace function public.ensure_assignment_worker_available()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare worker_status text; station_active boolean; holiday_name text; absence_status text; closure_name text;
begin
  if TG_OP = 'UPDATE' and new."workerId" is not distinct from old."workerId" and new."stationId" is not distinct from old."stationId" and new.date is not distinct from old.date then return new; end if;
  holiday_name := private.austrian_public_holiday(new.date::date);
  if holiday_name is not null then raise exception 'The workplace is closed on %.', holiday_name; end if;
  select label into closure_name from public.company_closures where new.date::date between start_date and end_date limit 1;
  if closure_name is not null then raise exception 'The workplace is closed for %.', closure_name; end if;
  select status into worker_status from public.workers where id = new."workerId" for share;
  select active into station_active from public.stations where id = new."stationId" for share;
  select status into absence_status from public.worker_absences where "workerId" = new."workerId" and new.date::date between "startDate"::date and "endDate"::date and status in ('sick','holiday') limit 1;
  if worker_status not in ('available', 'late') or absence_status is not null then raise exception 'This worker is unavailable on this date.'; end if;
  if station_active is distinct from true then raise exception 'This station is inactive.'; end if;
  return new;
end;
$$;
revoke all on function public.ensure_assignment_worker_available() from public, anon, authenticated;

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
    and not exists (select 1 from public.company_closures c where d.day::date between c.start_date and c.end_date)
    and not exists (select 1 from public.worker_absences x where x."workerId" = w.id and x.status in ('sick','holiday') and d.day::date between x."startDate"::date and x."endDate"::date)
    and not exists (select 1 from public.assignments a where a."workerId" = w.id and a.date = d.day::date::text)
  on conflict ("workerId", date) do nothing;
  get diagnostics inserted_count = row_count; return inserted_count;
end;
$$;
revoke all on function public.auto_assign_preferred_workers(date) from public, anon;
grant execute on function public.auto_assign_preferred_workers(date) to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='company_closures') then
    alter publication supabase_realtime add table public.company_closures;
  end if;
end $$;
