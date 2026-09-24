import type { Station } from '../../types/Station'
import { Badge, Group, Paper, Text } from '@mantine/core'
interface StationCardProps {
  station: Station
  selectedStation: Station | null
  onSelectedStation: (value: Station | null) => void
}
function StationCard({
  station,
  selectedStation,
  onSelectedStation,
}: StationCardProps) {
  const isSelected = station.id === selectedStation?.id
  return (
    <Paper
      component="button"
      type="button"
      withBorder
      p="md"
      bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}
      style={{
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        borderColor: isSelected ? 'var(--mantine-color-blue-6)' : undefined,
      }}
      onClick={() => onSelectedStation(station)}
    >
      <Group justify="space-between">
        <Text fw={600}>{station.name}</Text>
        <Badge color={station.active ? 'green' : 'gray'} variant="light">
          {station.active ? 'Active' : 'Inactive'}
        </Badge>
      </Group>
    </Paper>
  )
}

export default StationCard
