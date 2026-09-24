create or replace function private.austrian_public_holiday(value date)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  year_number integer := extract(year from value)::integer;
  a integer; b integer; c integer; d integer; e integer; f integer;
  g integer; h integer; i integer; k integer; l integer; m integer;
  easter_month integer; easter_day integer;
  easter date;
begin
  a := year_number % 19;
  b := year_number / 100;
  c := year_number % 100;
  d := b / 4;
  e := b % 4;
  f := (b + 8) / 25;
  g := (b - f + 1) / 3;
  h := (19 * a + b - d - g + 15) % 30;
  i := c / 4;
  k := c % 4;
  l := (32 + 2 * e + 2 * i - h - k) % 7;
  m := (a + 11 * h + 22 * l) / 451;
  easter_month := (h + l - 7 * m + 114) / 31;
  easter_day := ((h + l - 7 * m + 114) % 31) + 1;
  easter := pg_catalog.make_date(year_number, easter_month, easter_day);

  return case
    when value = pg_catalog.make_date(year_number, 1, 1) then 'New Year''s Day'
    when value = pg_catalog.make_date(year_number, 1, 6) then 'Epiphany'
    when value = easter + 1 then 'Easter Monday'
    when value = pg_catalog.make_date(year_number, 5, 1) then 'State Holiday'
    when value = easter + 39 then 'Ascension Day'
    when value = easter + 50 then 'Whit Monday'
    when value = easter + 60 then 'Corpus Christi'
    when value = pg_catalog.make_date(year_number, 8, 15) then 'Assumption Day'
    when value = pg_catalog.make_date(year_number, 10, 26) then 'Austrian National Day'
    when value = pg_catalog.make_date(year_number, 11, 1) then 'All Saints'' Day'
    when value = pg_catalog.make_date(year_number, 12, 8) then 'Immaculate Conception'
    when value = pg_catalog.make_date(year_number, 12, 25) then 'Christmas Day'
    when value = pg_catalog.make_date(year_number, 12, 26) then 'St Stephen''s Day'
    else null
  end;
end
$$;

revoke all on function private.austrian_public_holiday(date) from public, anon;
grant execute on function private.austrian_public_holiday(date) to authenticated;

create or replace function public.ensure_assignment_worker_available()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  worker_status text;
  station_active boolean;
  holiday_name text;
begin
  if TG_OP = 'UPDATE' then
    if new."workerId" is not distinct from old."workerId"
       and new."stationId" is not distinct from old."stationId"
       and new.date is not distinct from old.date then
      return new;
    end if;
  end if;

  holiday_name := private.austrian_public_holiday(new.date::date);
  if holiday_name is not null then
    raise exception 'The workplace is closed on %.', holiday_name;
  end if;

  select status into worker_status
  from public.workers
  where id = new."workerId"
  for share;

  select active into station_active
  from public.stations
  where id = new."stationId"
  for share;

  if worker_status is distinct from 'available' then
    raise exception 'This worker is unavailable.';
  end if;
  if station_active is distinct from true then
    raise exception 'This station is inactive.';
  end if;
  return new;
end
$$;
