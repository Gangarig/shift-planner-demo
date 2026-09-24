import type { WorkerStatus } from './Worker'
export interface WorkerAbsence {
  id: string
  workerId: string
  startDate: string
  endDate: string
  status: Extract<WorkerStatus, 'late' | 'sick' | 'holiday'>
  note?: string | null
}
export type NewWorkerAbsence = Omit<WorkerAbsence, 'id'>
