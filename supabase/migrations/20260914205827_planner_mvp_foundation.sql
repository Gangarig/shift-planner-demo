create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'worker' check (role in ('worker', 'manager', 'admin', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null check (status in ('available', 'sick', 'holiday', 'inactive')),
  role text not null check (role in ('worker', 'manager', 'admin', 'owner', 'accountant')),
  email text not null,
  "phoneNumber" text,
  "vacationDays" integer,
  "plusHours" integer
);

create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  active boolean not null default true
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  "workerId" uuid not null references public.workers(id) on delete restrict,
  "stationId" uuid not null references public.stations(id) on delete restrict,
  date text not null check (date ~ '^\\d{4}-\\d{2}-\\d{2}$'),
  note text,
  unique ("workerId", date),
  unique ("stationId", date)
);

create index if not exists assignments_date_idx on public.assignments (date);
create index if not exists assignments_worker_date_idx on public.assignments ("workerId", date);
create index if not exists assignments_station_date_idx on public.assignments ("stationId", date);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('manager', 'admin', 'owner'));
$$;

create or replace function private.worker_is_available(worker_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workers where id = worker_id and status = 'available');
$$;

create or replace function public.ensure_assignment_worker_available()
returns trigger language plpgsql set search_path = public as $$
begin
  if not private.worker_is_available(new."workerId") then raise exception 'Cannot assign a worker who is not available'; end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create trigger assignments_worker_available before insert or update of "workerId" on public.assignments for each row execute function public.ensure_assignment_worker_available();

alter table public.profiles enable row level security;
alter table public.workers enable row level security;
alter table public.stations enable row level security;
alter table public.assignments enable row level security;

create policy "Users can read their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Managers can read all profiles" on public.profiles for select to authenticated using ((select private.is_manager()));
create policy "Authenticated users can read workers" on public.workers for select to authenticated using (true);
create policy "Managers manage workers" on public.workers for all to authenticated using ((select private.is_manager())) with check ((select private.is_manager()));
create policy "Authenticated users can read stations" on public.stations for select to authenticated using (true);
create policy "Managers manage stations" on public.stations for all to authenticated using ((select private.is_manager())) with check ((select private.is_manager()));
create policy "Authenticated users can read assignments" on public.assignments for select to authenticated using (true);
create policy "Managers manage assignments" on public.assignments for all to authenticated using ((select private.is_manager())) with check ((select private.is_manager()));

grant usage on schema public to authenticated;
grant select on public.profiles, public.workers, public.stations, public.assignments to authenticated;
grant insert, update, delete on public.workers, public.stations, public.assignments to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function private.is_manager() from public, anon;
revoke execute on function private.worker_is_available(uuid) from public, anon;
grant execute on function private.is_manager() to authenticated;
grant execute on function private.worker_is_available(uuid) to authenticated;
