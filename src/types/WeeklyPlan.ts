export interface WeeklyPlan {
  week_start: string
  status: 'draft' | 'published'
  revision: number
  published_at: string | null
  published_by: string | null
}
