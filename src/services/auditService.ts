import { supabase } from '../lib/supabase'
export interface AuditEvent {
  id: number
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  created_at: string
}
export async function loadAuditEvents() {
  const { data, error } = await supabase
    .from('security_audit_log')
    .select('id,actor_id,action,entity_type,entity_id,created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []) as AuditEvent[]
}
export async function loadAllAuditEvents() {
  const events: AuditEvent[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('id,actor_id,action,entity_type,entity_id,created_at')
      .order('created_at', { ascending: true })
      .range(from, from + 999)
    if (error) throw error
    events.push(...((data ?? []) as AuditEvent[]))
    if (!data || data.length < 1000) return events
  }
}
