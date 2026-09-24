import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { AppContext } from './AppContext'
import type { Worker, NewWorker } from '../types/Worker'
import type { Assignment, NewAssignment } from '../types/Assignment'
import type { Station, NewStation } from '../types/Station'
import {
  createWorker,
  removeWorker,
  loadWorkers,
} from '../services/workerService'
import {
  loadStations,
  createStation,
  updateStation,
  removeStation,
} from '../services/stationService'
import {
  loadAssignments,
  createAssignment,
  updateAssignment,
  removeAssignment,
} from '../services/assignmentService'
import { loadDailyNotes, saveDailyNote } from '../services/dailyNoteService'
import type { DailyNote } from '../types/DailyNote'
import type { NewWorkerAbsence, WorkerAbsence } from '../types/WorkerAbsence'
import {
  createAbsence,
  loadAbsences,
  removeAbsence,
} from '../services/absenceService'
import { supabase } from '../lib/supabase'
import { errorMessage } from '../lib/plannerRules'
import { getMondayOfWeek, getWeekDays, toDateKey } from '../lib/dateUtils'
import type { WeeklyPlan } from '../types/WeeklyPlan'
import {
  loadWeeklyPlan,
  publishWeeklyPlan,
} from '../services/weeklyPlanService'
import type { CompanyClosure, NewCompanyClosure } from '../types/CompanyClosure'
import {
  createCompanyClosure,
  loadCompanyClosures,
  removeCompanyClosure,
} from '../services/companyClosureService'

function AppProvider() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([])
  const [absences, setAbsences] = useState<WorkerAbsence[]>([])
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null)
  const [companyClosures, setCompanyClosures] = useState<CompanyClosure[]>([])
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [loadingStations, setLoadingStations] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [workersError, setWorkersError] = useState<string | null>(null)
  const [stationsError, setStationsError] = useState<string | null>(null)
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null)
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date())
  const monday = getMondayOfWeek(selectedWeekDate)
  const weekDays = getWeekDays(monday)
  const weekStart = toDateKey(monday)
  const weekEnd = toDateKey(weekDays[4].date)
  const activeWeek = useRef(weekStart)
  const assignmentRequest = useRef(0)
  activeWeek.current = weekStart

  useEffect(() => {
    void Promise.all([refreshWorkers(), refreshStations()])
  }, [])

  // The date key is the deliberate refresh boundary; both loaders read this render's week.
  useEffect(() => {
    void Promise.all([
      refreshAssignments(),
      refreshDailyNotes(),
      refreshAbsences(),
      refreshWeeklyPlan(),
      refreshCompanyClosures(),
    ])
    // These loaders deliberately capture the selected week's date boundaries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  useEffect(() => {
    const channel = supabase
      .channel(`planner-live-${weekStart}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments' },
        () => {
          void refreshAssignments()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_notes' },
        () => {
          void refreshDailyNotes()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_absences' },
        () => {
          void Promise.all([refreshAbsences(), refreshAssignments()])
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workers' },
        () => {
          void refreshWorkers()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stations' },
        () => {
          void refreshStations()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'weekly_plans' },
        () => {
          void Promise.all([
            refreshWeeklyPlan(),
            refreshAssignments(),
            refreshDailyNotes(),
          ])
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_closures' },
        () => {
          void Promise.all([refreshCompanyClosures(), refreshAssignments()])
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
    // Reconnect for the selected week so callbacks use its date boundaries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  async function refreshWorkers() {
    try {
      setLoadingWorkers(true)
      setWorkersError(null)
      setWorkers(await loadWorkers())
    } catch (error) {
      setWorkersError('Could not load workers')
      notifications.show({
        color: 'red',
        title: 'Worker loading failed',
        message: errorMessage(error),
      })
      return false
    } finally {
      setLoadingWorkers(false)
    }
  }

  async function refreshStations() {
    try {
      setLoadingStations(true)
      setStationsError(null)
      setStations(await loadStations())
    } catch (error) {
      setStationsError('Could not load stations')
      notifications.show({
        color: 'red',
        title: 'Station loading failed',
        message: errorMessage(error),
      })
      return false
    } finally {
      setLoadingStations(false)
    }
  }

  async function refreshAssignments() {
    const requestedWeek = weekStart
    const request = ++assignmentRequest.current
    try {
      setLoadingAssignments(true)
      setAssignmentsError(null)
      const nextAssignments = await loadAssignments(weekStart, weekEnd)
      if (
        activeWeek.current === requestedWeek &&
        assignmentRequest.current === request
      )
        setAssignments(nextAssignments)
    } catch (error) {
      if (
        activeWeek.current === requestedWeek &&
        assignmentRequest.current === request
      ) {
        setAssignmentsError('Could not load assignments')
        notifications.show({
          color: 'red',
          title: 'Assignment loading failed',
          message: errorMessage(error),
        })
      }
      return false
    } finally {
      if (
        activeWeek.current === requestedWeek &&
        assignmentRequest.current === request
      )
        setLoadingAssignments(false)
    }
  }

  async function refreshDailyNotes() {
    const requestedWeek = weekStart
    try {
      const rows = await loadDailyNotes(weekStart, weekEnd)
      if (activeWeek.current === requestedWeek) setDailyNotes(rows)
    } catch (error) {
      if (activeWeek.current === requestedWeek)
        notifications.show({
          color: 'red',
          title: 'Daily notes failed',
          message: errorMessage(error),
        })
    }
  }

  async function refreshAbsences() {
    const requestedWeek = weekStart
    try {
      const rows = await loadAbsences(weekStart, weekEnd)
      if (activeWeek.current === requestedWeek) setAbsences(rows)
    } catch (error) {
      if (activeWeek.current === requestedWeek)
        notifications.show({
          color: 'red',
          title: 'Absences failed',
          message: errorMessage(error),
        })
    }
  }

  async function refreshWeeklyPlan() {
    const requestedWeek = weekStart
    try {
      const plan = await loadWeeklyPlan(weekStart)
      if (activeWeek.current === requestedWeek) setWeeklyPlan(plan)
    } catch (error) {
      if (activeWeek.current === requestedWeek)
        notifications.show({
          color: 'red',
          title: 'Plan status failed',
          message: errorMessage(error),
        })
    }
  }

  async function refreshCompanyClosures() {
    try {
      setCompanyClosures(await loadCompanyClosures())
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Company closure loading failed',
        message: errorMessage(error),
      })
    }
  }

  async function handleCreateCompanyClosure(value: NewCompanyClosure) {
    try {
      await createCompanyClosure(value)
      await Promise.all([refreshCompanyClosures(), refreshAssignments()])
      notifications.show({
        color: 'green',
        title: 'Betriebsurlaub saved',
        message: 'The selected dates are now closed.',
      })
      return true
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Betriebsurlaub failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleRemoveCompanyClosure(id: string) {
    try {
      await removeCompanyClosure(id)
      await refreshCompanyClosures()
      notifications.show({
        color: 'green',
        title: 'Betriebsurlaub removed',
        message: 'The selected dates are open again.',
      })
      return true
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Removal failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handlePublishWeeklyPlan() {
    try {
      setWeeklyPlan(await publishWeeklyPlan(weekStart))
      notifications.show({
        color: 'green',
        title:
          weeklyPlan?.status === 'published'
            ? 'Plan update published'
            : 'Plan published',
        message: 'The team can now see this week and has been notified.',
      })
      return true
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Publishing failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleCreateAbsence(value: NewWorkerAbsence) {
    try {
      await createAbsence(value)
      await Promise.all([refreshAbsences(), refreshAssignments()])
      notifications.show({
        color: 'green',
        title: 'Absence saved',
        message: 'Affected assignments were updated.',
      })
      return true
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Absence failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleRemoveAbsence(id: string) {
    try {
      await removeAbsence(id)
      await refreshAbsences()
      notifications.show({
        color: 'green',
        title: 'Absence removed',
        message: 'Existing assignments were not recreated automatically.',
      })
      return true
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Removal failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleSaveDailyNote(date: string, note: string) {
    try {
      await saveDailyNote(date, note)
      await refreshDailyNotes()
      notifications.show({
        color: 'green',
        title: 'Daily note saved',
        message: note.trim()
          ? 'The note is visible on the weekly plan.'
          : 'The daily note was removed.',
      })
      return true
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Daily note failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleAutoAssignPreferredWorkers() {
    try {
      const { data, error } = await supabase.rpc(
        'auto_assign_preferred_workers',
        { week_start: toDateKey(monday) },
      )
      if (error) throw error
      await refreshAssignments()
      const count = Number(data ?? 0)
      notifications.show({
        color: count ? 'green' : 'blue',
        title: 'Main stations filled',
        message: count
          ? `${count} assignment(s) added.`
          : 'Everyone is already assigned or has no main station.',
      })
      return count
    } catch (error) {
      notifications.show({
        color: 'red',
        title: 'Automatic assignment failed',
        message: errorMessage(error),
      })
      return null
    }
  }

  async function handleCreateAssignment(assignment: NewAssignment) {
    try {
      setAssignmentsError(null)
      await createAssignment(assignment)
      notifications.show({
        color: 'green',
        title: 'Assignment created',
        message: 'The assignment was saved',
      })
      await refreshAssignments()
      return true
    } catch (error) {
      setAssignmentsError('Could not create assignment')
      notifications.show({
        color: 'red',
        title: 'Assignment failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleUpdateAssignment(assignment: Assignment) {
    try {
      setAssignmentsError(null)
      await updateAssignment(assignment)
      notifications.show({
        color: 'green',
        title: 'Assignment updated',
        message: 'The assignment was saved',
      })
      await refreshAssignments()
      return true
    } catch (error) {
      setAssignmentsError('Could not update assignment')
      notifications.show({
        color: 'red',
        title: 'Assignment failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleRemoveAssignment(assignment: Assignment) {
    try {
      setAssignmentsError(null)
      await removeAssignment(assignment)
      notifications.show({
        color: 'green',
        title: 'Assignment removed',
        message: 'The shift is now unassigned',
      })
      await refreshAssignments()
      return true
    } catch (error) {
      setAssignmentsError('Could not remove assignment')
      notifications.show({
        color: 'red',
        title: 'Assignment failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleCreateStation(station: NewStation) {
    try {
      await createStation(station)
      await refreshStations()
      notifications.show({
        color: 'green',
        title: 'Station created',
        message: 'The station was added',
      })
      return true
    } catch (error) {
      setStationsError('Could not create station')
      notifications.show({
        color: 'red',
        title: 'Station failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleUpdateStation(station: Station) {
    try {
      await updateStation(station)
      await refreshStations()
      notifications.show({
        color: 'green',
        title: 'Station updated',
        message: 'The station was saved',
      })
      return true
    } catch (error) {
      setStationsError('Could not update station')
      notifications.show({
        color: 'red',
        title: 'Station failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleRemoveStation(station: Station) {
    if (assignments.some((assignment) => assignment.stationId === station.id)) {
      setStationsError('Station has assignments')
      notifications.show({
        color: 'red',
        title: 'Station cannot be deleted',
        message: 'Remove its assignments first',
      })
      return false
    }
    try {
      await removeStation(station)
      await refreshStations()
      notifications.show({
        color: 'green',
        title: 'Station deleted',
        message: 'The station was removed',
      })
      return true
    } catch (error) {
      setStationsError('Could not remove station')
      notifications.show({
        color: 'red',
        title: 'Station failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleCreateWorker(worker: NewWorker) {
    try {
      await createWorker(worker)
      await refreshWorkers()
      notifications.show({
        color: 'green',
        title: 'Worker created',
        message: 'The worker was added',
      })
      return true
    } catch (error) {
      setWorkersError('Could not create worker')
      notifications.show({
        color: 'red',
        title: 'Worker failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleUpdateWorker(worker: Worker) {
    const selectedWeek = new Set(weekDays.map((day) => toDateKey(day.date)))
    const workerAssignments =
      ['available', 'late'].includes(worker.status) ||
      workers.find((w) => w.id === worker.id)?.status === worker.status
        ? []
        : assignments.filter(
            (assignment) =>
              assignment.workerId === worker.id &&
              selectedWeek.has(toDateKey(assignment.date)),
          )
    try {
      setWorkersError(null)
      const { error } = await supabase.rpc('update_worker_for_week', {
        worker_record: worker,
        week_start: toDateKey(monday),
      })
      if (error) throw error
      await Promise.all([refreshWorkers(), refreshAssignments()])
      notifications.show({
        color: 'green',
        title: 'Worker updated',
        message: workerAssignments.length
          ? `${workerAssignments.length} assignment(s) removed from this week because ${worker.name} is ${worker.status}`
          : 'The worker was saved',
      })
      return true
    } catch (error) {
      setWorkersError('Could not update worker')
      notifications.show({
        color: 'red',
        title: 'Worker update failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function handleRemoveWorker(worker: Worker) {
    try {
      await removeWorker(worker)
      await Promise.all([refreshWorkers(), refreshAssignments()])
      notifications.show({
        color: 'green',
        title: 'Worker deleted',
        message: 'The worker and their assignments were permanently removed',
      })
      return true
    } catch (error) {
      setWorkersError('Could not delete worker')
      notifications.show({
        color: 'red',
        title: 'Worker failed',
        message: errorMessage(error),
      })
      return false
    }
  }

  async function refreshPlanningData() {
    await Promise.all([refreshAbsences(), refreshAssignments()])
  }

  function handleSelectWeek(date: Date) {
    const nextWeek = toDateKey(getMondayOfWeek(date))
    if (nextWeek !== activeWeek.current) {
      activeWeek.current = nextWeek
      assignmentRequest.current += 1
      setAssignments([])
      setDailyNotes([])
      setAbsences([])
      setWeeklyPlan(null)
    }
    setSelectedWeekDate(date)
  }

  return (
    <AppContext.Provider
      value={{
        workers,
        stations,
        assignments,
        dailyNotes,
        absences,
        weeklyPlan,
        companyClosures,
        createWorker: handleCreateWorker,
        updateWorker: handleUpdateWorker,
        removeWorker: handleRemoveWorker,
        createStation: handleCreateStation,
        updateStation: handleUpdateStation,
        removeStation: handleRemoveStation,
        createAssignment: handleCreateAssignment,
        updateAssignment: handleUpdateAssignment,
        removeAssignment: handleRemoveAssignment,
        saveDailyNote: handleSaveDailyNote,
        autoAssignPreferredWorkers: handleAutoAssignPreferredWorkers,
        createAbsence: handleCreateAbsence,
        removeAbsence: handleRemoveAbsence,
        publishWeeklyPlan: handlePublishWeeklyPlan,
        createCompanyClosure: handleCreateCompanyClosure,
        removeCompanyClosure: handleRemoveCompanyClosure,
        refreshPlanningData,
        monday,
        weekDays,
        selectedWeekDate,
        setSelectedWeekDate: handleSelectWeek,
        loadingWorkers,
        workersError,
        loadingStations,
        stationsError,
        loadingAssignments,
        assignmentsError,
      }}
    >
      <Outlet />
    </AppContext.Provider>
  )
}

export default AppProvider
