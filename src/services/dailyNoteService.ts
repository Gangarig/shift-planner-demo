import { supabase } from '../lib/supabase'
import type { DailyNote } from '../types/DailyNote'
export async function loadDailyNotes(from?: string, to?: string) {
  let query = supabase.from('daily_notes').select('id,date,note')
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)
  const { data, error } = await query.order('date')
  if (error) throw error
  return (data ?? []) as DailyNote[]
}
export async function saveDailyNote(date: string, note: string) {
  if (!note.trim()) {
    const { error } = await supabase
      .from('daily_notes')
      .delete()
      .eq('date', date)
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from('daily_notes')
    .upsert({ date, note: note.trim() }, { onConflict: 'date' })
  if (error) throw error
}
