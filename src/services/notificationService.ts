import { supabase } from '../lib/supabase'
import type { AppNotification } from '../types/AppNotification'

export async function loadNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,recipient_id,kind,title,body,week_start,read_at,created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as AppNotification[]
}

export async function markNotificationRead(id: number) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error) throw error
}
