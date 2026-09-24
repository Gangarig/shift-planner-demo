alter table public.stations drop constraint if exists "stations_defaultStartTime_check";
alter table public.stations drop constraint if exists "stations_defaultEndTime_check";
alter table public.assignments drop constraint if exists "assignments_startTime_check";
alter table public.assignments drop constraint if exists "assignments_endTime_check";
alter table public.worker_absences drop constraint if exists "worker_absences_startDate_check";
alter table public.worker_absences drop constraint if exists "worker_absences_endDate_check";

alter table public.stations add constraint "stations_defaultStartTime_check" check ("defaultStartTime" is null or "defaultStartTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.stations add constraint "stations_defaultEndTime_check" check ("defaultEndTime" is null or "defaultEndTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.assignments add constraint "assignments_startTime_check" check ("startTime" is null or "startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.assignments add constraint "assignments_endTime_check" check ("endTime" is null or "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.worker_absences add constraint "worker_absences_startDate_check" check ("startDate" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and "startDate" = ("startDate"::date)::text);
alter table public.worker_absences add constraint "worker_absences_endDate_check" check ("endDate" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and "endDate" = ("endDate"::date)::text);
