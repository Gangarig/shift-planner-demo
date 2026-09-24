import React, { useState } from 'react'
import type { Worker, WorkerStatus } from '../../types/Worker'
import { Button, Paper, Select, Stack, Text, TextInput } from '@mantine/core'
import type { Station } from '../../types/Station'
interface WorkerFormProps {
  selectedWorker: Worker
  stations: Station[]
  onUpdateWorker: (value: Worker) => void
}
function WorkerEdit({
  selectedWorker,
  onUpdateWorker,
  stations,
}: WorkerFormProps) {
  const [name, setName] = useState(selectedWorker.name)
  const [email, setEmail] = useState(selectedWorker.email)
  const [role, setRole] = useState<Worker['role']>(selectedWorker.role)
  const [status, setStatus] = useState<WorkerStatus>(selectedWorker.status)
  const [preferredStationId, setPreferredStationId] = useState<string | null>(
    selectedWorker.preferredStationId ?? null,
  )
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name || !email) return
    onUpdateWorker({
      ...selectedWorker,
      name,
      email,
      role,
      status,
      preferredStationId,
    })
  }
  return (
    <Paper withBorder p="lg">
      <form onSubmit={handleSubmit}>
        <Stack>
          <Text fw={600}>Edit worker</Text>
          <TextInput
            required
            label="Name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <TextInput
            required
            type="email"
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <Select
            required
            label="Role"
            value={role}
            data={['worker', 'manager', 'admin', 'accountant', 'owner']}
            onChange={(value) => setRole((value ?? 'worker') as Worker['role'])}
          />
          <Select
            required
            label="Status"
            value={status}
            data={['available', 'late', 'sick', 'holiday', 'inactive']}
            onChange={(value) =>
              setStatus((value ?? 'available') as WorkerStatus)
            }
          />
          <Select
            clearable
            searchable
            label="Main station"
            description="Used when automatically filling a week."
            value={preferredStationId}
            data={stations
              .filter((s) => s.active)
              .map((s) => ({ value: s.id, label: s.name }))}
            onChange={setPreferredStationId}
          />
          <Button type="submit" variant="light">
            Save changes
          </Button>
        </Stack>
      </form>
    </Paper>
  )
}
export default WorkerEdit
