begin;
create temp table release_ids(owner_id uuid, worker_id uuid, station_id uuid, week_start date);
grant select, update on release_ids to authenticated;
insert into release_ids(owner_id, week_start)
select id, date '2099-05-04' from public.profiles where role='owner' and disabled_at is null limit 1;

select set_config('request.jwt.claims', json_build_object('sub',(select owner_id from release_ids),'role','authenticated')::text,true);
set local role authenticated;
with w as (insert into public.workers(name,email,role,status) values ('Publish verification','publish@example.invalid','worker','available') returning id)
update release_ids set worker_id=(select id from w);
with s as (insert into public.stations(name,active) values ('Publish verification',true) returning id)
update release_ids set station_id=(select id from s);
insert into public.assignments("workerId","stationId",date) select worker_id,station_id,week_start::text from release_ids;
insert into public.weekly_plans(week_start,status) select week_start,'draft' from release_ids;

reset role;
update public.profiles set role='worker' where id=(select owner_id from release_ids);
set local role authenticated;
do $$ begin
  if (select count(*) from public.assignments where "workerId"=(select worker_id from release_ids)) <> 0 then raise exception 'TEST FAILED: draft leaked to worker'; end if;
  begin insert into public.notifications(recipient_id,kind,title,body) select owner_id,'plan_published','Denied','Denied' from release_ids; raise exception 'TEST FAILED: notification insert allowed'; exception when insufficient_privilege then null; end;
end $$;

reset role;
update public.profiles set role='owner' where id=(select owner_id from release_ids);
set local role authenticated;
update public.weekly_plans set status='published' where week_start=(select week_start from release_ids);
reset role;
do $$ begin
  if (select revision from public.weekly_plans where week_start=(select week_start from release_ids)) <> 1 then raise exception 'TEST FAILED: publish revision'; end if;
  if (select count(*) from public.notifications where week_start=(select week_start from release_ids) and kind='plan_published') < 1 then raise exception 'TEST FAILED: notifications missing'; end if;
end $$;

update public.profiles set role='worker' where id=(select owner_id from release_ids);
set local role authenticated;
do $$ begin
  if (select count(*) from public.assignments where "workerId"=(select worker_id from release_ids)) <> 1 then raise exception 'TEST FAILED: published week hidden'; end if;
end $$;

reset role;
update public.profiles set role='owner' where id=(select owner_id from release_ids);
set local role authenticated;
delete from public.workers where id=(select worker_id from release_ids);
reset role;
do $$ begin
  if exists (select 1 from public.assignments where "workerId"=(select worker_id from release_ids)) then raise exception 'TEST FAILED: worker delete did not cascade'; end if;
end $$;
select 'PASS: publication, draft privacy, notifications, grants, visibility, permanent deletion' as result;
rollback;
