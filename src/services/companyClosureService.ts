import { supabase } from '../lib/supabase'
import type { CompanyClosure, NewCompanyClosure } from '../types/CompanyClosure'

export async function loadCompanyClosures() {
  const { data, error } = await supabase
    .from('company_closures')
    .select('id,label,start_date,end_date')
    .order('start_date')
  if (error) throw error
  return (data ?? []) as CompanyClosure[]
}
export async function createCompanyClosure(value: NewCompanyClosure) {
  const { error } = await supabase
    .from('company_closures')
    .insert(value)
    .select('id')
    .single()
  if (error) throw error
}
export async function removeCompanyClosure(id: string) {
  const { error } = await supabase
    .from('company_closures')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw error
}
