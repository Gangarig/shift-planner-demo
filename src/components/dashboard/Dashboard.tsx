import {
  Avatar,
  Badge,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { toDateKey } from '../../lib/dateUtils'
import useApp from '../../hooks/useApp'

const statusColors = {
  available: 'blue',
  late: 'orange',
  sick: 'gray',
  holiday: 'gray',
  inactive: 'gray',
} as const

interface MetricCardProps {
  label: string
  value: number
  detail: string
  symbol: string
  color: string
}

function MetricCard({ label, value, detail, symbol, color }: MetricCardProps) {
  return (
    <Paper withBorder p="sm" className="metric-card">
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
          <Text fz={24} fw={700} lh={1}>
            {value}
          </Text>
          <Text size="xs" c="dimmed">
            {detail}
          </Text>
        </Stack>
        <ThemeIcon size={36} radius="md" color={color} variant="light">
          <Text fw={800}>{symbol}</Text>
        </ThemeIcon>
      </Group>
    </Paper>
  )
}

function Dashboard() {
  const { workers, stations, assignments: allAssignments, weekDays } = useApp()
  const dates = new Set(weekDays.map((d) => toDateKey(d.date)))
  const assignments = allAssignments.filter((a) => dates.has(toDateKey(a.date)))

  const totals = workers.reduce(
    (sum, worker) => ({
      vacationDays: sum.vacationDays + (worker.vacationDays ?? 0),
      plusHours: sum.plusHours + (worker.plusHours ?? 0),
    }),
    { vacationDays: 0, plusHours: 0 },
  )

  const workerCounts = workers.reduce<
    Record<keyof typeof statusColors, number>
  >(
    (sum, worker) => {
      sum[worker.status] += 1
      return sum
    },
    { available: 0, late: 0, sick: 0, holiday: 0, inactive: 0 },
  )

  const activeStations = stations.filter((station) => station.active).length
  const workersWithoutAssignments = workers.filter(
    (worker) =>
      !assignments.some((assignment) => assignment.workerId === worker.id),
  )
  const assignmentCounts = assignments.reduce<Record<string, number>>(
    (sum, assignment) => {
      sum[assignment.workerId] = (sum[assignment.workerId] ?? 0) + 1
      return sum
    },
    {},
  )
  const rankedWorkers = workers
    .map((worker) => ({ worker, count: assignmentCounts[worker.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
  const mostLoaded = rankedWorkers[0]
  const leastLoaded = [...rankedWorkers].sort((a, b) => a.count - b.count)[0]

  return (
    <Stack gap="sm" className="dashboard-summary">
      <div>
        <Title order={1}>Dashboard</Title>
        <Text c="dimmed">
          A quick look at this week's team and station coverage.
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
        <MetricCard
          label="Team members"
          value={workers.length}
          detail={`${workerCounts.available + workerCounts.late} working`}
          symbol="W"
          color="blue"
        />
        <MetricCard
          label="Active stations"
          value={activeStations}
          detail={`${stations.length - activeStations} inactive`}
          symbol="S"
          color="gray"
        />
        <MetricCard
          label="Assignments"
          value={assignments.length}
          detail={`${workersWithoutAssignments.length} workers unassigned`}
          symbol="A"
          color="blue"
        />
        <MetricCard
          label="Overtime"
          value={totals.plusHours}
          detail={`${totals.vacationDays} vacation days`}
          symbol="H"
          color="gray"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper withBorder p="sm">
          <Stack gap="xs">
            <div>
              <Text fw={700}>Team availability</Text>
              <Text size="sm" c="dimmed">
                Current status across the whole team
              </Text>
            </div>
            {Object.entries(workerCounts).map(([status, count]) => {
              const percentage = workers.length
                ? (count / workers.length) * 100
                : 0
              return (
                <Stack key={status} gap={5}>
                  <Group justify="space-between">
                    <Badge
                      color={statusColors[status as keyof typeof statusColors]}
                      variant="light"
                    >
                      {status}
                    </Badge>
                    <Text size="sm" fw={600}>
                      {count}
                    </Text>
                  </Group>
                  <Progress
                    value={percentage}
                    color={statusColors[status as keyof typeof statusColors]}
                    size="sm"
                  />
                </Stack>
              )
            })}
          </Stack>
        </Paper>

        <Paper withBorder p="sm">
          <Stack gap="xs">
            <div>
              <Text fw={700}>Workload</Text>
              <Text size="sm" c="dimmed">
                Assignment balance for this week
              </Text>
            </div>
            {mostLoaded ? (
              <>
                <Group>
                  <Avatar color="blue">
                    {mostLoaded.worker.name.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">
                      Most assigned
                    </Text>
                    <Text fw={600}>{mostLoaded.worker.name}</Text>
                  </div>
                  <Badge>{mostLoaded.count} shifts</Badge>
                </Group>
                <Group>
                  <Avatar color="gray">
                    {leastLoaded.worker.name.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">
                      Least assigned
                    </Text>
                    <Text fw={600}>{leastLoaded.worker.name}</Text>
                  </div>
                  <Badge color="gray">{leastLoaded.count} shifts</Badge>
                </Group>
              </>
            ) : (
              <Text c="dimmed" size="sm">
                No workers to summarize yet.
              </Text>
            )}
            <Text size="sm" c="dimmed" mt="xs">
              {workersWithoutAssignments.length === 0
                ? 'Everyone has at least one assignment.'
                : `${workersWithoutAssignments.map((worker) => worker.name).join(', ')} ${
                    workersWithoutAssignments.length === 1 ? 'has' : 'have'
                  } no assignments.`}
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}

export default Dashboard
