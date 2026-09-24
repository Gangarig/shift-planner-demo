alter table public.assignments drop constraint if exists assignments_station_date_key;
create index if not exists workers_preferred_station_idx on public.workers ("preferredStationId");
drop policy if exists "Managers manage daily notes" on public.daily_notes;
drop policy if exists "Managers insert daily notes" on public.daily_notes;
drop policy if exists "Managers update daily notes" on public.daily_notes;
drop policy if exists "Managers delete daily notes" on public.daily_notes;
create policy "Managers insert daily notes" on public.daily_notes for insert to authenticated with check ((select private.is_manager()));
create policy "Managers update daily notes" on public.daily_notes for update to authenticated using ((select private.is_manager())) with check ((select private.is_manager()));
create policy "Managers delete daily notes" on public.daily_notes for delete to authenticated using ((select private.is_manager()));
