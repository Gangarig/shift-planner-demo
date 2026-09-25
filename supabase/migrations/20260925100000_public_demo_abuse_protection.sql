-- Public portfolio demo safeguards. These controls apply only to the isolated
-- ShiftPlanner Demo project, never to the production MVP database.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A small demo audience is enough to exercise the application while keeping
  -- Auth, database, and email use within a free-tier-friendly boundary.
  if (select count(*) from public.profiles where disabled_at is null) >= 40 then
    raise exception 'This public demo has reached its account limit. Please try again later.';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    'admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.enforce_public_demo_write_rate()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if (
    select count(*)
    from public.security_audit_log
    where actor_id = (select auth.uid())
      and created_at >= now() - interval '10 minutes'
  ) >= 30 then
    raise exception 'Demo edit limit reached. Please wait a few minutes before making more changes.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.enforce_public_demo_document_capacity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_table_name = 'payslip_documents'
     and (select count(*) from public.payslip_documents) >= 20 then
    raise exception 'Demo document limit reached.';
  end if;
  if tg_table_name = 'leave_request_documents'
     and (select count(*) from public.leave_request_documents) >= 20 then
    raise exception 'Demo document limit reached.';
  end if;
  return new;
end;
$$;

drop trigger if exists public_demo_worker_write_rate on public.workers;
create trigger public_demo_worker_write_rate
before insert or update or delete on public.workers
for each row execute function private.enforce_public_demo_write_rate();

drop trigger if exists public_demo_station_write_rate on public.stations;
create trigger public_demo_station_write_rate
before insert or update or delete on public.stations
for each row execute function private.enforce_public_demo_write_rate();

drop trigger if exists public_demo_assignment_write_rate on public.assignments;
create trigger public_demo_assignment_write_rate
before insert or update or delete on public.assignments
for each row execute function private.enforce_public_demo_write_rate();

drop trigger if exists public_demo_payslip_document_capacity on public.payslip_documents;
create trigger public_demo_payslip_document_capacity
before insert on public.payslip_documents
for each row execute function private.enforce_public_demo_document_capacity();

drop trigger if exists public_demo_leave_document_capacity on public.leave_request_documents;
create trigger public_demo_leave_document_capacity
before insert on public.leave_request_documents
for each row execute function private.enforce_public_demo_document_capacity();

-- Keep optional document uploads demonstrable without allowing large files to
-- consume the demo project's Storage quota.
update storage.buckets
set file_size_limit = 1048576
where id = 'shiftplanner-private';

revoke execute on function private.enforce_public_demo_write_rate() from public, anon, authenticated;
revoke execute on function private.enforce_public_demo_document_capacity() from public, anon, authenticated;
