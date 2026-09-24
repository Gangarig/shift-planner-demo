import React, { useState } from 'react'
import { Button, Select, Stack, TextInput } from '@mantine/core'
import type { NewWorker, Worker, WorkerStatus } from '../../types/Worker'
import type { Station } from '../../types/Station'

interface WorkerFormProps {
  workers: Worker[]
  stations: Station[]
  onCreateWorker: (value: NewWorker) => Promise<boolean>
}
function WorkerForm({ onCreateWorker, stations }: WorkerFormProps) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<NewWorker['role']>('worker')
  const [status, setStatus] = useState<WorkerStatus>('available')
  const [preferredStationId, setPreferredStationId] = useState<string | null>(
    null,
  )
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !email.trim()) return
    if (saving) return
    setSaving(true)
    const saved = await onCreateWorker({
      name: name.trim(),
      email: email.trim(),
      role,
      status,
      preferredStationId,
    })
    setSaving(false)
    if (!saved) return
    setName('')
    setEmail('')
    setRole('worker')
    setStatus('available')
    setPreferredStationId(null)
  }
  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          required
          label="Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          placeholder="Worker name"
        />
        <TextInput
          required
          type="email"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          placeholder="name@company.com"
        />
        <Select
          required
          label="Role"
          value={role}
          data={['worker', 'manager', 'admin', 'accountant', 'owner']}
          onChange={(value) =>
            setRole((value ?? 'worker') as NewWorker['role'])
          }
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
        <Button type="submit" loading={saving}>
          Create worker
        </Button>
      </Stack>
    </form>
  )
}
export default WorkerForm
