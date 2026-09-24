import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import {
  loadAllAuditEvents,
  loadAuditEvents,
  type AuditEvent,
} from '../services/auditService'
import { errorMessage } from '../lib/plannerRules'

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  useEffect(() => {
    let active = true
    void loadAuditEvents()
      .then((data) => {
        if (active) setEvents(data)
      })
      .catch((reason) => {
        if (active) setError(errorMessage(reason))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])
  async function exportAudit() {
    setExporting(true)
    setError('')
    try {
      const all = await loadAllAuditEvents()
      const rows = [
        ['Time', 'Action', 'Record type', 'Record ID', 'Actor ID'],
        ...all.map((item) => [
          item.created_at,
          item.action,
          item.entity_type,
          item.entity_id ?? '',
          item.actor_id ?? 'System',
        ]),
      ]
      const csv = rows
        .map((row) =>
          row
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(','),
        )
        .join('\n')
      const url = URL.createObjectURL(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = `shiftplanner-audit-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setExporting(false)
    }
  }
  return (
    <Stack className="page-container" gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={1}>Audit history</Title>
          <Text c="dimmed">
            The latest 200 protected workspace changes. Records are
            automatically deleted after one year.
          </Text>
        </div>
        <Group>
          {loading && <Loader size="sm" />}
          <Button
            variant="light"
            loading={exporting}
            onClick={() => void exportAudit()}
          >
            Export one-year CSV
          </Button>
        </Group>
      </Group>
      {error && <Alert color="red">{error}</Alert>}
      <Paper withBorder style={{ overflowX: 'auto' }}>
        <Table miw={650} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time</Table.Th>
              <Table.Th>Action</Table.Th>
              <Table.Th>Record</Table.Th>
              <Table.Th>Actor</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {events.map((event) => (
              <Table.Tr key={event.id}>
                <Table.Td>
                  {new Date(event.created_at).toLocaleString()}
                </Table.Td>
                <Table.Td>
                  <Badge variant="light">{event.action}</Badge>
                </Table.Td>
                <Table.Td>
                  {event.entity_type}
                  <Text size="xs" c="dimmed">
                    {event.entity_id ?? '—'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{event.actor_id ?? 'System'}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {!loading && !events.length && (
          <Text ta="center" c="dimmed" p="xl">
            No audit events yet.
          </Text>
        )}
      </Paper>
    </Stack>
  )
}
