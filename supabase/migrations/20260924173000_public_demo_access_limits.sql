-- This migration is for the isolated public demo project only.
-- Visitors can exercise the product's core workflows without receiving
-- owner-only access to invitations, account administration, or audit history.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

-- If anyone was registered before this migration, grant the same safe demo role.
update public.profiles
set role = 'admin'
where disabled_at is null;

create or replace function private.enforce_public_demo_capacity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if tg_table_name = 'workers' and (select count(*) from public.workers) >= 30 then
    raise exception 'Demo worker limit reached. Please edit an existing demo worker instead.';
  end if;
  if tg_table_name = 'stations' and (select count(*) from public.stations) >= 12 then
    raise exception 'Demo station limit reached. Please edit an existing demo station instead.';
  end if;
  if tg_table_name = 'assignments' and (select count(*) from public.assignments) >= 500 then
    raise exception 'Demo schedule limit reached. Please edit or remove an existing assignment.';
  end if;
  return new;
end;
$$;

drop trigger if exists public_demo_worker_capacity on public.workers;
create trigger public_demo_worker_capacity
before insert on public.workers
for each row execute function private.enforce_public_demo_capacity();

drop trigger if exists public_demo_station_capacity on public.stations;
create trigger public_demo_station_capacity
before insert on public.stations
for each row execute function private.enforce_public_demo_capacity();

drop trigger if exists public_demo_assignment_capacity on public.assignments;
create trigger public_demo_assignment_capacity
before insert on public.assignments
for each row execute function private.enforce_public_demo_capacity();

revoke execute on function private.enforce_public_demo_capacity() from public, anon, authenticated;
