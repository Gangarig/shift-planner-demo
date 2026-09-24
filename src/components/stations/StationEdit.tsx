import React, { useState } from 'react'
import type { Station } from '../../types/Station'
import {
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
interface StationEditProps {
  selectedStation: Station
  onUpdateStation: (value: Station) => void
  onRemoveStation: (value: Station) => void
}
function StationEdit({
  selectedStation,
  onRemoveStation,
  onUpdateStation,
}: StationEditProps) {
  const [name, setName] = useState(selectedStation.name)
  const [active, setActive] = useState(selectedStation.active)
  const [startTime, setStartTime] = useState(
    selectedStation.defaultStartTime ?? '',
  )
  const [endTime, setEndTime] = useState(selectedStation.defaultEndTime ?? '')
  function handleUpdate(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    onUpdateStation({
      ...selectedStation,
      name: name.trim(),
      active,
      defaultStartTime: startTime || null,
      defaultEndTime: endTime || null,
    })
  }
  return (
    <Paper withBorder p="lg">
      <form onSubmit={handleUpdate}>
        <Stack>
          <Text fw={600}>Edit station</Text>
          <TextInput
            required
            label="Station name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <TextInput
            type="time"
            label="Default start time"
            value={startTime}
            onChange={(event) => setStartTime(event.currentTarget.value)}
          />
          <TextInput
            type="time"
            label="Default end time"
            value={endTime}
            error={
              startTime && endTime && startTime >= endTime
                ? 'End time must be after start time'
                : undefined
            }
            onChange={(event) => setEndTime(event.currentTarget.value)}
          />
          <SegmentedControl
            fullWidth
            value={active ? 'active' : 'inactive'}
            onChange={(value) => setActive(value === 'active')}
            data={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
          <Group justify="space-between">
            <Button
              color="red"
              variant="subtle"
              type="button"
              onClick={() => onRemoveStation(selectedStation)}
            >
              Delete station
            </Button>
            <Button
              type="submit"
              variant="light"
              disabled={!!(startTime && endTime && startTime >= endTime)}
            >
              Save changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}
export default StationEdit
