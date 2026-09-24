alter table public.stations add constraint stations_default_time_order check ("defaultStartTime" is null or "defaultEndTime" is null or "defaultStartTime" < "defaultEndTime");
alter table public.assignments add constraint assignments_time_order check ("startTime" is null or "endTime" is null or "startTime" < "endTime");
