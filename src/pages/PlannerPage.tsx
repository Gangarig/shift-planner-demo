import { useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import useApp from '../hooks/useApp'
import { useAuth } from '../context/AuthContext'
import { fromDateKey, toDateKey } from '../lib/dateUtils'
import { assignmentProblem } from '../lib/plannerRules'
import type { Assignment } from '../types/Assignment'
import { austrianPublicHoliday } from '../lib/austrianHolidays'

type Selection = { kind: 'worker' | 'assignment'; id: string }
export default function PlannerPage() {
  const app = useApp()
  const { user } = useAuth()
  const canEdit = ['manager', 'admin', 'owner'].includes(user?.role ?? '')
  const [selection, setSelection] = useState<Selection | null>(null)
  const dragging = useRef<Selection | null>(null)
  const [density, setDensity] = useState('comfortable')
  const [search, setSearch] = useState('')
  const [workerSearch, setWorkerSearch] = useState('')
  const [target, setTarget] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const [editor, setEditor] = useState<{
    stationId: string
    date: string
    id?: string
  } | null>(null)
  const [workerId, setWorkerId] = useState('')
  const [note, setNote] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dayEditor, setDayEditor] = useState<string | null>(null)
  const [dayNote, setDayNote] = useState('')
  const [confirmPublish, setConfirmPublish] = useState(false)
  const days = app.weekDays
  const dates = new Set(days.map((d) => toDateKey(d.date)))
  const weekAssignments = app.assignments.filter(
    (a) =>
      dates.has(toDateKey(a.date)) &&
      !app.companyClosures.some(
        (item) =>
          item.start_date <= toDateKey(a.date) &&
          item.end_date >= toDateKey(a.date),
      ),
  )
  const stations = app.stations.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )
  const workers = app.workers.filter((w) =>
    w.name.toLowerCase().includes(workerSearch.toLowerCase()),
  )
  const sourceAssignment =
    selection?.kind === 'assignment'
      ? app.assignments.find((a) => a.id === selection.id)
      : undefined
  const selectedName = selection
    ? app.workers.find(
        (w) => w.id === (sourceAssignment?.workerId ?? selection.id),
      )?.name
    : ''
  const loading =
    app.loadingAssignments || app.loadingWorkers || app.loadingStations
  const isPublished = app.weeklyPlan?.status === 'published'
  const dateLabel = (date: Date) =>
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const blockingAbsence = (workerId: string, date: Date) =>
    app.absences.find(
      (item) =>
        item.workerId === workerId &&
        item.status !== 'late' &&
        item.startDate <= toDateKey(date) &&
        item.endDate >= toDateKey(date),
    )
  const companyClosure = (date: Date) =>
    app.companyClosures.find(
      (item) =>
        item.start_date <= toDateKey(date) && item.end_date >= toDateKey(date),
    )

  function weeklyPlanText() {
    const week = `${dateLabel(days[0].date)} – ${dateLabel(days[4].date)}, ${days[0].date.getFullYear()}`
    const lines = [`Shift Planner`, `Week ${week}`]
    for (const day of days) {
      const holiday = austrianPublicHoliday(day.date)
      const closure = companyClosure(day.date)
      lines.push(
        '',
        day.date.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }),
      )
      if (holiday || closure) {
        lines.push(`Closed — ${holiday ?? closure?.label}`)
        continue
      }
      const dailyNote = app.dailyNotes.find(
        (item) => item.date === toDateKey(day.date),
      )?.note
      if (dailyNote) lines.push(`Note: ${dailyNote}`)
      for (const station of app.stations) {
        if (!station.active) continue
        const date = toDateKey(day.date)
        const stationAssignments = weekAssignments.filter(
          (item) =>
            item.stationId === station.id && toDateKey(item.date) === date,
        )
        const names = stationAssignments.map(
          (item) =>
            `${app.workers.find((worker) => worker.id === item.workerId)?.name ?? 'Unknown'}${item.startTime || item.endTime ? ` (${item.startTime || '?'}–${item.endTime || '?'})` : ''}${item.note ? ` — ${item.note}` : ''}`,
        )
        lines.push(`${station.name}: ${names.join(', ') || 'Open'}`)
      }
    }
    return lines.join('\n')
  }

  async function shareWeeklyPlan() {
    const text = weeklyPlanText()
    const title = `Shift Planner · ${dateLabel(days[0].date)} – ${dateLabel(days[4].date)}`
    if (navigator.share) {
      try {
        await navigator.share({ title, text })
        return
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === 'AbortError')
          return
      }
    }
    const opened = window.open(
      `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${text}`)}`,
      '_blank',
      'noopener,noreferrer',
    )
    if (!opened && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      notifications.show({
        color: 'blue',
        title: 'Plan copied',
        message: 'Paste it into WhatsApp or another group.',
      })
    }
  }

  async function save(work: () => Promise<boolean>) {
    if (lock.current) return false
    lock.current = true
    setBusy(true)
    setMessage('')
    try {
      const ok = await work()
      if (ok) {
        setSelection(null)
        setEditor(null)
        setConfirmDelete(false)
      }
      return ok
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function place(stationId: string, date: Date, picked = selection) {
    if (!canEdit || !picked || busy) return
    const assignment =
      picked.kind === 'assignment'
        ? app.assignments.find((a) => a.id === picked.id)
        : undefined
    if (picked.kind === 'assignment' && !assignment) {
      setMessage('That assignment no longer exists. Refresh the planner.')
      return
    }
    const id = assignment?.workerId ?? picked.id
    const closure = companyClosure(date)
    if (closure) {
      setMessage(`${closure.label}: the workplace is closed on this date.`)
      return
    }
    const absence = blockingAbsence(id, date)
    if (absence) {
      setMessage(
        `${absence.status === 'holiday' ? 'Vacation' : 'Sick leave'} is recorded for this worker on this date.`,
      )
      return
    }
    const problem = assignmentProblem(
      app.workers.find((w) => w.id === id),
      app.stations.find((s) => s.id === stationId),
      date,
      app.assignments,
      app.absences,
      assignment?.id,
    )
    if (problem) {
      setMessage(problem)
      return
    }
    const station = app.stations.find((s) => s.id === stationId)
    await save(() =>
      assignment
        ? app.updateAssignment({
            ...assignment,
            stationId,
            date,
            source: 'manual',
          })
        : app.createAssignment({
            workerId: id,
            stationId,
            date,
            note: null,
            source: 'manual',
            startTime: station?.defaultStartTime,
            endTime: station?.defaultEndTime,
          }),
    )
  }
  function openCell(stationId: string, date: Date, assignment?: Assignment) {
    if (selection && !assignment) {
      void place(stationId, date)
      return
    }
    setEditor({ stationId, date: toDateKey(date), id: assignment?.id })
    const station = app.stations.find((s) => s.id === stationId)
    setWorkerId(assignment?.workerId ?? '')
    setNote(assignment?.note ?? '')
    setStartTime(assignment?.startTime ?? station?.defaultStartTime ?? '')
    setEndTime(assignment?.endTime ?? station?.defaultEndTime ?? '')
    setConfirmDelete(false)
    setMessage('')
  }
  async function submit() {
    if (!editor) return
    const date = fromDateKey(editor.date)
    const existing = app.assignments.find((a) => a.id === editor.id)
    const closure = companyClosure(date)
    if (closure) {
      setMessage(`${closure.label}: the workplace is closed on this date.`)
      return
    }
    // A note-only edit remains valid when a worker later becomes unavailable.
    const noteOnly = existing && existing.workerId === workerId
    const absence = blockingAbsence(workerId, date)
    if (!noteOnly && absence) {
      setMessage(
        `${absence.status === 'holiday' ? 'Vacation' : 'Sick leave'} is recorded for this worker on this date.`,
      )
      return
    }
    const problem = noteOnly
      ? null
      : assignmentProblem(
          app.workers.find((w) => w.id === workerId),
          app.stations.find((s) => s.id === editor.stationId),
          date,
          app.assignments,
          app.absences,
          editor.id,
        )
    if (problem) {
      setMessage(problem)
      return
    }
    if (startTime && endTime && startTime >= endTime) {
      setMessage('End time must be after start time.')
      return
    }
    const value = {
      workerId,
      stationId: editor.stationId,
      date,
      note: note.trim() || null,
      source:
        existing && existing.workerId === workerId
          ? existing.source
          : ('manual' as const),
      startTime: startTime || null,
      endTime: endTime || null,
    }
    await save(() =>
      editor.id
        ? app.updateAssignment({ ...value, id: editor.id })
        : app.createAssignment(value),
    )
  }
  function shiftWeek(offset: number) {
    const next = new Date(app.monday)
    next.setDate(next.getDate() + offset)
    app.setSelectedWeekDate(next)
    setSelection(null)
    setMessage('')
  }
  const workingDays = days.filter(
    (day) => !austrianPublicHoliday(day.date) && !companyClosure(day.date),
  )
  const workerWeekSummary = (workerId: string) => {
    const leaveDays = workingDays.filter((day) =>
      blockingAbsence(workerId, day.date),
    )
    const vacationDays = leaveDays.filter(
      (day) => blockingAbsence(workerId, day.date)?.status === 'holiday',
    ).length
    const sickDays = leaveDays.length - vacationDays
    const assignedDates = new Set(
      weekAssignments
        .filter((item) => item.workerId === workerId)
        .map((item) => toDateKey(item.date)),
    )
    const canReceiveAssignment = workingDays.some(
      (day) =>
        !blockingAbsence(workerId, day.date) &&
        !assignedDates.has(toDateKey(day.date)),
    )
    const leave = [
      vacationDays ? `Vacation ${vacationDays}d` : '',
      sickDays ? `Sick ${sickDays}d` : '',
    ]
      .filter(Boolean)
      .join(' · ')
    return { canReceiveAssignment, leave }
  }
  const coverage =
    app.stations.filter((s) => s.active).length * workingDays.length
  return (
    <Stack className="page-container planner-page" gap="sm">
      <Group justify="space-between" className="planner-heading">
        <div>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed">
            Your workspace / Schedule
          </Text>
          <Title order={1}>Weekly planner</Title>
          <Text c="dimmed">
            {canEdit
              ? 'Choose a worker, then click an empty cell. Dragging works too.'
              : 'Published team schedule · read-only.'}
          </Text>
        </div>
        <Group className="planner-actions">
          {canEdit && (
            <Button
              variant="filled"
              loading={busy}
              onClick={() =>
                void save(
                  async () => (await app.autoAssignPreferredWorkers()) !== null,
                )
              }
            >
              Fill main stations
            </Button>
          )}
          {canEdit && (
            <Button
              color="green"
              loading={busy}
              onClick={() => setConfirmPublish(true)}
            >
              {isPublished ? 'Publish update' : 'Publish week'}
            </Button>
          )}
          <Button variant="light" onClick={() => void shareWeeklyPlan()}>
            Share weekly plan
          </Button>
          <Button variant="default" onClick={() => window.print()}>
            Print A4
          </Button>
          <Badge variant="light" color={isPublished ? 'green' : 'gray'}>
            {isPublished
              ? `Published · revision ${app.weeklyPlan?.revision}`
              : 'Draft'}
          </Badge>
          {canEdit && (
            <Badge variant="light" color="blue">
              {weekAssignments.length} scheduled ·{' '}
              {Math.max(
                0,
                coverage -
                  new Set(
                    weekAssignments
                      .filter(
                        (a) =>
                          app.stations.find((s) => s.id === a.stationId)
                            ?.active,
                      )
                      .map((a) => `${a.stationId}-${toDateKey(a.date)}`),
                  ).size,
              )}{' '}
              open
            </Badge>
          )}
        </Group>
      </Group>
      <Text className="print-week-title" fw={700}>
        Week {dateLabel(days[0].date)} – {dateLabel(days[4].date)},{' '}
        {days[0].date.getFullYear()}
      </Text>
      <Paper withBorder p="md" className="planner-week-controls">
        <Group justify="space-between">
          <Group>
            <Button
              variant="default"
              aria-label="Previous week"
              onClick={() => shiftWeek(-7)}
            >
              ←
            </Button>
            <Text fw={700}>
              {dateLabel(days[0].date)} – {dateLabel(days[4].date)},{' '}
              {days[0].date.getFullYear()}
            </Text>
            <Button
              variant="default"
              aria-label="Next week"
              onClick={() => shiftWeek(7)}
            >
              →
            </Button>
            <Button
              variant="subtle"
              onClick={() => {
                app.setSelectedWeekDate(new Date())
                setSelection(null)
              }}
            >
              Today
            </Button>
          </Group>
          <Group>
            <TextInput
              aria-label="Jump to week"
              type="date"
              value={toDateKey(app.monday)}
              onChange={(e) => {
                if (e.currentTarget.value) {
                  app.setSelectedWeekDate(fromDateKey(e.currentTarget.value))
                  setSelection(null)
                }
              }}
            />
            <SegmentedControl
              aria-label="Grid density"
              value={density}
              onChange={setDensity}
              data={[
                { label: 'Compact', value: 'compact' },
                { label: 'Comfortable', value: 'comfortable' },
              ]}
            />
          </Group>
        </Group>
      </Paper>
      {(message ||
        app.assignmentsError ||
        app.workersError ||
        app.stationsError) && (
        <Alert color="red" title="Please check">
          {message ||
            app.assignmentsError ||
            app.workersError ||
            app.stationsError}
        </Alert>
      )}
      {!canEdit && !isPublished && (
        <Alert color="blue" title="This week is not published yet">
          A manager or administrator is still preparing the weekly plan.
        </Alert>
      )}
      {selection && (
        <Alert
          color="blue"
          title={
            selectedName ? 'Selected: ' + selectedName : 'Assignment selected'
          }
        >
          <Group justify="space-between">
            <Text size="sm">
              Click an empty cell to{' '}
              {selection.kind === 'assignment'
                ? 'move this assignment'
                : 'assign this worker'}
              .
            </Text>
            <Button
              variant="subtle"
              size="xs"
              onClick={() => setSelection(null)}
            >
              Cancel selection
            </Button>
          </Group>
        </Alert>
      )}
      <div
        className={`schedule-layout${canEdit ? '' : ' schedule-layout--single'}`}
        aria-busy={busy || loading}
      >
        <Stack gap="sm">
          <TextInput
            className="planner-station-search"
            placeholder="Find a station…"
            aria-label="Find a station"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <div className={'schedule-scroll ' + density}>
            <table className="schedule-table">
              <thead>
                <tr>
                  <th scope="col">Station</th>
                  {days.map((d) => {
                    const date = toDateKey(d.date)
                    const holiday = austrianPublicHoliday(d.date)
                    const closure = companyClosure(d.date)
                    const closedLabel = holiday ?? closure?.label
                    const dailyNote = app.dailyNotes.find(
                      (n) => n.date === date,
                    )
                    return (
                      <th
                        scope="col"
                        key={d.label}
                        className={`${date === toDateKey(new Date()) ? 'today ' : ''}${closedLabel ? 'holiday-column' : ''}`}
                      >
                        {d.label.slice(0, 3)}
                        <span>{dateLabel(d.date)}</span>
                        {closedLabel ? (
                          <small>Closed · {closedLabel}</small>
                        ) : (
                          <button
                            type="button"
                            className="day-note-button"
                            onClick={() => {
                              setDayEditor(date)
                              setDayNote(dailyNote?.note ?? '')
                            }}
                          >
                            {dailyNote
                              ? `Note: ${dailyNote.note}`
                              : canEdit
                                ? '+ Daily note'
                                : ''}
                          </button>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => (
                  <tr key={station.id}>
                    <th scope="row">
                      {station.name}
                      {!station.active && <small>Inactive</small>}
                    </th>
                    {days.map((day) => {
                      const date = toDateKey(day.date)
                      const holiday = austrianPublicHoliday(day.date)
                      const closure = companyClosure(day.date)
                      const cellKey = station.id + date
                      const cellAssignments = weekAssignments.filter(
                        (a) =>
                          a.stationId === station.id &&
                          toDateKey(a.date) === date,
                      )
                      if (holiday || closure)
                        return (
                          <td
                            key={date}
                            className="holiday-cell"
                            aria-label={`${station.name}, ${date}, closed for ${holiday ?? closure?.label}`}
                          />
                        )
                      return (
                        <td
                          key={date}
                          className={target === cellKey ? 'drop-target' : ''}
                          onDragOver={(e) => {
                            if (
                              canEdit &&
                              dragging.current &&
                              station.active &&
                              !busy
                            ) {
                              e.preventDefault()
                              e.dataTransfer.dropEffect =
                                dragging.current.kind === 'assignment'
                                  ? 'move'
                                  : 'copy'
                              setTarget(cellKey)
                            }
                          }}
                          onDragLeave={() => setTarget('')}
                          onDrop={(e) => {
                            e.preventDefault()
                            setTarget('')
                            const picked = dragging.current
                            dragging.current = null
                            void place(station.id, day.date, picked)
                          }}
                        >
                          <div
                            className={
                              'schedule-cell ' +
                              (cellAssignments.length ? 'filled' : 'empty')
                            }
                            title={
                              canEdit && station.active
                                ? `Click to assign a worker to ${station.name}`
                                : undefined
                            }
                            onClick={() => {
                              if (
                                canEdit &&
                                station.active &&
                                !busy &&
                                !loading
                              )
                                openCell(station.id, day.date)
                            }}
                          >
                            {cellAssignments.map((assignment) => {
                              const worker = app.workers.find(
                                (w) => w.id === assignment.workerId,
                              )
                              return (
                                <button
                                  type="button"
                                  className="cell-assignment"
                                  key={assignment.id}
                                  disabled={busy || loading}
                                  aria-label={
                                    (worker?.name ?? 'Unknown worker') +
                                    ', ' +
                                    station.name +
                                    ', ' +
                                    date
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    openCell(station.id, day.date, assignment)
                                  }}
                                  draggable={canEdit && !busy}
                                  onDragStart={(e) => {
                                    dragging.current = {
                                      kind: 'assignment',
                                      id: assignment.id,
                                    }
                                    e.dataTransfer.setData(
                                      'text/plain',
                                      assignment.id,
                                    )
                                    e.dataTransfer.effectAllowed = 'move'
                                  }}
                                  onDragEnd={() => {
                                    dragging.current = null
                                    setTarget('')
                                  }}
                                >
                                  <strong>
                                    {worker?.name ?? 'Unknown worker'}
                                  </strong>
                                  {(assignment.startTime ||
                                    assignment.endTime) && (
                                    <span>
                                      {assignment.startTime || '?'}–
                                      {assignment.endTime || '?'}
                                    </span>
                                  )}
                                  {assignment.note && (
                                    <span>{assignment.note}</span>
                                  )}
                                </button>
                              )
                            })}
                            {!cellAssignments.length && (
                              <span className="cell-empty-label">
                                {canEdit && station.active ? '+' : 'Open'}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!stations.length && (
            <Text c="dimmed" ta="center" p="xl">
              {loading
                ? 'Loading stations…'
                : 'No stations match. Add a station from the Stations page.'}
            </Text>
          )}
          <Text
            className="planner-save-status"
            size="xs"
            c="dimmed"
            aria-live="polite"
          >
            {busy
              ? 'Saving your changes…'
              : 'Stations can have several workers; each worker can only be assigned once per day.'}
          </Text>
        </Stack>
        {canEdit && (
          <Paper withBorder p="xs" className="schedule-roster">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={700}>Team</Text>
                <Badge color="gray" variant="light">
                  {app.workers.length}
                </Badge>
              </Group>
              <TextInput
                placeholder="Find a worker…"
                aria-label="Find a worker"
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.currentTarget.value)}
              />
              <div className="roster-list">
                {workers.map((w) => {
                  const summary = workerWeekSummary(w.id)
                  const enabled =
                    canEdit &&
                    ['available', 'late'].includes(w.status) &&
                    summary.canReceiveAssignment &&
                    !busy
                  return (
                    <button
                      type="button"
                      className={
                        'roster-worker ' +
                        (selection?.kind === 'worker' && selection.id === w.id
                          ? 'selected'
                          : '')
                      }
                      key={w.id}
                      disabled={!enabled}
                      draggable={enabled}
                      onClick={() => setSelection({ kind: 'worker', id: w.id })}
                      onDragStart={(e) => {
                        dragging.current = { kind: 'worker', id: w.id }
                        e.dataTransfer.setData('text/plain', w.id)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onDragEnd={() => {
                        dragging.current = null
                        setTarget('')
                      }}
                    >
                      <span>
                        <strong>{w.name}</strong>
                        <small>
                          {summary.leave || w.status} ·{' '}
                          {
                            weekAssignments.filter((a) => a.workerId === w.id)
                              .length
                          }{' '}
                          shifts
                        </small>
                      </span>
                    </button>
                  )
                })}
              </div>
              {!workers.length && (
                <Text size="sm" c="dimmed">
                  No matching workers.
                </Text>
              )}
            </Stack>
          </Paper>
        )}
      </div>
      <Modal
        opened={!!editor}
        onClose={() => {
          if (!busy) setEditor(null)
        }}
        title={editor?.id ? 'Assignment details' : 'Assign a worker'}
        centered
      >
        {editor && (
          <Stack>
            <Text fw={600}>
              {app.stations.find((s) => s.id === editor.stationId)?.name} ·{' '}
              {dateLabel(fromDateKey(editor.date))}
            </Text>
            {message && <Alert color="red">{message}</Alert>}
            <Select
              label="Worker"
              searchable
              value={workerId}
              onChange={(value) => setWorkerId(value ?? '')}
              disabled={!canEdit || busy}
              data={app.workers.map((w) => ({
                value: w.id,
                label: w.name,
                disabled:
                  w.id !== workerId &&
                  !!assignmentProblem(
                    w,
                    app.stations.find((s) => s.id === editor.stationId),
                    fromDateKey(editor.date),
                    app.assignments,
                    app.absences,
                    editor.id,
                  ),
              }))}
            />
            <Group grow>
              <TextInput
                type="time"
                label="Start time"
                value={startTime}
                onChange={(e) => setStartTime(e.currentTarget.value)}
                readOnly={!canEdit}
              />
              <TextInput
                type="time"
                label="End time"
                value={endTime}
                onChange={(e) => setEndTime(e.currentTarget.value)}
                readOnly={!canEdit}
              />
            </Group>
            <Textarea
              label="Handover note"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
              readOnly={!canEdit}
              autosize
              minRows={3}
              maxLength={2000}
            />
            {canEdit && (
              <Group justify="space-between">
                <Button
                  loading={busy}
                  disabled={!workerId}
                  onClick={() => void submit()}
                >
                  Save assignment
                </Button>
                {editor.id && (
                  <Button
                    variant="light"
                    disabled={busy}
                    onClick={() => {
                      setSelection({ kind: 'assignment', id: editor.id! })
                      setEditor(null)
                    }}
                  >
                    Move to another cell
                  </Button>
                )}
              </Group>
            )}
            {editor.id &&
              canEdit &&
              (confirmDelete ? (
                <Alert color="red" title="Remove this assignment?">
                  <Button
                    color="red"
                    loading={busy}
                    onClick={() => {
                      const a = app.assignments.find((a) => a.id === editor.id)
                      if (a) void save(() => app.removeAssignment(a))
                    }}
                  >
                    Confirm removal
                  </Button>
                </Alert>
              ) : (
                <Button
                  color="red"
                  variant="subtle"
                  onClick={() => setConfirmDelete(true)}
                >
                  Remove assignment
                </Button>
              ))}
          </Stack>
        )}
      </Modal>
      <Modal
        opened={!!dayEditor}
        onClose={() => {
          if (!busy) setDayEditor(null)
        }}
        title="Daily note"
        centered
      >
        {dayEditor && (
          <Stack>
            <Text c="dimmed" size="sm">
              {fromDateKey(dayEditor).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Textarea
              autoFocus
              label="Note for the whole day"
              placeholder="Deliveries, training, appointments, special instructions…"
              value={dayNote}
              onChange={(e) => setDayNote(e.currentTarget.value)}
              readOnly={!canEdit}
              autosize
              minRows={4}
              maxLength={4000}
            />
            {canEdit && (
              <Button
                loading={busy}
                onClick={() =>
                  void save(async () => {
                    const ok = await app.saveDailyNote(dayEditor, dayNote)
                    if (ok) setDayEditor(null)
                    return ok
                  })
                }
              >
                Save daily note
              </Button>
            )}
          </Stack>
        )}
      </Modal>
      <Modal
        opened={confirmPublish}
        onClose={() => {
          if (!busy) setConfirmPublish(false)
        }}
        title={
          isPublished ? 'Publish schedule update?' : 'Publish this weekly plan?'
        }
        centered
      >
        <Stack>
          <Text size="sm">
            The entire team will be able to see this week and will receive an
            in-app notification.
          </Text>
          <Text size="sm" c="dimmed">
            Managers and administrators can continue editing; linked workers
            will be notified about later assignment changes.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              disabled={busy}
              onClick={() => setConfirmPublish(false)}
            >
              Cancel
            </Button>
            <Button
              color="green"
              loading={busy}
              onClick={() =>
                void save(app.publishWeeklyPlan).then((ok) => {
                  if (ok) setConfirmPublish(false)
                })
              }
            >
              Confirm publication
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
