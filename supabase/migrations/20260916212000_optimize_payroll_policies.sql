create index leave_request_documents_reviewed_by_idx on public.leave_request_documents (reviewed_by) where reviewed_by is not null;
create index leave_request_documents_uploaded_by_idx on public.leave_request_documents (uploaded_by) where uploaded_by is not null;
create index leave_requests_absence_id_idx on public.leave_requests (absence_id) where absence_id is not null;
create index leave_requests_reviewed_by_idx on public.leave_requests (reviewed_by) where reviewed_by is not null;
create index leave_requests_submitted_by_idx on public.leave_requests (submitted_by);
create index overtime_entries_created_by_idx on public.overtime_entries (created_by) where created_by is not null;
create index payslip_documents_uploaded_by_idx on public.payslip_documents (uploaded_by) where uploaded_by is not null;

drop policy "Payroll staff manage leave requests" on public.leave_requests;
drop policy "Workers read own leave requests" on public.leave_requests;
drop policy "Workers submit own leave requests" on public.leave_requests;
drop policy "Workers edit pending own leave requests" on public.leave_requests;
drop policy "Workers delete pending own leave requests" on public.leave_requests;
create policy "Authorized users read leave requests" on public.leave_requests for select to authenticated using ((select private.is_payroll_staff()) or (select private.is_own_worker(worker_id)));
create policy "Authorized users submit leave requests" on public.leave_requests for insert to authenticated with check ((select private.is_payroll_staff()) or ((select private.is_own_worker(worker_id)) and submitted_by=(select auth.uid()) and status='pending' and reviewed_by is null and absence_id is null));
create policy "Authorized users update leave requests" on public.leave_requests for update to authenticated using ((select private.is_payroll_staff()) or ((select private.is_own_worker(worker_id)) and status='pending')) with check ((select private.is_payroll_staff()) or ((select private.is_own_worker(worker_id)) and status='pending' and submitted_by=(select auth.uid()) and reviewed_by is null and absence_id is null));
create policy "Authorized users delete leave requests" on public.leave_requests for delete to authenticated using ((select private.is_payroll_staff()) or ((select private.is_own_worker(worker_id)) and status='pending'));

drop policy "Payroll staff manage payslips" on public.payslip_documents;
drop policy "Workers read own payslips" on public.payslip_documents;
create policy "Authorized users read payslips" on public.payslip_documents for select to authenticated using ((select private.is_payroll_staff()) or (select private.is_own_worker(worker_id)));
create policy "Payroll staff insert payslips" on public.payslip_documents for insert to authenticated with check ((select private.is_payroll_staff()));
create policy "Payroll staff update payslips" on public.payslip_documents for update to authenticated using ((select private.is_payroll_staff())) with check ((select private.is_payroll_staff()));
create policy "Payroll staff delete payslips" on public.payslip_documents for delete to authenticated using ((select private.is_payroll_staff()));

drop policy "Payroll staff manage leave documents" on public.leave_request_documents;
drop policy "Workers read own leave documents" on public.leave_request_documents;
drop policy "Workers upload own pending leave documents" on public.leave_request_documents;
drop policy "Workers delete own pending leave documents" on public.leave_request_documents;
create policy "Authorized users read leave documents" on public.leave_request_documents for select to authenticated using ((select private.is_payroll_staff()) or exists (select 1 from public.leave_requests r where r.id=request_id and (select private.is_own_worker(r.worker_id))));
create policy "Authorized users upload leave documents" on public.leave_request_documents for insert to authenticated with check ((select private.is_payroll_staff()) or (uploaded_by=(select auth.uid()) and exists (select 1 from public.leave_requests r where r.id=request_id and r.status='pending' and (select private.is_own_worker(r.worker_id)))));
create policy "Payroll staff update leave documents" on public.leave_request_documents for update to authenticated using ((select private.is_payroll_staff())) with check ((select private.is_payroll_staff()));
create policy "Authorized users delete leave documents" on public.leave_request_documents for delete to authenticated using ((select private.is_payroll_staff()) or exists (select 1 from public.leave_requests r where r.id=request_id and r.status='pending' and (select private.is_own_worker(r.worker_id))));

drop policy "Managers insert absences" on public.worker_absences;
drop policy "Managers update absences" on public.worker_absences;
drop policy "Managers delete absences" on public.worker_absences;
drop policy "Accountants insert worker absences" on public.worker_absences;
drop policy "Accountants update worker absences" on public.worker_absences;
drop policy "Accountants delete worker absences" on public.worker_absences;
create policy "Authorized staff insert absences" on public.worker_absences for insert to authenticated with check ((select private.is_manager()) or (select private.is_payroll_staff()));
create policy "Authorized staff update absences" on public.worker_absences for update to authenticated using ((select private.is_manager()) or (select private.is_payroll_staff())) with check ((select private.is_manager()) or (select private.is_payroll_staff()));
create policy "Authorized staff delete absences" on public.worker_absences for delete to authenticated using ((select private.is_manager()) or (select private.is_payroll_staff()));
