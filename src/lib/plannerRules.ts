import type { Assignment } from '../types/Assignment'
import type { Worker } from '../types/Worker'
import type { Station } from '../types/Station'
import type { WorkerAbsence } from '../types/WorkerAbsence'
import { toDateKey } from './dateUtils'
import { austrianPublicHoliday } from './austrianHolidays'

export function assignmentProblem(
  worker: Worker | undefined,
  station: Station | undefined,
  date: Date,
  assignments: Assignment[],
  absences: WorkerAbsence[] = [],
  ignoreId?: string,
) {
  if (!worker || !station) return 'Choose a worker and station.'
  if (!Number.isFinite(date.getTime())) return 'Choose a valid date.'
  const holiday = austrianPublicHoliday(date)
  if (holiday) return `${holiday} is a public holiday. The workplace is closed.`
  if (!['available', 'late'].includes(worker.status))
    return 'This worker is currently unavailable.'
  if (!station.active) return 'This station is inactive.'
  const day = toDateKey(date)
  const absence = absences.find(
    (item) =>
      item.workerId === worker.id &&
      item.status !== 'late' &&
      item.startDate <= day &&
      item.endDate >= day,
  )
  if (absence)
    return `${absence.status === 'holiday' ? 'Vacation' : 'Sick leave'} is recorded for this worker on this date.`
  if (
    assignments.some(
      (a) =>
        a.id !== ignoreId &&
        a.workerId === worker.id &&
        toDateKey(a.date) === day,
    )
  )
    return 'This worker already has an assignment on this day.'
  return null
}
export function errorMessage(error: unknown) {
  const e = error as { code?: string; message?: string }
  if (e?.code === '23505')
    return 'That worker was just booked on this day. Refresh the planner and try again.'
  if (e?.code === '42501' || e?.code === 'PGRST116')
    return 'This change was not saved. Check your access and refresh the page.'
  if (e?.code === '23503')
    return 'Remove the related assignments before deleting this record.'
  return (
    e?.message || 'The request failed. Check your connection and try again.'
  )
}
