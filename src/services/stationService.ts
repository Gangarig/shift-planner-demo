import type { Station, NewStation } from '../types/Station'
import { supabase } from '../lib/supabase'
export async function loadStations() {
  const { data, error } = await supabase.from('stations').select('*')
  if (error) throw error
  return (data ?? []) as Station[]
}
export async function createStation(station: NewStation) {
  const { error } = await supabase.from('stations').insert(station)
  if (error) throw error
}
export async function updateStation(station: Station) {
  const { error } = await supabase
    .from('stations')
    .update(station)
    .eq('id', station.id)
    .select('id')
    .single()
  if (error) throw error
}
export async function removeStation(station: Station) {
  const { error } = await supabase
    .from('stations')
    .delete()
    .eq('id', station.id)
    .select('id')
    .single()
  if (error) throw error
}
