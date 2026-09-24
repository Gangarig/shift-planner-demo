alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('worker', 'manager', 'admin', 'owner', 'accountant'));

create or replace function private.is_payroll_staff() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and disabled_at is null and role in ('accountant', 'admin', 'owner'));
$$;
create or replace function private.is_own_worker(target_worker uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and disabled_at is null and worker_id = target_worker);
$$;
revoke all on function private.is_payroll_staff() from public, anon;
revoke all on function private.is_own_worker(uuid) from public, anon;
grant execute on function private.is_payroll_staff(), private.is_own_worker(uuid) to authenticated;

create table public.overtime_entries (
  id uuid primary key default gen_random_uuid(), worker_id uuid not null references public.workers(id) on delete cascade,
  work_date date not null, hours numeric(6,2) not null check (hours between -24 and 24 and hours <> 0),
  note text check (char_length(note) <= 500), created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index overtime_entries_worker_date_idx on public.overtime_entries (worker_id, work_date desc);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(), worker_id uuid not null references public.workers(id) on delete cascade,
  request_type text not null check (request_type in ('vacation','sick_leave','doctor_appointment','other_absence')),
  start_date date not null, end_date date not null, start_time time, end_time time,
  note text check (char_length(note) <= 1000), status text not null default 'pending' check (status in ('pending','approved','rejected')),
  schedule_status text check (schedule_status in ('late','sick','holiday')), submitted_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, review_note text check (char_length(review_note) <= 1000),
  absence_id uuid references public.worker_absences(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_date >= start_date), check ((start_time is null and end_time is null) or (start_date = end_date and start_time is not null and end_time is not null and end_time > start_time))
);
create index leave_requests_worker_dates_idx on public.leave_requests (worker_id, start_date desc, end_date);
create index leave_requests_status_idx on public.leave_requests (status, created_at desc);

create table public.payslip_documents (
  id uuid primary key default gen_random_uuid(), worker_id uuid not null references public.workers(id) on delete cascade,
  payroll_month date not null check (payroll_month = date_trunc('month', payroll_month)::date), object_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 255), mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  uploaded_by uuid references auth.users(id) on delete set null default auth.uid(), created_at timestamptz not null default now(), unique (worker_id, payroll_month)
);
create index payslip_documents_month_idx on public.payslip_documents (payroll_month desc, worker_id);

create table public.leave_request_documents (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.leave_requests(id) on delete cascade,
  object_path text not null unique, original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz,
  uploaded_by uuid references auth.users(id) on delete set null default auth.uid(), created_at timestamptz not null default now()
);
create index leave_request_documents_request_idx on public.leave_request_documents (request_id, created_at);

create trigger overtime_entries_set_updated_at before update on public.overtime_entries for each row execute function public.set_updated_at();
create trigger leave_requests_set_updated_at before update on public.leave_requests for each row execute function public.set_updated_at();

create or replace function private.sync_approved_leave() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'approved' and new.schedule_status is not null then
    if new.absence_id is null then
      insert into public.worker_absences ("workerId", "startDate", "endDate", status, note)
      values (new.worker_id, new.start_date::text, new.end_date::text, new.schedule_status, new.note) returning id into new.absence_id;
    else
      update public.worker_absences set "startDate"=new.start_date::text, "endDate"=new.end_date::text, status=new.schedule_status, note=new.note where id=new.absence_id;
    end if;
  elsif new.absence_id is not null then
    delete from public.worker_absences where id=new.absence_id; new.absence_id := null;
  end if;
  return new;
end;
$$;
revoke all on function private.sync_approved_leave() from public, anon, authenticated;
create trigger sync_approved_leave before insert or update on public.leave_requests for each row execute function private.sync_approved_leave();

alter table public.overtime_entries enable row level security;
alter table public.leave_requests enable row level security;
alter table public.payslip_documents enable row level security;
alter table public.leave_request_documents enable row level security;
revoke all on public.overtime_entries, public.leave_requests, public.payslip_documents, public.leave_request_documents from public, anon, authenticated;
grant select, insert, update, delete on public.overtime_entries, public.leave_requests, public.payslip_documents, public.leave_request_documents to authenticated;

create policy "Payroll staff manage overtime" on public.overtime_entries for all to authenticated using ((select private.is_payroll_staff())) with check ((select private.is_payroll_staff()));
create policy "Payroll staff manage leave requests" on public.leave_requests for all to authenticated using ((select private.is_payroll_staff())) with check ((select private.is_payroll_staff()));
create policy "Workers read own leave requests" on public.leave_requests for select to authenticated using ((select private.is_own_worker(worker_id)));
create policy "Workers submit own leave requests" on public.leave_requests for insert to authenticated with check ((select private.is_own_worker(worker_id)) and submitted_by=(select auth.uid()) and status='pending' and reviewed_by is null and absence_id is null);
create policy "Workers edit pending own leave requests" on public.leave_requests for update to authenticated using ((select private.is_own_worker(worker_id)) and status='pending') with check ((select private.is_own_worker(worker_id)) and status='pending' and submitted_by=(select auth.uid()) and reviewed_by is null and absence_id is null);
create policy "Workers delete pending own leave requests" on public.leave_requests for delete to authenticated using ((select private.is_own_worker(worker_id)) and status='pending');
create policy "Payroll staff manage payslips" on public.payslip_documents for all to authenticated using ((select private.is_payroll_staff())) with check ((select private.is_payroll_staff()));
create policy "Workers read own payslips" on public.payslip_documents for select to authenticated using ((select private.is_own_worker(worker_id)));
create policy "Payroll staff manage leave documents" on public.leave_request_documents for all to authenticated using ((select private.is_payroll_staff())) with check ((select private.is_payroll_staff()));
create policy "Workers read own leave documents" on public.leave_request_documents for select to authenticated using (exists (select 1 from public.leave_requests r where r.id=request_id and (select private.is_own_worker(r.worker_id))));
create policy "Workers upload own pending leave documents" on public.leave_request_documents for insert to authenticated with check (uploaded_by=(select auth.uid()) and exists (select 1 from public.leave_requests r where r.id=request_id and r.status='pending' and (select private.is_own_worker(r.worker_id))));
create policy "Workers delete own pending leave documents" on public.leave_request_documents for delete to authenticated using (exists (select 1 from public.leave_requests r where r.id=request_id and r.status='pending' and (select private.is_own_worker(r.worker_id))));

create or replace function private.can_read_private_file(target_path text) returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.is_payroll_staff())
    or exists (select 1 from public.payslip_documents p where p.object_path=target_path and (select private.is_own_worker(p.worker_id)))
    or exists (select 1 from public.leave_request_documents d join public.leave_requests r on r.id=d.request_id where d.object_path=target_path and (select private.is_own_worker(r.worker_id)));
$$;
create or replace function private.can_write_private_file(target_path text) returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.is_payroll_staff())
    or exists (select 1 from public.leave_request_documents d join public.leave_requests r on r.id=d.request_id where d.object_path=target_path and r.status='pending' and (select private.is_own_worker(r.worker_id)));
$$;
revoke all on function private.can_read_private_file(text), private.can_write_private_file(text) from public, anon;
grant execute on function private.can_read_private_file(text), private.can_write_private_file(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shiftplanner-private','shiftplanner-private',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
create policy "Authorized users read private documents" on storage.objects for select to authenticated using (bucket_id='shiftplanner-private' and (select private.can_read_private_file(name)));
create policy "Authorized users upload private documents" on storage.objects for insert to authenticated with check (bucket_id='shiftplanner-private' and (select private.can_write_private_file(name)));
create policy "Authorized users delete private documents" on storage.objects for delete to authenticated using (bucket_id='shiftplanner-private' and (select private.can_write_private_file(name)));

create policy "Accountants insert worker absences" on public.worker_absences for insert to authenticated with check ((select private.is_payroll_staff()));
create policy "Accountants update worker absences" on public.worker_absences for update to authenticated using ((select private.is_payroll_staff())) with check ((select private.is_payroll_staff()));
create policy "Accountants delete worker absences" on public.worker_absences for delete to authenticated using ((select private.is_payroll_staff()));

create trigger audit_overtime_entries_changes after insert or update or delete on public.overtime_entries for each row execute function private.record_planner_change();
create trigger audit_leave_requests_changes after insert or update or delete on public.leave_requests for each row execute function private.record_planner_change();
create trigger audit_payslip_documents_changes after insert or update or delete on public.payslip_documents for each row execute function private.record_planner_change();
