import { supabase } from '../lib/supabase'
import type { WeeklyPlan } from '../types/WeeklyPlan'

export async function loadWeeklyPlan(weekStart: string) {
  const { data, error } = await supabase
    .from('weekly_plans')
    .select('week_start,status,revision,published_at,published_by')
    .eq('week_start', weekStart)
    .maybeSingle()
  if (error) throw error
  return data as WeeklyPlan | null
}

export async function publishWeeklyPlan(weekStart: string) {
  const { data, error } = await supabase
    .from('weekly_plans')
    .upsert(
      { week_start: weekStart, status: 'published' },
      { onConflict: 'week_start' },
    )
    .select('week_start,status,revision,published_at,published_by')
    .single()
  if (error) throw error
  return data as WeeklyPlan
}
