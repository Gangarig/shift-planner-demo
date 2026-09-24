alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in ('plan_published','assignment_created','assignment_updated','assignment_removed','leave_requested','leave_reviewed','payslip_uploaded'));

create or replace function private.notify_leave_request() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP='INSERT' then
    insert into public.notifications(recipient_id,kind,title,body)
    select p.id,'leave_requested','Leave request submitted','A new leave or absence request is ready for review.'
    from public.profiles p where p.disabled_at is null and p.role in ('accountant','admin','owner') and p.id<>new.submitted_by;
  elsif new.status is distinct from old.status and new.submitted_by<>(select auth.uid()) then
    insert into public.notifications(recipient_id,kind,title,body)
    values(new.submitted_by,'leave_reviewed','Leave request '||new.status,'Your leave or absence request has been '||new.status||'.');
  end if;
  return new;
end;
$$;
revoke all on function private.notify_leave_request() from public, anon, authenticated;
create trigger notify_leave_request after insert or update on public.leave_requests for each row execute function private.notify_leave_request();

create or replace function private.notify_payslip_uploaded() returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  select id into recipient from public.profiles where worker_id=new.worker_id and disabled_at is null;
  if recipient is not null and recipient<>(select auth.uid()) then
    insert into public.notifications(recipient_id,kind,title,body)
    values(recipient,'payslip_uploaded','New payslip available','Your payslip for '||to_char(new.payroll_month,'Mon YYYY')||' is ready.');
  end if;
  return new;
end;
$$;
revoke all on function private.notify_payslip_uploaded() from public, anon, authenticated;
create trigger notify_payslip_uploaded after insert on public.payslip_documents for each row execute function private.notify_payslip_uploaded();
