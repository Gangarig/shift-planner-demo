import { supabase } from '../lib/supabase'
import type { Worker, NewWorker } from '../types/Worker'
export async function loadWorkers() {
  const { data, error } = await supabase.from('workers').select('*')
  if (error) throw error
  return (data ?? []) as Worker[]
}
export async function updateWorker(worker: Worker) {
  const { error } = await supabase
    .from('workers')
    .update(worker)
    .eq('id', worker.id)
    .select('id')
    .single()
  if (error) throw error
}
export async function createWorker(worker: NewWorker) {
  const { error } = await supabase.from('workers').insert(worker)
  if (error) throw error
}
export async function removeWorker(worker: Worker) {
  const { error } = await supabase
    .from('workers')
    .delete()
    .eq('id', worker.id)
    .select('id')
    .single()
  if (error) throw error
}
