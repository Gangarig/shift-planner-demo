create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create table public.weekly_plans (
  week_start date primary key check (extract(isodow from week_start) = 1),
  status text not null default 'draft' check (status in ('draft', 'published')),
  revision integer not null default 0 check (revision >= 0),
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('plan_published', 'assignment_created', 'assignment_updated', 'assignment_removed')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 1000),
  week_start date,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_created_idx on public.notifications (recipient_id, created_at desc);
create index notifications_recipient_unread_idx on public.notifications (recipient_id, created_at desc) where read_at is null;

alter table public.weekly_plans enable row level security;
alter table public.notifications enable row level security;
revoke all on public.weekly_plans, public.notifications from public, anon, authenticated;
grant select, insert, update on public.weekly_plans to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "Active users read weekly plan status"
  on public.weekly_plans for select to authenticated
  using ((select private.current_user_is_active()));
create policy "Managers create weekly plans"
  on public.weekly_plans for insert to authenticated
  with check ((select private.is_manager()));
create policy "Managers update weekly plans"
  on public.weekly_plans for update to authenticated
  using ((select private.is_manager()))
  with check ((select private.is_manager()));

create policy "Users read their notifications"
  on public.notifications for select to authenticated
  using ((select private.current_user_is_active()) and recipient_id = (select auth.uid()));
create policy "Users mark their notifications read"
  on public.notifications for update to authenticated
  using ((select private.current_user_is_active()) and recipient_id = (select auth.uid()))
  with check ((select private.current_user_is_active()) and recipient_id = (select auth.uid()));

create or replace function private.prepare_weekly_plan_publish()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status = 'published' then
    new.revision := case when TG_OP = 'INSERT' then 1 else old.revision + 1 end;
    new.published_at := now();
    new.published_by := (select auth.uid());
  else
    new.published_at := null;
    new.published_by := null;
  end if;
  return new;
end;
$$;
revoke all on function private.prepare_weekly_plan_publish() from public, anon, authenticated;

create trigger prepare_weekly_plan_publish
before insert or update on public.weekly_plans
for each row execute function private.prepare_weekly_plan_publish();

create or replace function private.notify_weekly_plan_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published' then
    insert into public.notifications (recipient_id, kind, title, body, week_start)
    select p.id, 'plan_published', 'Weekly plan published',
      'The schedule for the week of ' || to_char(new.week_start, 'DD Mon YYYY') ||
      case when new.revision > 1 then ' was updated.' else ' is ready.' end,
      new.week_start
    from public.profiles p
    where p.disabled_at is null and p.id <> (select auth.uid());

    insert into public.security_audit_log (actor_id, action, entity_type)
    values ((select auth.uid()), case when new.revision > 1 then 'republish' else 'publish' end, 'weekly_plan');
  end if;
  return new;
end;
$$;
revoke all on function private.notify_weekly_plan_publish() from public, anon, authenticated;

create trigger notify_weekly_plan_publish
after insert or update on public.weekly_plans
for each row execute function private.notify_weekly_plan_publish();

create or replace function private.notify_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_value public.assignments;
  recipient uuid;
  station_name text;
  plan_week date;
  event_kind text;
  event_title text;
begin
  row_value := case when TG_OP = 'DELETE' then old else new end;
  plan_week := date_trunc('week', row_value.date::date)::date;
  if not exists (select 1 from public.weekly_plans where week_start = plan_week and status = 'published') then
    return case when TG_OP = 'DELETE' then old else new end;
  end if;

  select id into recipient from public.profiles where worker_id = row_value."workerId" and disabled_at is null;
  if recipient is null or recipient = (select auth.uid()) then
    return case when TG_OP = 'DELETE' then old else new end;
  end if;
  select name into station_name from public.stations where id = row_value."stationId";

  event_kind := case TG_OP when 'INSERT' then 'assignment_created' when 'UPDATE' then 'assignment_updated' else 'assignment_removed' end;
  event_title := case TG_OP when 'INSERT' then 'Shift assigned' when 'UPDATE' then 'Shift updated' else 'Shift removed' end;
  insert into public.notifications (recipient_id, kind, title, body, week_start)
  values (recipient, event_kind, event_title,
    to_char(row_value.date::date, 'Dy DD Mon YYYY') || coalesce(' · ' || station_name, ''), plan_week);
  return case when TG_OP = 'DELETE' then old else new end;
end;
$$;
revoke all on function private.notify_assignment_change() from public, anon, authenticated;

create trigger notify_assignment_change
after insert or update or delete on public.assignments
for each row execute function private.notify_assignment_change();

drop policy if exists "Active users can read assignments" on public.assignments;
create policy "Managers or published-plan users read assignments"
  on public.assignments for select to authenticated
  using (
    (select private.current_user_is_active()) and
    ((select private.is_manager()) or exists (
      select 1 from public.weekly_plans wp
      where wp.week_start = date_trunc('week', assignments.date::date)::date and wp.status = 'published'
    ))
  );

drop policy if exists "Active users can read daily notes" on public.daily_notes;
create policy "Managers or published-plan users read daily notes"
  on public.daily_notes for select to authenticated
  using (
    (select private.current_user_is_active()) and
    ((select private.is_manager()) or exists (
      select 1 from public.weekly_plans wp
      where wp.week_start = date_trunc('week', daily_notes.date::date)::date and wp.status = 'published'
    ))
  );

alter table public.assignments drop constraint if exists "assignments_workerId_fkey";
alter table public.assignments add constraint "assignments_workerId_fkey"
  foreign key ("workerId") references public.workers(id) on delete cascade;

do $$
declare table_name text;
begin
  foreach table_name in array array['weekly_plans','notifications'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

select cron.schedule(
  'shiftplanner-audit-retention',
  '15 2 * * *',
  $$delete from public.security_audit_log where created_at < now() - interval '1 year'$$
);

select cron.schedule(
  'shiftplanner-cron-log-retention',
  '45 2 * * 0',
  $$delete from cron.job_run_details where end_time < now() - interval '30 days'$$
);
