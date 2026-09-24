import type { Worker, WorkerStatus } from '../../types/Worker'
import type { Station } from '../../types/Station'
import {
  ActionIcon,
  Badge,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
interface WorkerCardProps {
  worker: Worker
  selectedWorker: Worker | null
  onSelectWorker: (value: Worker) => void
  stations: Station[]
  onUpdateWorker: (value: Worker) => void
}

function WorkerCard({
  worker,
  selectedWorker,
  onSelectWorker,
  stations,
  onUpdateWorker,
}: WorkerCardProps) {
  const isSelected = worker.id === selectedWorker?.id
  const colors: Record<WorkerStatus, string> = {
    available: 'blue',
    late: 'orange',
    sick: 'red',
    holiday: 'yellow',
    inactive: 'gray',
  }
  const preferredStation = stations.find(
    (station) => station.id === worker.preferredStationId,
  )
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
  return (
    <Paper
      withBorder
      p="xs"
      radius="md"
      onClick={() => onSelectWorker(worker)}
      bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}
      style={{
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        borderColor: isSelected ? 'var(--mantine-color-blue-6)' : undefined,
      }}
    >
      <Group wrap="nowrap">
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} truncate>
            {worker.name}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {preferredStation
              ? `Main: ${preferredStation.name}`
              : 'No main station'}
          </Text>
        </Stack>
        <Badge color={colors[worker.status]} variant="light">
          {statusLabel(worker.status)}
        </Badge>
        <Menu shadow="md" width={220} position="bottom-end">
          <Menu.Target>
            <ActionIcon
              aria-label={`Quick options for ${worker.name}`}
              variant="subtle"
              onClick={(event) => event.stopPropagation()}
            >
              •••
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown
            className="worker-options-menu"
            onClick={(event) => event.stopPropagation()}
          >
            <Menu.Label>Status</Menu.Label>
            {statuses.map((status) => (
              <Menu.Item
                key={status}
                onClick={() => onUpdateWorker({ ...worker, status })}
              >
                {statusLabel(status)}
                {worker.status === status ? ' ✓' : ''}
              </Menu.Item>
            ))}
            <Menu.Divider />
            <Menu.Label>Main station</Menu.Label>
            <Menu.Item
              onClick={() =>
                onUpdateWorker({ ...worker, preferredStationId: null })
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
                    onUpdateWorker({
                      ...worker,
                      preferredStationId: station.id,
                    })
                  }
                >
                  {station.name}
                  {worker.preferredStationId === station.id ? ' ✓' : ''}
                </Menu.Item>
              ))}
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Paper>
  )
}

export default WorkerCard
