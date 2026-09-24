import { useState } from 'react'
import {
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core'
import type { Assignment } from '../../types/Assignment'
import type { Worker } from '../../types/Worker'
import type { Station } from '../../types/Station'

interface AssignmentDetailProps {
  assignment: Assignment
  workers: Worker[]
  stations: Station[]
  onEditAssignmentNote: (value: Assignment) => void
  onClose: () => void
}

function AssignmentDetail({
  assignment,
  workers,
  stations,
  onEditAssignmentNote,
  onClose,
}: AssignmentDetailProps) {
  const [note, setNote] = useState(assignment.note ?? '')
  const worker = workers.find((item) => item.id === assignment.workerId)
  const station = stations.find((item) => item.id === assignment.stationId)

  if (!worker || !station) return null

  function handleSave() {
    onEditAssignmentNote({ ...assignment, note: note.trim() })
  }

  return (
    <Paper withBorder p="lg">
      <Stack>
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={3}>Assignment details</Title>
            <Text size="sm" c="dimmed">
              Review the shift and leave a handover note.
            </Text>
          </div>
          <Badge variant="light">{assignment.date.toLocaleDateString()}</Badge>
        </Group>

        <Group>
          <div style={{ flex: 1 }}>
            <Text fw={600}>{worker.name}</Text>
            <Text size="sm" c="dimmed">
              {worker.role}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Station
            </Text>
            <Text fw={600}>{station.name}</Text>
          </div>
        </Group>

        <Textarea
          label="Assignment note"
          description="Add instructions or context for this shift."
          placeholder="No note yet"
          autosize
          minRows={3}
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={note.trim() === (assignment.note ?? '').trim()}
          >
            Save note
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

export default AssignmentDetail
