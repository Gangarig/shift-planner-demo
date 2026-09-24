import { Paper, Text } from '@mantine/core'
import type { Station } from '../../types/Station'
import type { Worker } from '../../types/Worker'
import type {
  Assignment,
  NewAssignment,
  Weekdays,
} from '../../types/Assignment'
import { toDateKey } from '../../lib/dateUtils'
import GridCell from './GridCell'

interface PlannerGridProps {
  stations: Station[]
  workers: Worker[]
  assignments: Assignment[]
  onCreateAssignment: (assignment: NewAssignment) => void
  onUpdateAssignment: (assignment: Assignment) => void
  onRemoveAssignment: (assignment: Assignment) => void
  onSelectAssignment: (value: Assignment | null) => void
  weekDays: Weekdays
}

function PlannerGrid({
  stations,
  workers,
  assignments,
  onCreateAssignment,
  onUpdateAssignment,
  onRemoveAssignment,
  onSelectAssignment,
  weekDays,
}: PlannerGridProps) {
  const canAssignWorker = (
    workerId: string,
    date: Date,
    ignoredAssignmentId?: string,
  ) => {
    const worker = workers.find((item) => item.id === workerId)
    return (
      !!worker &&
      ['available', 'late'].includes(worker.status) &&
      !assignments.some(
        (item) =>
          item.id !== ignoredAssignmentId &&
          item.workerId === workerId &&
          toDateKey(item.date) === toDateKey(date),
      )
    )
  }
  return (
    <Paper withBorder className="planner-matrix">
      <div className="planner-matrix-grid">
        <div className="planner-corner">
          <Text size="xs" fw={700} c="dimmed">
            Station
          </Text>
        </div>
        {weekDays.map((day) => (
          <div className="planner-day-header" key={day.label}>
            <Text fw={700} size="sm">
              <span className="day-name-full">{day.label}</span>
              <span className="day-name-short">{day.label.slice(0, 3)}</span>
            </Text>
          </div>
        ))}
        {stations.map((station) => (
          <div className="planner-row" key={station.id}>
            <div className="planner-station-header">
              <Text fw={600} size="sm" truncate>
                {station.name}
              </Text>
            </div>
            {weekDays.map((day) => {
              const assignment =
                assignments.find(
                  (item) =>
                    item.stationId === station.id &&
                    toDateKey(item.date) === toDateKey(day.date),
                ) ?? null
              const worker = assignment
                ? (workers.find((item) => item.id === assignment.workerId) ??
                  null)
                : null
              return (
                <GridCell
                  key={`${station.id}-${toDateKey(day.date)}`}
                  station={station}
                  date={day.date}
                  worker={worker}
                  assignment={assignment}
                  canAssignWorker={canAssignWorker}
                  onCreateAssignment={(workerId, stationId, date) =>
                    onCreateAssignment({
                      workerId,
                      stationId,
                      date,
                      note: null,
                      source: 'manual',
                    })
                  }
                  onMoveAssignment={(value, stationId, date) =>
                    onUpdateAssignment({
                      ...value,
                      stationId,
                      date,
                      source: 'manual',
                    })
                  }
                  onRemoveAssignment={onRemoveAssignment}
                  onSelectAssignment={onSelectAssignment}
                />
              )
            })}
          </div>
        ))}
      </div>
      {stations.length === 0 && (
        <Text c="dimmed" ta="center" p="xl">
          No stations yet.
        </Text>
      )}
    </Paper>
  )
}

export default PlannerGrid
