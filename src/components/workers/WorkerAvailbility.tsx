import {
  Alert,
  Badge,
  Button,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import { Link } from 'react-router-dom'
import useApp from '../../hooks/useApp'
import { toDateKey } from '../../lib/dateUtils'
import { austrianPublicHoliday } from '../../lib/austrianHolidays'
import { useAuth } from '../../context/AuthContext'
import type { WorkerStatus } from '../../types/Worker'

const statusColors = {
  available: 'green',
  late: 'orange',
  sick: 'red',
  holiday: 'yellow',
  inactive: 'gray',
} as const

function WorkerAvailability() {
  const {
    workers,
    assignments,
    stations,
    weekDays,
    updateWorker,
    weeklyPlan,
    companyClosures,
    autoAssignPreferredWorkers,
    publishWeeklyPlan,
  } = useApp()
  const { user } = useAuth()
  const canManageWorkers =
    user?.role === 'owner' || user?.role === 'admin' || user?.role === 'manager'
  const statuses: WorkerStatus[] = [
    'available',
    'late',
    'sick',
    'holiday',
    'inactive',
  ]
  const statusLabel = (status: WorkerStatus) =>
    status === 'holiday'
      ? 'Vacation'
      : status[0].toUpperCase() + status.slice(1)
  const dates = new Set(weekDays.map((day) => toDateKey(day.date)))
  const weekAssignments = assignments.filter(
    (assignment) =>
      dates.has(toDateKey(assignment.date)) &&
      !companyClosures.some(
        (item) =>
          item.start_date <= toDateKey(assignment.date) &&
          item.end_date >= toDateKey(assignment.date),
      ),
  )
  const dateLabel = (date: Date) =>
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const companyClosure = (date: Date) =>
    companyClosures.find(
      (item) =>
        item.start_date <= toDateKey(date) && item.end_date >= toDateKey(date),
    )

  if (!canManageWorkers && weeklyPlan?.status !== 'published')
    return (
      <Stack gap="sm">
        <Group justify="space-between">
          <div>
            <Text fw={700} size="lg">
              This week’s plan
            </Text>
            <Text size="sm" c="dimmed">
              The schedule will appear after publication.
            </Text>
          </div>
          <Button component={Link} to="/planner" variant="light">
            Open planner
          </Button>
        </Group>
        <Alert color="blue">
          A manager or administrator is still preparing this week.
        </Alert>
      </Stack>
    )

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end">
        <div>
          <Text fw={700} size="lg">
            This week’s plan
          </Text>
          <Text size="sm" c="dimmed">
            Trusted planners can fill, publish, print, and open the full editor
            here.
          </Text>
        </div>
        <Group>
          {canManageWorkers && (
            <Button
              variant="default"
              onClick={() => void autoAssignPreferredWorkers()}
            >
              Fill main stations
            </Button>
          )}
          {canManageWorkers && (
            <Button
              color="green"
              onClick={() => {
                if (
                  window.confirm(
                    'Publish this complete weekly plan to the team?',
                  )
                )
                  void publishWeeklyPlan()
              }}
            >
              {weeklyPlan?.status === 'published'
                ? 'Publish update'
                : 'Publish week'}
            </Button>
          )}
          <Button component={Link} to="/planner" variant="light">
            Edit planner
          </Button>
        </Group>
      </Group>
      <div className="schedule-layout dashboard-schedule-layout">
        <div className="schedule-scroll compact dashboard-schedule-scroll">
          <table className="schedule-table">
            <thead>
              <tr>
                <th scope="col">Station</th>
                {weekDays.map((day) => {
                  const holiday = austrianPublicHoliday(day.date)
                  const closure = companyClosure(day.date)
                  const closedLabel = holiday ?? closure?.label
                  return (
                    <th
                      scope="col"
                      key={toDateKey(day.date)}
                      className={closedLabel ? 'holiday-column' : ''}
                    >
                      {day.label.slice(0, 3)}
                      <span>{dateLabel(day.date)}</span>
                      {closedLabel && <small>Closed · {closedLabel}</small>}
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
                  {weekDays.map((day) => {
                    const date = toDateKey(day.date)
                    const holiday = austrianPublicHoliday(day.date)
                    const closure = companyClosure(day.date)
                    if (holiday || closure)
                      return (
                        <td
                          key={date}
                          className="holiday-cell"
                          aria-label={`${station.name}, ${date}, closed for ${holiday ?? closure?.label}`}
                        />
                      )
                    const cellAssignments = weekAssignments.filter(
                      (item) =>
                        item.stationId === station.id &&
                        toDateKey(item.date) === date,
                    )
                    return (
                      <td key={date}>
                        <div
                          className={`schedule-cell dashboard-schedule-cell ${cellAssignments.length ? 'filled' : 'empty'}`}
                        >
                          {cellAssignments.length ? (
                            cellAssignments.map((assignment) => (
                              <div
                                className="cell-assignment"
                                key={assignment.id}
                              >
                                <strong>
                                  {workers.find(
                                    (item) => item.id === assignment.workerId,
                                  )?.name ?? 'Unknown worker'}
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
                              </div>
                            ))
                          ) : (
                            <span>{station.active ? 'Open' : '—'}</span>
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
        <Paper withBorder p="xs" className="schedule-roster dashboard-roster">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={700}>Team</Text>
              <Badge color="gray" variant="light">
                {workers.length}
              </Badge>
            </Group>
            <div className="roster-list">
              {workers.map((worker) => {
                const count = weekAssignments.filter(
                  (assignment) => assignment.workerId === worker.id,
                ).length
                const content = (
                  <>
                    <span>
                      <strong>{worker.name}</strong>
                      <small>
                        {count} {count === 1 ? 'shift' : 'shifts'}
                      </small>
                    </span>
                    <Badge
                      ml="auto"
                      size="xs"
                      variant="dot"
                      color={statusColors[worker.status]}
                    >
                      {worker.status}
                    </Badge>
                  </>
                )
                return canManageWorkers ? (
                  <Menu
                    key={worker.id}
                    shadow="md"
                    width={220}
                    position="bottom-end"
                  >
                    <Menu.Target>
                      <button
                        type="button"
                        className="roster-worker dashboard-roster-worker dashboard-roster-link"
                        aria-label={`Quick options for ${worker.name}`}
                      >
                        {content}
                      </button>
                    </Menu.Target>
                    <Menu.Dropdown className="worker-options-menu">
                      <Menu.Label>Status</Menu.Label>
                      {statuses.map((status) => (
                        <Menu.Item
                          key={status}
                          onClick={() =>
                            void updateWorker({ ...worker, status })
                          }
                        >
                          {statusLabel(status)}
                          {worker.status === status ? ' ✓' : ''}
                        </Menu.Item>
                      ))}
                      <Menu.Divider />
                      <Menu.Label>Main station</Menu.Label>
                      <Menu.Item
                        onClick={() =>
                          void updateWorker({
                            ...worker,
                            preferredStationId: null,
                          })
                        }
                      >
                        No main station{!worker.preferredStationId ? ' ✓' : ''}
                      </Menu.Item>
                      {stations
                        .filter((station) => station.active)
                        .map((station) => (
                          <Menu.Item
                            key={station.id}
                            onClick={() =>
                              void updateWorker({
                                ...worker,
                                preferredStationId: station.id,
                              })
                            }
                          >
                            {station.name}
                            {worker.preferredStationId === station.id
                              ? ' ✓'
                              : ''}
                          </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                  </Menu>
                ) : (
                  <div
                    className="roster-worker dashboard-roster-worker"
                    key={worker.id}
                  >
                    {content}
                  </div>
                )
              })}
            </div>
          </Stack>
        </Paper>
      </div>
    </Stack>
  )
}

export default WorkerAvailability
