export interface AppNotification {
  id: number
  recipient_id: string
  kind:
    | 'plan_published'
    | 'assignment_created'
    | 'assignment_updated'
    | 'assignment_removed'
  title: string
  body: string
  week_start: string | null
  read_at: string | null
  created_at: string
}
