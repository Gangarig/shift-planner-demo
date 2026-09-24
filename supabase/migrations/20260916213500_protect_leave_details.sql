create or replace function private.sync_approved_leave() returns trigger language plpgsql security definer set search_path = '' as $$
declare safe_note text := case new.request_type when 'vacation' then 'Approved vacation' when 'sick_leave' then 'Approved sick leave' when 'doctor_appointment' then 'Approved appointment' else 'Approved absence' end;
begin
  if new.status = 'approved' and new.schedule_status is not null then
    if new.absence_id is null then
      insert into public.worker_absences ("workerId", "startDate", "endDate", status, note)
      values (new.worker_id, new.start_date::text, new.end_date::text, new.schedule_status, safe_note) returning id into new.absence_id;
    else
      update public.worker_absences set "startDate"=new.start_date::text, "endDate"=new.end_date::text, status=new.schedule_status, note=safe_note where id=new.absence_id;
    end if;
  elsif new.absence_id is not null then
    delete from public.worker_absences where id=new.absence_id; new.absence_id := null;
  end if;
  return new;
end;
$$;
revoke all on function private.sync_approved_leave() from public, anon, authenticated;

drop policy "Active users read absences" on public.worker_absences;
create policy "Authorized users read absences" on public.worker_absences for select to authenticated
using ((select private.is_manager()) or (select private.is_payroll_staff()) or (select private.is_own_worker("workerId")));
