import type { Station } from '../../types/Station'
import StationCard from './StationCard'
import { Paper, Stack, Text } from '@mantine/core'
interface StationListProps {
  stations: Station[]
  selectedStation: Station | null
  onSelectedStation: (value: Station | null) => void
}

function StationList({
  stations,
  selectedStation,
  onSelectedStation,
}: StationListProps) {
  return (
    <Paper withBorder p="lg">
      <Stack>
        {stations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            selectedStation={selectedStation}
            onSelectedStation={onSelectedStation}
          />
        ))}
        {stations.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            No stations found.
          </Text>
        )}
      </Stack>
    </Paper>
  )
}

export default StationList
