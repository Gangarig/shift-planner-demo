import { useState } from 'react'
import type { Station } from '../types/Station'
import useApp from '../hooks/useApp'
import useStation from '../hooks/useStation'
import Search from '../components/Search'
import StationForm from '../components/stations/StationForm'
import StationSort from '../components/stations/StationSort'
import StationList from '../components/stations/StationList'
import StationDetail from '../components/stations/StationDetail'
import StationEdit from '../components/stations/StationEdit'
import { useDisclosure } from '@mantine/hooks'
import {
  Badge,
  Box,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'

function StationsPage() {
  const [stationSelection, setSelectedStation] = useState<Station | null>(null)
  const [search, setSearch] = useState<string>('')
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure(false)
  const { sortedStations, sortOrderStation, setSortOrderStation } =
    useStation(search)
  const {
    stations,
    assignments,
    createStation,
    updateStation,
    removeStation,
    loadingStations,
    stationsError,
  } = useApp()
  const selectedStation =
    stations.find((s) => s.id === stationSelection?.id) ?? null
  return (
    <Box pos="relative" className="page-container">
      <LoadingOverlay
        visible={loadingStations}
        loaderProps={{ children: 'Loading...' }}
      />
      {stations.length === 0 && !loadingStations && (
        <Text>No stations found</Text>
      )}
      {stationsError && <Text color="red">Could not load stations</Text>}
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <div>
            <Group gap="xs">
              <Title order={1}>Stations</Title>
              <Badge variant="light">{stations.length}</Badge>
            </Group>
            <Text c="dimmed">Organize the places your team works.</Text>
          </div>
          <Button onClick={openCreate}>Add station</Button>
        </Group>
        <Paper withBorder p="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Search search={search} onSearch={setSearch} />
            <StationSort
              sortOrderStation={sortOrderStation}
              onSortStation={setSortOrderStation}
            />
          </SimpleGrid>
        </Paper>
        <SimpleGrid cols={{ base: 1, md: selectedStation ? 2 : 1 }}>
          {!stationsError &&
            stations.length > 0 &&
            sortedStations.length === 0 && (
              <Text>No stations match your search.</Text>
            )}
          <StationList
            stations={sortedStations}
            selectedStation={selectedStation}
            onSelectedStation={setSelectedStation}
          />
          {selectedStation && (
            <Stack>
              <StationDetail
                assignments={assignments}
                selectedStation={selectedStation}
                onSelectedStation={setSelectedStation}
              />
              <StationEdit
                key={JSON.stringify(selectedStation)}
                selectedStation={selectedStation}
                onUpdateStation={updateStation}
                onRemoveStation={removeStation}
              />
            </Stack>
          )}
        </SimpleGrid>
      </Stack>
      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title="Add station"
        centered
      >
        <StationForm
          stations={stations}
          onCreateStation={async (station) => {
            const ok = await createStation(station)
            if (ok) closeCreate()
            return ok
          }}
        />
      </Modal>
    </Box>
  )
}
export default StationsPage
