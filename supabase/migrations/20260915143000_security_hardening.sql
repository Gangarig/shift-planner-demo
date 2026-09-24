-- Keep read policies simple and split write policies by operation so SELECT
-- does not evaluate overlapping permissive policies.
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Managers can read all profiles" on public.profiles;
create policy "Profiles visible to owner or manager"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select private.is_manager()));

drop policy if exists "Managers manage workers" on public.workers;
create policy "Managers insert workers"
  on public.workers for insert to authenticated
  with check ((select private.is_manager()));
create policy "Managers update workers"
  on public.workers for update to authenticated
  using ((select private.is_manager()))
  with check ((select private.is_manager()));
create policy "Managers delete workers"
  on public.workers for delete to authenticated
  using ((select private.is_manager()));

drop policy if exists "Managers manage stations" on public.stations;
create policy "Managers insert stations"
  on public.stations for insert to authenticated
  with check ((select private.is_manager()));
create policy "Managers update stations"
  on public.stations for update to authenticated
  using ((select private.is_manager()))
  with check ((select private.is_manager()));
create policy "Managers delete stations"
  on public.stations for delete to authenticated
  using ((select private.is_manager()));

drop policy if exists "Managers manage assignments" on public.assignments;
create policy "Managers insert assignments"
  on public.assignments for insert to authenticated
  with check ((select private.is_manager()));
create policy "Managers update assignments"
  on public.assignments for update to authenticated
  using ((select private.is_manager()))
  with check ((select private.is_manager()));
create policy "Managers delete assignments"
  on public.assignments for delete to authenticated
  using ((select private.is_manager()));

-- Trigger functions are internal implementation details, not API endpoints.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.ensure_assignment_worker_available() from public, anon, authenticated;
drop function if exists private.worker_is_available(uuid);
