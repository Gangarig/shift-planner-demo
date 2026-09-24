import type { Worker, WorkerStatus } from '../../types/Worker'
import type { Assignment } from '../../types/Assignment'
import { useState } from 'react'
import {
  Badge,
  Button,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { Textarea, TextInput } from '@mantine/core'
import type { NewWorkerAbsence, WorkerAbsence } from '../../types/WorkerAbsence'
import { toDateKey } from '../../lib/dateUtils'

interface WorkerDetailProps {
  worker: Worker | null
  onRemoveWorker: (value: Worker) => void
  setSelectedWorker: (value: Worker | null) => void
  onChangeOfStatus: (value: Worker) => void
  assignments: Assignment[]
  updateWorkerState: (value: Worker) => void
  absences: WorkerAbsence[]
  weekStart: Date
  onCreateAbsence: (value: NewWorkerAbsence) => Promise<boolean>
  onRemoveAbsence: (id: string) => Promise<boolean>
}

function WorkerDetail({
  worker,
  onRemoveWorker,
  setSelectedWorker,
  assignments,
  onChangeOfStatus,
  updateWorkerState,
  absences,
  weekStart,
  onCreateAbsence,
  onRemoveAbsence,
}: WorkerDetailProps) {
  const [vacationDays, setVacationDays] = useState('')
  const [plusHours, setPlusHours] = useState('')
  const [absenceStatus, setAbsenceStatus] =
    useState<NewWorkerAbsence['status']>('sick')
  const [absenceStart, setAbsenceStart] = useState(toDateKey(weekStart))
  const [absenceEnd, setAbsenceEnd] = useState(toDateKey(weekStart))
  const [absenceNote, setAbsenceNote] = useState('')
  const [savingAbsence, setSavingAbsence] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!worker) return null
  const currentWorker = worker
  function updateNumber(
    field: 'vacationDays' | 'plusHours',
    amountText: string,
    operation: 'add' | 'remove',
  ) {
    const amount = Number(amountText)
    if (!amount || amount < 0) return
    const next =
      (currentWorker[field] ?? 0) + (operation === 'add' ? amount : -amount)
    if (field === 'vacationDays' && next < 0) return
    updateWorkerState({ ...currentWorker, [field]: next })
  }
  const assignmentCount = assignments.filter(
    (assignment) => assignment.workerId === worker.id,
  ).length
  return (
    <Paper withBorder p="lg">
      <Stack>
        <Group justify="space-between">
          <div>
            <Title order={3}>{worker.name}</Title>
            <Text size="sm" c="dimmed">
              {worker.email}
            </Text>
          </div>
          <Badge variant="light">{worker.role}</Badge>
        </Group>
        <Select
          label="General availability"
          description="Use this for the whole selected week. Use a dated status below for a shorter absence."
          value={worker.status}
          data={['available', 'late', 'sick', 'holiday', 'inactive']}
          onChange={(value) =>
            onChangeOfStatus({
              ...worker,
              status: (value ?? 'available') as WorkerStatus,
            })
          }
        />
        {!['available', 'late'].includes(worker.status) && (
          <Text size="sm" c="orange">
            Changing this worker to unavailable removes their assignments from
            the selected week.
          </Text>
        )}
        <SimpleGrid cols={3}>
          <div>
            <Text size="xs" c="dimmed">
              Assignments
            </Text>
            <Text fw={700}>{assignmentCount}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Vacation days
            </Text>
            <Text fw={700}>{worker.vacationDays ?? 0}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Overtime
            </Text>
            <Text fw={700}>{worker.plusHours ?? 0}h</Text>
          </div>
        </SimpleGrid>
        <Divider />
        <Stack gap="xs">
          <Text fw={600}>Dated absence or delay</Text>
          <Text size="sm" c="dimmed">
            Sick leave and vacation remove assignments only inside this date
            range. Late remains scheduled.
          </Text>
          <Select
            label="Type"
            value={absenceStatus}
            data={[
              { value: 'sick', label: 'Sick' },
              { value: 'holiday', label: 'Vacation' },
              { value: 'late', label: 'Late' },
            ]}
            onChange={(value) =>
              setAbsenceStatus((value ?? 'sick') as NewWorkerAbsence['status'])
            }
          />
          <Group grow>
            <TextInput
              type="date"
              label="From"
              value={absenceStart}
              onChange={(event) => setAbsenceStart(event.currentTarget.value)}
            />
            <TextInput
              type="date"
              label="To"
              value={absenceEnd}
              min={absenceStart}
              onChange={(event) => setAbsenceEnd(event.currentTarget.value)}
            />
          </Group>
          <Textarea
            label="Note"
            value={absenceNote}
            onChange={(event) => setAbsenceNote(event.currentTarget.value)}
            maxLength={1000}
            autosize
            minRows={2}
          />
          <Button
            variant="light"
            loading={savingAbsence}
            disabled={!absenceStart || !absenceEnd || absenceEnd < absenceStart}
            onClick={async () => {
              setSavingAbsence(true)
              const ok = await onCreateAbsence({
                workerId: currentWorker.id,
                startDate: absenceStart,
                endDate: absenceEnd,
                status: absenceStatus,
                note: absenceNote.trim() || null,
              })
              setSavingAbsence(false)
              if (ok) setAbsenceNote('')
            }}
          >
            Save dated status
          </Button>
          {absences
            .filter((item) => item.workerId === currentWorker.id)
            .map((item) => (
              <Group justify="space-between" key={item.id}>
                <div>
                  <Badge color={item.status === 'sick' ? 'red' : 'orange'}>
                    {item.status === 'holiday' ? 'Vacation' : item.status}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {item.startDate} → {item.endDate}
                    {item.note ? ` · ${item.note}` : ''}
                  </Text>
                </div>
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  onClick={() => void onRemoveAbsence(item.id)}
                >
                  Remove
                </Button>
              </Group>
            ))}
        </Stack>
        <Divider />
        <NumberInput
          label="Adjust vacation days"
          min={1}
          value={vacationDays}
          onChange={(value) => setVacationDays(String(value))}
        />
        <Group grow>
          <Button
            variant="light"
            onClick={() => updateNumber('vacationDays', vacationDays, 'add')}
          >
            Add
          </Button>
          <Button
            variant="light"
            color="gray"
            onClick={() => updateNumber('vacationDays', vacationDays, 'remove')}
          >
            Remove
          </Button>
        </Group>
        <NumberInput
          label="Adjust overtime hours"
          min={1}
          value={plusHours}
          onChange={(value) => setPlusHours(String(value))}
        />
        <Group grow>
          <Button
            variant="light"
            onClick={() => updateNumber('plusHours', plusHours, 'add')}
          >
            Add
          </Button>
          <Button
            variant="light"
            color="gray"
            onClick={() => updateNumber('plusHours', plusHours, 'remove')}
          >
            Remove
          </Button>
        </Group>
        <Divider />
        {confirmDelete ? (
          <Stack gap="xs">
            <Text size="sm" c="red" fw={600}>
              Permanently delete {worker.name} and all of their assignments?
              This cannot be undone.
            </Text>
            <Group>
              <Button color="red" onClick={() => void onRemoveWorker(worker)}>
                Confirm permanent deletion
              </Button>
              <Button variant="default" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </Group>
          </Stack>
        ) : (
          <Group justify="space-between">
            <Button
              color="red"
              variant="subtle"
              onClick={() => setConfirmDelete(true)}
            >
              Delete worker
            </Button>
            <Button variant="default" onClick={() => setSelectedWorker(null)}>
              Close
            </Button>
          </Group>
        )}
      </Stack>
    </Paper>
  )
}

export default WorkerDetail
