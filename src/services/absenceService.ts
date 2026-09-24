import { supabase } from '../lib/supabase'
import type { NewWorkerAbsence, WorkerAbsence } from '../types/WorkerAbsence'
export async function loadAbsences(from: string, to: string) {
  const { data, error } = await supabase
    .from('worker_absences')
    .select('*')
    .lte('startDate', to)
    .gte('endDate', from)
    .order('startDate')
  if (error) throw error
  return (data ?? []) as WorkerAbsence[]
}
export async function createAbsence(value: NewWorkerAbsence) {
  const { error } = await supabase
    .from('worker_absences')
    .insert(value)
    .select('id')
    .single()
  if (error) throw error
}
export async function removeAbsence(id: string) {
  const { error } = await supabase
    .from('worker_absences')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw error
}
