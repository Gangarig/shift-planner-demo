export type WorkerStatus =
  'available' | 'late' | 'sick' | 'holiday' | 'inactive'

export interface Worker {
  id: string
  name: string
  status: WorkerStatus
  role: 'worker' | 'manager' | 'admin' | 'owner' | 'accountant'
  email: string
  phoneNumber?: string
  vacationDays?: number
  plusHours?: number
  preferredStationId?: string | null
}

export type NewWorker = Omit<Worker, 'id'>
