-- Explicit demo records; safe to rerun. Real records are not replaced.
insert into public.workers (name, email, role, status)
select 'Demo · Alex Morgan', 'shiftplanner-demo-alex@example.invalid', 'worker', 'available'
where not exists (select 1 from public.workers where email = 'shiftplanner-demo-alex@example.invalid');
insert into public.workers (name, email, role, status)
select 'Demo · Jamie Lee', 'shiftplanner-demo-jamie@example.invalid', 'worker', 'available'
where not exists (select 1 from public.workers where email = 'shiftplanner-demo-jamie@example.invalid');
insert into public.workers (name, email, role, status)
select 'Demo · Sam Rivera', 'shiftplanner-demo-sam@example.invalid', 'worker', 'holiday'
where not exists (select 1 from public.workers where email = 'shiftplanner-demo-sam@example.invalid');
insert into public.stations (name, active)
select 'Demo · Packing', true where not exists (select 1 from public.stations where name = 'Demo · Packing');
insert into public.stations (name, active)
select 'Demo · Reception', true where not exists (select 1 from public.stations where name = 'Demo · Reception');
