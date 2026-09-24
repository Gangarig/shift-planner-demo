alter table public.leave_requests
  alter column submitted_by drop not null;

alter table public.leave_requests
  drop constraint if exists leave_requests_submitted_by_fkey;

alter table public.leave_requests
  add constraint leave_requests_submitted_by_fkey
  foreign key (submitted_by) references auth.users(id) on delete set null;
