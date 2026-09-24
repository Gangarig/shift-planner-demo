import { createContext } from 'react'
import type { Worker, NewWorker } from '../types/Worker'
import type { Station, NewStation } from '../types/Station'
import type { Assignment, NewAssignment } from '../types/Assignment'
import type { DailyNote } from '../types/DailyNote'
import type { NewWorkerAbsence, WorkerAbsence } from '../types/WorkerAbsence'
import type { WeeklyPlan } from '../types/WeeklyPlan'
import type { CompanyClosure, NewCompanyClosure } from '../types/CompanyClosure'

export interface AppContextValue {
  workers: Worker[]
  stations: Station[]
  assignments: Assignment[]
  dailyNotes: DailyNote[]
  absences: WorkerAbsence[]
  weeklyPlan: WeeklyPlan | null
  companyClosures: CompanyClosure[]
  createWorker: (worker: NewWorker) => Promise<boolean>
  updateWorker: (worker: Worker) => Promise<boolean>
  removeWorker: (worker: Worker) => Promise<boolean>
  createStation: (station: NewStation) => Promise<boolean>
  updateStation: (station: Station) => Promise<boolean>
  removeStation: (station: Station) => Promise<boolean>
  createAssignment: (assignment: NewAssignment) => Promise<boolean>
  updateAssignment: (assignment: Assignment) => Promise<boolean>
  removeAssignment: (assignment: Assignment) => Promise<boolean>
  saveDailyNote: (date: string, note: string) => Promise<boolean>
  autoAssignPreferredWorkers: () => Promise<number | null>
  createAbsence: (value: NewWorkerAbsence) => Promise<boolean>
  removeAbsence: (id: string) => Promise<boolean>
  publishWeeklyPlan: () => Promise<boolean>
  createCompanyClosure: (value: NewCompanyClosure) => Promise<boolean>
  removeCompanyClosure: (id: string) => Promise<boolean>
  refreshPlanningData: () => Promise<void>
  monday: Date
  weekDays: { label: string; date: Date }[]
  selectedWeekDate: Date
  setSelectedWeekDate: (date: Date) => void
  loadingWorkers: boolean
  workersError: string | null
  loadingStations: boolean
  stationsError: string | null
  loadingAssignments: boolean
  assignmentsError: string | null
}

export const AppContext = createContext<AppContextValue | null>(null)
