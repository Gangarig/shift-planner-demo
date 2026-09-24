create index weekly_plans_published_by_idx on public.weekly_plans (published_by) where published_by is not null;
