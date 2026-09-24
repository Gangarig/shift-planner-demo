create or replace function private.is_payroll_staff() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id=(select auth.uid()) and disabled_at is null and role='accountant');
$$;
create or replace function private.is_payroll_viewer() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id=(select auth.uid()) and disabled_at is null and role in ('accountant','admin','owner'));
$$;
revoke all on function private.is_payroll_staff(), private.is_payroll_viewer() from public, anon;
grant execute on function private.is_payroll_staff(), private.is_payroll_viewer() to authenticated;

drop policy "Payroll staff manage overtime" on public.overtime_entries;
create policy "Payroll viewers read overtime" on public.overtime_entries for select to authenticated using ((select private.is_payroll_viewer()));
create policy "Accountants insert overtime" on public.overtime_entries for insert to authenticated with check ((select private.is_payroll_staff()));
create policy "Accountants update overtime" on public.overtime_entries for update to authenticated using ((select private.is_payroll_staff())) with check ((select private.is_payroll_staff()));
create policy "Accountants delete overtime" on public.overtime_entries for delete to authenticated using ((select private.is_payroll_staff()));

drop policy "Authorized users read leave requests" on public.leave_requests;
drop policy "Authorized users submit leave requests" on public.leave_requests;
drop policy "Authorized users update leave requests" on public.leave_requests;
drop policy "Authorized users delete leave requests" on public.leave_requests;
create policy "Authorized users read leave requests" on public.leave_requests for select to authenticated using ((select private.is_payroll_viewer()) or (select private.is_own_worker(worker_id)));
create policy "Workers submit own leave requests" on public.leave_requests for insert to authenticated with check ((select private.is_own_worker(worker_id)) and submitted_by=(select auth.uid()) and status='pending' and reviewed_by is null and absence_id is null);
create policy "Accountants review or workers edit requests" on public.leave_requests for update to authenticated using ((select private.is_payroll_staff()) or ((select private.is_own_worker(worker_id)) and status='pending')) with check ((select private.is_payroll_staff()) or ((select private.is_own_worker(worker_id)) and status='pending' and submitted_by=(select auth.uid()) and reviewed_by is null and absence_id is null));
create policy "Accountants or workers delete requests" on public.leave_requests for delete to authenticated using ((select private.is_payroll_staff()) or ((select private.is_own_worker(worker_id)) and status='pending'));

drop policy "Authorized users read payslips" on public.payslip_documents;
create policy "Authorized users read payslips" on public.payslip_documents for select to authenticated using ((select private.is_payroll_viewer()) or (select private.is_own_worker(worker_id)));

drop policy "Authorized users read leave documents" on public.leave_request_documents;
drop policy "Authorized users upload leave documents" on public.leave_request_documents;
drop policy "Payroll staff update leave documents" on public.leave_request_documents;
drop policy "Authorized users delete leave documents" on public.leave_request_documents;
create policy "Authorized users read leave documents" on public.leave_request_documents for select to authenticated using ((select private.is_payroll_viewer()) or exists (select 1 from public.leave_requests r where r.id=request_id and (select private.is_own_worker(r.worker_id))));
create policy "Workers upload own pending leave documents" on public.leave_request_documents for insert to authenticated with check (uploaded_by=(select auth.uid()) and exists (select 1 from public.leave_requests r where r.id=request_id and r.status='pending' and (select private.is_own_worker(r.worker_id))));
create policy "Accountants verify leave documents" on public.leave_request_documents for update to authenticated using ((select private.is_payroll_staff())) with check ((select private.is_payroll_staff()));
create policy "Accountants or workers delete leave documents" on public.leave_request_documents for delete to authenticated using ((select private.is_payroll_staff()) or exists (select 1 from public.leave_requests r where r.id=request_id and r.status='pending' and (select private.is_own_worker(r.worker_id))));

create or replace function private.can_read_private_file(target_path text) returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.is_payroll_viewer())
    or exists (select 1 from public.payslip_documents p where p.object_path=target_path and (select private.is_own_worker(p.worker_id)))
    or exists (select 1 from public.leave_request_documents d join public.leave_requests r on r.id=d.request_id where d.object_path=target_path and (select private.is_own_worker(r.worker_id)));
$$;
revoke all on function private.can_read_private_file(text) from public, anon;
grant execute on function private.can_read_private_file(text) to authenticated;

create or replace function private.notify_leave_request() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP='INSERT' then
    insert into public.notifications(recipient_id,kind,title,body)
    select p.id,'leave_requested','Leave request submitted','A new leave or absence request is ready for review.'
    from public.profiles p where p.disabled_at is null and p.role='accountant' and p.id<>new.submitted_by;
  elsif new.status is distinct from old.status and new.submitted_by<>(select auth.uid()) then
    insert into public.notifications(recipient_id,kind,title,body)
    values(new.submitted_by,'leave_reviewed','Leave request '||new.status,'Your leave or absence request has been '||new.status||'.');
  end if;
  return new;
end;
$$;
revoke all on function private.notify_leave_request() from public, anon, authenticated;
