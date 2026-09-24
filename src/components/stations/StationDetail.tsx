import type { Station } from '../../types/Station'
import type { Assignment } from '../../types/Assignment'
import { Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core'

interface StationDetailProps {
  selectedStation: Station | null
  assignments: Assignment[]
  onSelectedStation: (value: Station | null) => void
}

function StationDetail({
  assignments,
  selectedStation,
  onSelectedStation,
}: StationDetailProps) {
  const stationAssignment = assignments.filter(
    (assignment) => assignment.stationId === selectedStation?.id,
  )
  if (!selectedStation) return null
  return (
    <Paper withBorder p="lg">
      <Stack>
        <Group justify="space-between">
          <Title order={3}>{selectedStation.name}</Title>
          <Badge color={selectedStation.active ? 'green' : 'gray'}>
            {selectedStation.active ? 'Active' : 'Inactive'}
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          {stationAssignment.length} scheduled assignment
          {stationAssignment.length === 1 ? '' : 's'}
        </Text>
        {stationAssignment.map((assignment) => (
          <Paper key={assignment.id} withBorder p="sm">
            <Text fw={600}>{assignment.date.toLocaleDateString()}</Text>
            <Text size="sm" c="dimmed">
              Worker ID: {assignment.workerId}
            </Text>
            {assignment.note && <Text size="sm">{assignment.note}</Text>}
          </Paper>
        ))}
        <Button variant="default" onClick={() => onSelectedStation(null)}>
          Close
        </Button>
      </Stack>
    </Paper>
  )
}

export default StationDetail
