import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import useApp from '../../hooks/useApp'
import { toDateKey } from '../../lib/dateUtils'

export default function WorkerDashboard() {
  const { user } = useAuth()
  const app = useApp()
  const worker = app.workers.find((item) => item.id === user?.workerId)
  if (!worker)
    return (
      <Stack>
        <Title order={1}>My dashboard</Title>
        <Alert color="orange" title="Worker record not linked">
          Ask the owner to connect your login to your worker record in Team &
          Access.
        </Alert>
      </Stack>
    )
  const dates = new Set(app.weekDays.map((day) => toDateKey(day.date)))
  const weekStart = toDateKey(app.weekDays[0].date)
  const weekEnd = toDateKey(app.weekDays[app.weekDays.length - 1].date)
  const shifts = app.assignments
    .filter(
      (item) => item.workerId === worker.id && dates.has(toDateKey(item.date)),
    )
    .sort((a, b) => toDateKey(a.date).localeCompare(toDateKey(b.date)))
  const absences = app.absences.filter(
    (item) =>
      item.workerId === worker.id &&
      item.startDate <= weekEnd &&
      item.endDate >= weekStart,
  )
  const stationName = (id: string) =>
    app.stations.find((item) => item.id === id)?.name ?? 'Unknown station'
  return (
    <Stack gap="sm">
      <div>
        <Title order={1}>My dashboard</Title>
        <Text c="dimmed">Your personal schedule and status for this week.</Text>
      </div>
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">
            My status
          </Text>
          <Badge mt={6} variant="light">
            {worker.status}
          </Badge>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">
            My shifts this week
          </Text>
          <Text fw={700} size="xl">
            {shifts.length}
          </Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">
            My main station
          </Text>
          <Text fw={700}>
            {worker.preferredStationId
              ? stationName(worker.preferredStationId)
              : 'Not assigned'}
          </Text>
        </Paper>
      </SimpleGrid>
      <Paper withBorder p="md">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={700}>My shifts</Text>
            <Button
              component={Link}
              to="/planner"
              size="compact-sm"
              variant="light"
            >
              View full plan
            </Button>
          </Group>
          {shifts.map((shift) => (
            <Group key={shift.id} justify="space-between">
              <div>
                <Text fw={600}>
                  {new Date(
                    `${toDateKey(shift.date)}T12:00:00`,
                  ).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text size="sm" c="dimmed">
                  {stationName(shift.stationId)}
                </Text>
              </div>
              <Text size="sm">
                {shift.startTime || '?'}–{shift.endTime || '?'}
              </Text>
            </Group>
          ))}
          {!shifts.length && (
            <Text size="sm" c="dimmed">
              No shifts assigned to you this week.
            </Text>
          )}
        </Stack>
      </Paper>
      <Paper withBorder p="md">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={700}>My leave and absences</Text>
            <Button
              component={Link}
              to="/payroll"
              size="compact-sm"
              variant="light"
            >
              Requests & payslips
            </Button>
          </Group>
          {absences.map((item) => (
            <Group key={item.id} justify="space-between">
              <Text size="sm">
                {item.startDate} → {item.endDate}
              </Text>
              <Badge
                color={item.status === 'sick' ? 'gray' : 'orange'}
                variant="light"
              >
                {item.status === 'holiday' ? 'Vacation' : item.status}
              </Badge>
            </Group>
          ))}
          {!absences.length && (
            <Text size="sm" c="dimmed">
              No absence recorded for this week.
            </Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
