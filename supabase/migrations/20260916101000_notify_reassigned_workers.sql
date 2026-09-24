create or replace function private.insert_assignment_notification(
  target_worker uuid,
  assignment_date text,
  target_station uuid,
  notification_kind text,
  notification_title text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
  station_name text;
  plan_week date := date_trunc('week', assignment_date::date)::date;
begin
  if not exists (select 1 from public.weekly_plans where week_start = plan_week and status = 'published') then return; end if;
  select id into recipient from public.profiles where worker_id = target_worker and disabled_at is null;
  if recipient is null or recipient = (select auth.uid()) then return; end if;
  select name into station_name from public.stations where id = target_station;
  insert into public.notifications (recipient_id, kind, title, body, week_start)
  values (recipient, notification_kind, notification_title,
    to_char(assignment_date::date, 'Dy DD Mon YYYY') || coalesce(' · ' || station_name, ''), plan_week);
end;
$$;
revoke all on function private.insert_assignment_notification(uuid,text,uuid,text,text) from public, anon, authenticated;

create or replace function private.notify_assignment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    perform private.insert_assignment_notification(new."workerId", new.date, new."stationId", 'assignment_created', 'Shift assigned');
  elsif TG_OP = 'DELETE' then
    perform private.insert_assignment_notification(old."workerId", old.date, old."stationId", 'assignment_removed', 'Shift removed');
  elsif new."workerId" is distinct from old."workerId" then
    perform private.insert_assignment_notification(old."workerId", old.date, old."stationId", 'assignment_removed', 'Shift reassigned');
    perform private.insert_assignment_notification(new."workerId", new.date, new."stationId", 'assignment_created', 'Shift assigned');
  else
    perform private.insert_assignment_notification(new."workerId", new.date, new."stationId", 'assignment_updated', 'Shift updated');
  end if;
  return case when TG_OP = 'DELETE' then old else new end;
end;
$$;
revoke all on function private.notify_assignment_change() from public, anon, authenticated;
