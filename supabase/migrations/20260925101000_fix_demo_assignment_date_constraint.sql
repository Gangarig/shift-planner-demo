-- The copied demo schema escaped the date regex twice, which rejected every
-- valid assignment date. Keep the validation but use an unambiguous pattern.
alter table public.assignments
  drop constraint if exists assignments_date_check;

alter table public.assignments
  add constraint assignments_date_check
  check (date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$');
