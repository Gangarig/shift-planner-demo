begin;
create temp table payroll_test_ids(user_id uuid, worker_id uuid, station_id uuid, request_id uuid);
grant select, update on payroll_test_ids to authenticated;
insert into payroll_test_ids(user_id) select id from public.profiles where role='owner' and disabled_at is null limit 1;
with w as (insert into public.workers(name,email,role,status) values ('Payroll security test','payroll-test@example.invalid','worker','available') returning id)
update payroll_test_ids set worker_id=(select id from w);
with s as (insert into public.stations(name,active) values ('Worker permission test',true) returning id)
update payroll_test_ids set station_id=(select id from s);
update public.profiles set role='worker', worker_id=(select worker_id from payroll_test_ids) where id=(select user_id from payroll_test_ids);
select set_config('request.jwt.claims',json_build_object('sub',(select user_id from payroll_test_ids),'role','authenticated')::text,true);
set local role authenticated;
with r as (insert into public.leave_requests(worker_id,request_type,start_date,end_date,note) select worker_id,'vacation','2099-06-01','2099-06-02','Security test' from payroll_test_ids returning id)
update payroll_test_ids set request_id=(select id from r);
do $$ begin
  if (select count(*) from public.leave_requests where id=(select request_id from payroll_test_ids)) <> 1 then raise exception 'TEST FAILED: worker cannot read own request'; end if;
  begin insert into public.overtime_entries(worker_id,work_date,hours) select worker_id,'2099-06-01',1 from payroll_test_ids; raise exception 'TEST FAILED: worker created overtime'; exception when insufficient_privilege then null; end;
  update public.workers set status='sick' where id=(select worker_id from payroll_test_ids);
  if exists(select 1 from public.workers where id=(select worker_id from payroll_test_ids) and status='sick') then raise exception 'TEST FAILED: worker changed worker data'; end if;
  begin insert into public.assignments("workerId","stationId",date) select worker_id,station_id,'2099-06-03' from payroll_test_ids; exception when others then null; end;
  if exists(select 1 from public.assignments where "workerId"=(select worker_id from payroll_test_ids) and date='2099-06-03') then raise exception 'TEST FAILED: worker changed plan'; end if;
end $$;
reset role;
update public.profiles set role='admin' where id=(select user_id from payroll_test_ids);
set local role authenticated;
do $$ begin
  if (select count(*) from public.leave_requests where id=(select request_id from payroll_test_ids)) <> 1 then raise exception 'TEST FAILED: admin oversight cannot read request'; end if;
  begin update public.leave_requests set status='approved',schedule_status='holiday' where id=(select request_id from payroll_test_ids); raise exception 'TEST FAILED: admin reviewed request'; exception when insufficient_privilege then null; end;
  begin insert into public.overtime_entries(worker_id,work_date,hours) select worker_id,'2099-06-01',1 from payroll_test_ids; raise exception 'TEST FAILED: admin created overtime'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.profiles set role='accountant' where id=(select user_id from payroll_test_ids);
set local role authenticated;
insert into public.overtime_entries(worker_id,work_date,hours,note) select worker_id,'2099-06-01',1.5,'Verified' from payroll_test_ids;
update public.leave_requests set status='approved',schedule_status='holiday',reviewed_by=(select user_id from payroll_test_ids),reviewed_at=now() where id=(select request_id from payroll_test_ids);
do $$ begin
  if not exists(select 1 from public.leave_requests where id=(select request_id from payroll_test_ids) and absence_id is not null) then raise exception 'TEST FAILED: approval did not link absence'; end if;
end $$;
reset role;
select 'PASS: worker requests, admin read-only oversight, accountant-only overtime and approval' as result;
rollback;
