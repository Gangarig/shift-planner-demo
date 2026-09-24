import { Badge, Box, Group, Paper, Stack, Text } from '@mantine/core'
import type { Assignment } from '../../types/Assignment'
import type { Worker, WorkerStatus } from '../../types/Worker'

interface PlannerWorkerListProps {
  workers: Worker[]
  assignments: Assignment[]
}

const statusColors: Record<WorkerStatus, string> = {
  available: 'blue',
  late: 'orange',
  sick: 'gray',
  holiday: 'gray',
  inactive: 'gray',
}
const unavailableStatuses: WorkerStatus[] = ['sick', 'holiday', 'inactive']

function PlannerWorkerList({ workers, assignments }: PlannerWorkerListProps) {
  const availableWorkers = workers
    .filter((worker) => ['available', 'late'].includes(worker.status))
    .sort((a, b) => a.name.localeCompare(b.name))
  const unavailableWorkers = workers
    .filter((worker) => !['available', 'late'].includes(worker.status))
    .sort((a, b) => a.name.localeCompare(b.name))

  function workerCard(worker: Worker, draggable: boolean) {
    const shiftCount = assignments.filter(
      (assignment) => assignment.workerId === worker.id,
    ).length
    return (
      <Paper
        withBorder
        px={6}
        py={5}
        key={worker.id}
        radius="sm"
        draggable={draggable}
        onDragStart={(event) => {
          event.dataTransfer.setData('application/x-shift-worker', worker.id)
          event.dataTransfer.setData('text/plain', worker.id)
          event.dataTransfer.effectAllowed = 'copy'
        }}
        style={{ cursor: draggable ? 'grab' : 'default' }}
      >
        <Group wrap="nowrap" gap={6}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={600} truncate>
              {worker.name}
            </Text>
          </div>
          <Text size="xs" c="dimmed">
            {shiftCount}
          </Text>
          <Box
            w={7}
            h={7}
            title={worker.status}
            bg={`var(--mantine-color-${statusColors[worker.status]}-6)`}
            style={{ borderRadius: '50%', flexShrink: 0 }}
          />
        </Group>
      </Paper>
    )
  }

  return (
    <Paper withBorder p="sm" className="planner-workers">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700} size="sm">
            Available workers
          </Text>
          <Badge color="green" variant="light">
            {availableWorkers.length}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed">
          Drag a worker onto an empty shift cell.
        </Text>
        {availableWorkers.map((worker) => workerCard(worker, true))}
        {availableWorkers.length === 0 && (
          <Text size="sm" c="dimmed">
            No available workers.
          </Text>
        )}
        <Text fw={700} size="sm" mt="sm">
          Unavailable
        </Text>
        {unavailableStatuses.map((status) => {
          const group = unavailableWorkers.filter(
            (worker) => worker.status === status,
          )
          return (
            group.length > 0 && (
              <Stack gap={4} key={status}>
                <Text tt="capitalize" size="xs" c="dimmed">
                  {status}
                </Text>
                {group.map((worker) => workerCard(worker, false))}
              </Stack>
            )
          )
        })}
      </Stack>
    </Paper>
  )
}

export default PlannerWorkerList
