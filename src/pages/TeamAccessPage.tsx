import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { useAuth, type AppRole } from '../context/AuthContext'
import useApp from '../hooks/useApp'
import {
  cancelInvitation,
  deleteTeamMemberAccount,
  inviteTeamMember,
  loadTeam,
  setTeamMemberDisabled,
  updateTeamMember,
  type TeamMember,
} from '../services/teamService'
import { errorMessage } from '../lib/plannerRules'

const roleOptions = [
  { value: 'worker', label: 'Worker — view schedules' },
  { value: 'manager', label: 'Manager — manage schedules and records' },
  { value: 'accountant', label: 'Accountant — overtime, leave, and payslips' },
  { value: 'admin', label: 'Admin — manager access and settings' },
  { value: 'owner', label: 'Owner — full access' },
]

export default function TeamAccessPage() {
  const { user } = useAuth()
  const { workers } = useApp()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [opened, { open, close }] = useDisclosure(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<AppRole>('worker')
  const [workerId, setWorkerId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const workerOptions = useMemo(
    () => [
      { value: '', label: 'No linked worker' },
      ...workers.map((worker) => ({ value: worker.id, label: worker.name })),
    ],
    [workers],
  )

  async function refresh() {
    try {
      setMembers(await loadTeam())
      setError('')
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    let active = true
    void loadTeam()
      .then((nextMembers) => {
        if (active) {
          setMembers(nextMembers)
          setError('')
        }
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

  async function invite(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await inviteTeamMember({
        email: email.trim(),
        fullName: fullName.trim(),
        role,
        workerId,
        redirectTo: new URL(
          'reset-password?invite=1',
          `${window.location.origin}${import.meta.env.BASE_URL}`,
        ).toString(),
      })
      notifications.show({
        color: 'green',
        title: 'Invitation sent',
        message: `An invitation was sent to ${email.trim()}`,
      })
      setEmail('')
      setFullName('')
      setRole('worker')
      setWorkerId(null)
      close()
      await refresh()
    } catch (reason) {
      notifications.show({
        color: 'red',
        title: 'Invitation failed',
        message: errorMessage(reason),
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function update(
    member: TeamMember,
    nextRole: AppRole,
    nextWorkerId: string | null,
  ) {
    try {
      await updateTeamMember(member.id, nextRole, nextWorkerId)
      await refresh()
      notifications.show({
        color: 'green',
        title: 'Access updated',
        message: `${member.fullName}'s access was saved`,
      })
    } catch (reason) {
      notifications.show({
        color: 'red',
        title: 'Update failed',
        message: errorMessage(reason),
      })
    }
  }

  async function toggleDisabled(member: TeamMember) {
    const disabling = member.status !== 'disabled'
    if (
      !window.confirm(
        `${disabling ? 'Disable' : 'Restore'} access for ${member.email}?`,
      )
    )
      return
    try {
      await setTeamMemberDisabled(member.id, disabling)
      await refresh()
      notifications.show({
        color: 'green',
        title: disabling ? 'Access disabled' : 'Access restored',
        message: member.email,
      })
    } catch (reason) {
      notifications.show({
        color: 'red',
        title: 'Access change failed',
        message: errorMessage(reason),
      })
    }
  }

  async function removeInvite(member: TeamMember) {
    if (
      !window.confirm(
        `Delete the pending invitation for ${member.email}? The login will be removed, but the worker record and schedule history will stay. You can invite this email again later.`,
      )
    )
      return
    try {
      await cancelInvitation(member.id)
      await refresh()
      notifications.show({
        color: 'green',
        title: 'Invitation deleted',
        message: `${member.email} can be invited again`,
      })
    } catch (reason) {
      notifications.show({
        color: 'red',
        title: 'Deletion failed',
        message: errorMessage(reason),
      })
    }
  }

  async function deleteAccount(member: TeamMember) {
    if (
      !window.confirm(
        `Permanently delete the login account for ${member.email}? Their worker record, schedules, requests, and documents will stay. You can invite this email again later.`,
      )
    )
      return
    try {
      await deleteTeamMemberAccount(member.id)
      await refresh()
      notifications.show({
        color: 'green',
        title: 'Account deleted',
        message: `${member.email} can be invited again`,
      })
    } catch (reason) {
      notifications.show({
        color: 'red',
        title: 'Deletion failed',
        message: errorMessage(reason),
      })
    }
  }

  return (
    <Stack className="page-container team-access-page" gap="sm" pos="relative">
      <LoadingOverlay visible={loading} />
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={1}>Team & Access</Title>
          <Text c="dimmed">
            Invite people and control what they can do in this workspace.
          </Text>
        </div>
        <Button onClick={open}>Invite person</Button>
      </Group>
      {error && (
        <Alert color="red" title="Could not load accounts">
          {error}
        </Alert>
      )}
      <Alert color="blue" variant="light">
        Worker records are people on the schedule. Login accounts are optional
        and control who can open this app.
      </Alert>
      <Paper withBorder className="team-access-table-wrap">
        <Table
          verticalSpacing="xs"
          horizontalSpacing="xs"
          miw={700}
          className="team-access-table"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Person</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Linked worker</Table.Th>
              <Table.Th ta="right">Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {members.map((member) => {
              const self = member.id === user?.id
              return (
                <Table.Tr key={member.id}>
                  <Table.Td>
                    <Text fw={600} size="sm" lh={1.15}>
                      {member.fullName}
                    </Text>
                    <Text c="dimmed" size="xs" lh={1.15}>
                      {member.email}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={
                        member.status === 'active'
                          ? 'green'
                          : member.status === 'invited'
                            ? 'blue'
                            : 'gray'
                      }
                      variant="light"
                    >
                      {member.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      aria-label={`Role for ${member.fullName}`}
                      data={roleOptions}
                      value={member.role}
                      disabled={self}
                      onChange={(value) =>
                        value &&
                        void update(member, value as AppRole, member.workerId)
                      }
                    />
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      aria-label={`Linked worker for ${member.fullName}`}
                      searchable
                      clearable
                      data={workerOptions}
                      value={member.workerId ?? ''}
                      onChange={(value) =>
                        void update(member, member.role, value || null)
                      }
                    />
                  </Table.Td>
                  <Table.Td ta="right">
                    <Group gap={2} justify="flex-end" wrap="nowrap">
                      {member.status === 'invited' ? (
                        <Button
                          color="red"
                          variant="subtle"
                          size="compact-xs"
                          onClick={() => void removeInvite(member)}
                        >
                          Delete invitation
                        </Button>
                      ) : (
                        <>
                          <Button
                            color={
                              member.status === 'disabled' ? 'blue' : 'orange'
                            }
                            variant="subtle"
                            size="compact-xs"
                            disabled={self}
                            onClick={() => void toggleDisabled(member)}
                          >
                            {member.status === 'disabled'
                              ? 'Restore'
                              : 'Disable'}
                          </Button>
                          <Button
                            color="red"
                            variant="subtle"
                            size="compact-xs"
                            disabled={self}
                            onClick={() => void deleteAccount(member)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
        {!loading && members.length === 0 && (
          <Text p="xl" ta="center" c="dimmed">
            No accounts found.
          </Text>
        )}
      </Paper>
      <Modal opened={opened} onClose={close} title="Invite a person" centered>
        <form onSubmit={invite}>
          <Stack>
            <TextInput
              required
              type="email"
              label="Email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <TextInput
              required
              label="Name"
              value={fullName}
              onChange={(event) => setFullName(event.currentTarget.value)}
            />
            <Select
              required
              label="Role"
              data={roleOptions}
              value={role}
              onChange={(value) => setRole((value as AppRole) || 'worker')}
            />
            <Select
              searchable
              clearable
              label="Link to worker (optional)"
              description="Use this when the person also appears on the schedule."
              data={workerOptions}
              value={workerId ?? ''}
              onChange={(value) => setWorkerId(value || null)}
            />
            <Button type="submit" loading={submitting}>
              Send invitation
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
