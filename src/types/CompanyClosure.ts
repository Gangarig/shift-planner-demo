export interface CompanyClosure {
  id: string
  label: string
  start_date: string
  end_date: string
}
export type NewCompanyClosure = Omit<CompanyClosure, 'id'>
