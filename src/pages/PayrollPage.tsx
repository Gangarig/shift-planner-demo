import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  FileInput,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useAuth } from '../context/AuthContext'
import useApp from '../hooks/useApp'
import { errorMessage } from '../lib/plannerRules'
import { toDateKey } from '../lib/dateUtils'
import {
  createLeaveRequest,
  createOvertimeEntry,
  loadLeaveDocuments,
  loadLeaveRequests,
  loadOvertimeEntries,
  loadPayslips,
  openPrivateDocument,
  removeOvertimeEntry,
  reviewLeaveRequest,
  uploadLeaveDocument,
  uploadPayslip,
  verifyLeaveDocument,
} from '../services/payrollService'
import type {
  LeaveRequest,
  LeaveRequestDocument,
  LeaveRequestType,
  OvertimeEntry,
  PayslipDocument,
} from '../types/Payroll'

const requestLabels: Record<LeaveRequestType, string> = {
  vacation: 'Vacation',
  sick_leave: 'Sick leave',
  doctor_appointment: 'Doctor / hospital appointment',
  other_absence: 'Other absence',
}
const accepted = ['application/pdf', 'image/jpeg', 'image/png']
const today = toDateKey(new Date())
const currentMonth = today.slice(0, 7)
function monthEnd(month: string) {
  return toDateKey(
    new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0, 12),
  )
}
function defaultSchedule(
  type: LeaveRequestType,
): 'late' | 'sick' | 'holiday' | null {
  return type === 'vacation'
    ? 'holiday'
    : type === 'sick_leave' || type === 'other_absence'
      ? 'sick'
      : 'late'
}
function checkFile(file: File | null) {
  if (!file) throw new Error('Choose a PDF, JPG, or PNG file')
  if (!accepted.includes(file.type))
    throw new Error('Only PDF, JPG, and PNG files are allowed')
  if (file.size > 10 * 1024 * 1024)
    throw new Error('The file must be 10 MB or smaller')
  return file
}

export default function PayrollPage() {
  const { user } = useAuth()
  const { workers, refreshPlanningData } = useApp()
  const accountant = user?.role === 'accountant'
  const oversight = ['admin', 'owner'].includes(user?.role ?? '')
  const canViewAll = accountant || oversight
  const [month, setMonth] = useState(currentMonth),
    [overtime, setOvertime] = useState<OvertimeEntry[]>([]),
    [requests, setRequests] = useState<LeaveRequest[]>([]),
    [payslips, setPayslips] = useState<PayslipDocument[]>([]),
    [documents, setDocuments] = useState<LeaveRequestDocument[]>([])
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const [workerId, setWorkerId] = useState(user?.workerId ?? ''),
    [date, setDate] = useState(today),
    [hours, setHours] = useState<number | string>(1),
    [overtimeNote, setOvertimeNote] = useState('')
  const [requestType, setRequestType] = useState<LeaveRequestType>('vacation'),
    [startDate, setStartDate] = useState(today),
    [endDate, setEndDate] = useState(today),
    [startTime, setStartTime] = useState(''),
    [endTime, setEndTime] = useState(''),
    [requestNote, setRequestNote] = useState('')
  const [payslipWorker, setPayslipWorker] = useState(''),
    [payslipFile, setPayslipFile] = useState<File | null>(null)
  const activeWorkers = useMemo(
    () =>
      workers
        .filter((w) => w.status !== 'inactive')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [workers],
  )
  const workerName = (id: string) =>
    workers.find((w) => w.id === id)?.name ?? 'Unknown worker'

  async function refresh() {
    try {
      setLoading(true)
      setError('')
      const [o, r, p, d] = await Promise.all([
        canViewAll
          ? loadOvertimeEntries(`${month}-01`, monthEnd(month))
          : Promise.resolve([]),
        loadLeaveRequests(),
        loadPayslips(),
        loadLeaveDocuments(),
      ])
      setOvertime(o)
      setRequests(r)
      setPayslips(p)
      setDocuments(d)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    let active = true
    Promise.all([
      canViewAll
        ? loadOvertimeEntries(`${month}-01`, monthEnd(month))
        : Promise.resolve([]),
      loadLeaveRequests(),
      loadPayslips(),
      loadLeaveDocuments(),
    ])
      .then(([o, r, p, d]) => {
        if (active) {
          setOvertime(o)
          setRequests(r)
          setPayslips(p)
          setDocuments(d)
          setError('')
          setLoading(false)
        }
      })
      .catch((reason) => {
        if (active) {
          setError(errorMessage(reason))
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [month, canViewAll])
  async function act(action: () => Promise<void>, title: string) {
    setBusy(true)
    try {
      await action()
      await Promise.all([refresh(), refreshPlanningData()])
      notifications.show({ color: 'green', title, message: 'Saved securely' })
    } catch (reason) {
      notifications.show({
        color: 'red',
        title: 'Could not save',
        message: errorMessage(reason),
      })
    } finally {
      setBusy(false)
    }
  }
  async function submitRequest() {
    const target = user?.workerId
    if (!target)
      return setError(
        'This login must be linked to a worker before requesting leave.',
      )
    await act(
      () =>
        createLeaveRequest({
          workerId: target,
          type: requestType,
          startDate,
          endDate,
          startTime: startTime || null,
          endTime: endTime || null,
          note: requestNote.trim() || null,
        }),
      'Request submitted',
    )
    setRequestNote('')
  }
  const pending = requests.filter((r) => r.status === 'pending').length

  return (
    <Stack className="page-container" gap="lg">
      <div>
        <Title order={1}>
          {accountant
            ? 'Payroll & leave'
            : oversight
              ? 'Payroll oversight'
              : 'My leave & payslips'}
        </Title>
        <Text c="dimmed">
          {accountant
            ? 'Verify requests and documents, record overtime, and deliver monthly payslips privately.'
            : oversight
              ? 'Read-only oversight of payroll and leave records.'
              : 'Request time away, attach documents, and securely download your monthly payslips.'}
        </Text>
      </div>
      {error && <Alert color="red">{error}</Alert>}
      {canViewAll && (
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">
              Pending requests
            </Text>
            <Text fw={700} size="xl">
              {pending}
            </Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">
              Payslips uploaded
            </Text>
            <Text fw={700} size="xl">
              {payslips.filter((p) => p.payroll_month.startsWith(month)).length}
              /{activeWorkers.length}
            </Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">
              Overtime this month
            </Text>
            <Text fw={700} size="xl">
              {overtime.reduce((sum, item) => sum + item.hours, 0).toFixed(2)}h
            </Text>
          </Paper>
        </SimpleGrid>
      )}

      {!canViewAll && (
        <Paper withBorder p="lg">
          <Stack>
            <Title order={3}>New leave or absence request</Title>
            {!user?.workerId && (
              <Alert color="orange">
                Ask the owner to link your login to your worker record.
              </Alert>
            )}
            <Select
              label="Type"
              value={requestType}
              onChange={(v) =>
                setRequestType((v ?? 'vacation') as LeaveRequestType)
              }
              data={Object.entries(requestLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <Group grow>
              <TextInput
                type="date"
                label="From"
                value={startDate}
                onChange={(e) => setStartDate(e.currentTarget.value)}
              />
              <TextInput
                type="date"
                label="To"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.currentTarget.value)}
              />
            </Group>
            {requestType === 'doctor_appointment' && (
              <Group grow>
                <TextInput
                  type="time"
                  label="From time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.currentTarget.value)}
                />
                <TextInput
                  type="time"
                  label="To time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.currentTarget.value)}
                />
              </Group>
            )}
            <Textarea
              label="Reason or note"
              maxLength={1000}
              value={requestNote}
              onChange={(e) => setRequestNote(e.currentTarget.value)}
            />
            <Button
              loading={busy}
              disabled={
                !startDate || !endDate || endDate < startDate || !user?.workerId
              }
              onClick={() => void submitRequest()}
            >
              Submit request
            </Button>
          </Stack>
        </Paper>
      )}

      <Paper withBorder p="lg">
        <Stack>
          <Group justify="space-between">
            <Title order={3}>{canViewAll ? 'Requests' : 'My requests'}</Title>
            {loading && (
              <Text size="sm" c="dimmed">
                Loading…
              </Text>
            )}
          </Group>
          {requests.map((request) => {
            const docs = documents.filter((d) => d.request_id === request.id)
            const unverified = docs.some(
              (d) => d.verification_status !== 'verified',
            )
            return (
              <Paper key={request.id} withBorder p="sm">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <div>
                      <Text fw={700}>
                        {canViewAll
                          ? `${workerName(request.worker_id)} · `
                          : ''}
                        {requestLabels[request.request_type]}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {request.start_date} → {request.end_date}
                        {request.start_time
                          ? ` · ${request.start_time.slice(0, 5)}–${request.end_time?.slice(0, 5)}`
                          : ''}
                      </Text>
                    </div>
                    <Badge
                      color={
                        request.status === 'approved'
                          ? 'green'
                          : request.status === 'rejected'
                            ? 'red'
                            : 'orange'
                      }
                    >
                      {request.status}
                    </Badge>
                  </Group>
                  {request.note && <Text size="sm">{request.note}</Text>}
                  {request.review_note && (
                    <Text size="sm" c="dimmed">
                      Review: {request.review_note}
                    </Text>
                  )}
                  <Group>
                    {docs.map((doc) => (
                      <Group gap={4} key={doc.id}>
                        <Button
                          size="compact-xs"
                          variant="light"
                          onClick={() =>
                            void openPrivateDocument(doc.object_path)
                          }
                        >
                          {doc.original_name}
                        </Button>
                        <Badge
                          size="xs"
                          color={
                            doc.verification_status === 'verified'
                              ? 'green'
                              : doc.verification_status === 'rejected'
                                ? 'red'
                                : 'gray'
                          }
                        >
                          {doc.verification_status}
                        </Badge>
                        {accountant && (
                          <>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="green"
                              onClick={() =>
                                void act(
                                  () => verifyLeaveDocument(doc.id, 'verified'),
                                  'Document verified',
                                )
                              }
                            >
                              ✓
                            </Button>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="red"
                              onClick={() =>
                                void act(
                                  () => verifyLeaveDocument(doc.id, 'rejected'),
                                  'Document rejected',
                                )
                              }
                            >
                              ×
                            </Button>
                          </>
                        )}
                      </Group>
                    ))}
                  </Group>
                  {!canViewAll && request.status === 'pending' && (
                    <FileInput
                      size="xs"
                      accept="application/pdf,image/jpeg,image/png"
                      label="Attach supporting document (optional, max 10 MB)"
                      clearable
                      onChange={(file) => {
                        if (file)
                          void act(
                            () =>
                              uploadLeaveDocument(request.id, checkFile(file)),
                            'Document uploaded',
                          )
                      }}
                    />
                  )}
                  {accountant && request.status === 'pending' && (
                    <Group>
                      <Button
                        size="xs"
                        color="green"
                        disabled={unverified}
                        title={
                          unverified
                            ? 'Verify or reject every attached document first'
                            : undefined
                        }
                        onClick={() =>
                          void act(
                            () =>
                              reviewLeaveRequest(
                                request.id,
                                'approved',
                                defaultSchedule(request.request_type),
                                null,
                              ),
                            'Request approved',
                          )
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() =>
                          void act(
                            () =>
                              reviewLeaveRequest(
                                request.id,
                                'rejected',
                                null,
                                null,
                              ),
                            'Request rejected',
                          )
                        }
                      >
                        Reject
                      </Button>
                      {unverified && (
                        <Text size="xs" c="dimmed">
                          Review attached documents before approval.
                        </Text>
                      )}
                    </Group>
                  )}
                </Stack>
              </Paper>
            )
          })}
          {!loading && !requests.length && (
            <Text c="dimmed">No requests yet.</Text>
          )}
        </Stack>
      </Paper>

      {canViewAll && (
        <Paper withBorder p="lg">
          <Stack>
            <Title order={3}>Monthly overtime</Title>
            <TextInput
              type="month"
              label="Month"
              value={month}
              onChange={(e) => setMonth(e.currentTarget.value)}
            />
            {accountant && (
              <>
                <Group grow>
                  <Select
                    searchable
                    label="Worker"
                    value={workerId}
                    onChange={(v) => setWorkerId(v ?? '')}
                    data={activeWorkers.map((w) => ({
                      value: w.id,
                      label: w.name,
                    }))}
                  />
                  <TextInput
                    type="date"
                    label="Date"
                    min={`${month}-01`}
                    max={monthEnd(month)}
                    value={date}
                    onChange={(e) => setDate(e.currentTarget.value)}
                  />
                  <NumberInput
                    label="Hours"
                    decimalScale={2}
                    min={-24}
                    max={24}
                    value={hours}
                    onChange={setHours}
                  />
                </Group>
                <TextInput
                  label="Note"
                  maxLength={500}
                  value={overtimeNote}
                  onChange={(e) => setOvertimeNote(e.currentTarget.value)}
                />
                <Button
                  loading={busy}
                  disabled={!workerId || !date || !Number(hours)}
                  onClick={() =>
                    void act(
                      () =>
                        createOvertimeEntry({
                          workerId,
                          date,
                          hours: Number(hours),
                          note: overtimeNote.trim() || null,
                        }),
                      'Overtime saved',
                    )
                  }
                >
                  Add overtime entry
                </Button>
              </>
            )}
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Worker</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Hours</Table.Th>
                  <Table.Th>Note</Table.Th>
                  {accountant && <Table.Th />}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {overtime.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>{workerName(item.worker_id)}</Table.Td>
                    <Table.Td>{item.work_date}</Table.Td>
                    <Table.Td>{item.hours}h</Table.Td>
                    <Table.Td>{item.note ?? '—'}</Table.Td>
                    {accountant && (
                      <Table.Td>
                        <Button
                          size="compact-xs"
                          color="red"
                          variant="subtle"
                          onClick={() =>
                            void act(
                              () => removeOvertimeEntry(item.id),
                              'Entry removed',
                            )
                          }
                        >
                          Remove
                        </Button>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </Paper>
      )}

      <Paper withBorder p="lg">
        <Stack>
          <Title order={3}>Monthly payslips</Title>
          {accountant && (
            <>
              <TextInput
                type="month"
                label="Payroll month"
                value={month}
                onChange={(e) => setMonth(e.currentTarget.value)}
              />
              <Select
                searchable
                label="Worker"
                value={payslipWorker}
                onChange={(v) => setPayslipWorker(v ?? '')}
                data={activeWorkers.map((w) => ({
                  value: w.id,
                  label: w.name,
                }))}
              />
              <FileInput
                accept="application/pdf,image/jpeg,image/png"
                label="Payslip file"
                description="PDF, JPG, or PNG · maximum 10 MB"
                value={payslipFile}
                onChange={setPayslipFile}
              />
              <Button
                loading={busy}
                disabled={!payslipWorker || !payslipFile}
                onClick={() =>
                  void act(
                    () =>
                      uploadPayslip(
                        payslipWorker,
                        month,
                        checkFile(payslipFile),
                      ),
                    'Payslip uploaded',
                  ).then(() => setPayslipFile(null))
                }
              >
                Upload securely
              </Button>
            </>
          )}
          <Table>
            <Table.Thead>
              <Table.Tr>
                {canViewAll && <Table.Th>Worker</Table.Th>}
                <Table.Th>Month</Table.Th>
                <Table.Th>Document</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payslips.map((doc) => (
                <Table.Tr key={doc.id}>
                  {canViewAll && (
                    <Table.Td>{workerName(doc.worker_id)}</Table.Td>
                  )}
                  <Table.Td>{doc.payroll_month.slice(0, 7)}</Table.Td>
                  <Table.Td>
                    <Button
                      size="compact-sm"
                      variant="light"
                      onClick={() => void openPrivateDocument(doc.object_path)}
                    >
                      Open {doc.original_name}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {!payslips.length && (
            <Text c="dimmed">No payslips uploaded yet.</Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
