import type { Worker } from '../../types/Worker'
import StatusPanel from './StatusPanel'
import { Paper, Stack, Text } from '@mantine/core'
import type { Station } from '../../types/Station'
interface WorkerListProps {
  workers: Worker[]
  selectedWorker: Worker | null
  setSelectedWorker: (value: Worker) => void | undefined
  stations: Station[]
  onUpdateWorker: (value: Worker) => void
}

function WorkerList({
  workers,
  selectedWorker,
  setSelectedWorker,
  stations,
  onUpdateWorker,
}: WorkerListProps) {
  const availableWorkers = workers.filter((worker) =>
    ['available', 'late'].includes(worker.status),
  )
  const notAvailableWorkers = workers.filter(
    (worker) => !['available', 'late'].includes(worker.status),
  )

  return (
    <Paper withBorder p="sm">
      <Stack gap="md">
        <StatusPanel
          title={'available'}
          workers={availableWorkers}
          selectedWorker={selectedWorker}
          onSelectWorker={setSelectedWorker}
          stations={stations}
          onUpdateWorker={onUpdateWorker}
        />
        <StatusPanel
          title={'not available'}
          workers={notAvailableWorkers}
          selectedWorker={selectedWorker}
          onSelectWorker={setSelectedWorker}
          stations={stations}
          onUpdateWorker={onUpdateWorker}
        />
        {workers.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            No workers found.
          </Text>
        )}
      </Stack>
    </Paper>
  )
}

export default WorkerList
