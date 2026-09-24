import { useState } from 'react'
import { Button, Select, Stack, Textarea } from '@mantine/core'
import type { Station } from '../../types/Station'
import type { Worker } from '../../types/Worker'
import type {
  Assignment,
  NewAssignment,
  Weekdays,
} from '../../types/Assignment'
import { fromDateKey, toDateKey } from '../../lib/dateUtils'

interface AssignmentControlsProps {
  stations: Station[]
  workers: Worker[]
  assignments: Assignment[]
  onCreateAssignment: (value: NewAssignment) => Promise<boolean>
  onCreated?: () => void
  weekDays: Weekdays
}

function AssignmentControls({
  stations,
  workers,
  assignments,
  onCreateAssignment,
  onCreated,
  weekDays,
}: AssignmentControlsProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState('')
  const [selectedStationId, setSelectedStationId] = useState('')
  const [selectedDate, setSelectedDate] = useState(toDateKey(weekDays[0].date))
  const [note, setNote] = useState('')

  async function handleSubmit() {
    const worker = workers.find((item) => item.id === selectedWorkerId)
    const station = stations.find((item) => item.id === selectedStationId)
    if (
      !worker ||
      !station ||
      !selectedDate ||
      !station.active ||
      !['available', 'late'].includes(worker.status)
    )
      return
    const date = fromDateKey(selectedDate)
    const isWorkerTaken = assignments.some(
      (item) =>
        item.workerId === worker.id && toDateKey(item.date) === selectedDate,
    )
    if (isWorkerTaken) return
    const saved = await onCreateAssignment({
      workerId: worker.id,
      stationId: station.id,
      date,
      note: note.trim() || null,
      source: 'manual',
    })
    if (saved) onCreated?.()
  }

  return (
    <Stack gap="sm">
      <Select
        label="Station"
        placeholder="Choose station"
        searchable
        value={selectedStationId}
        data={stations.map((station) => ({
          value: station.id,
          label: station.name,
          disabled: !station.active,
        }))}
        onChange={(value) => setSelectedStationId(value ?? '')}
      />
      <Select
        label="Worker"
        placeholder="Choose worker"
        searchable
        value={selectedWorkerId}
        data={workers.map((worker) => ({
          value: worker.id,
          label: worker.name,
          disabled: !['available', 'late'].includes(worker.status),
        }))}
        onChange={(value) => setSelectedWorkerId(value ?? '')}
      />
      <Select
        label="Day"
        value={selectedDate}
        data={weekDays.map((day) => ({
          value: toDateKey(day.date),
          label: day.label,
        }))}
        onChange={(value) => setSelectedDate(value ?? '')}
      />
      <Textarea
        label="Note"
        placeholder="Optional handover note"
        autosize
        minRows={2}
        value={note}
        onChange={(event) => setNote(event.currentTarget.value)}
      />
      <Button
        fullWidth
        onClick={() => void handleSubmit()}
        disabled={!selectedWorkerId || !selectedStationId}
      >
        Create assignment
      </Button>
    </Stack>
  )
}

export default AssignmentControls
