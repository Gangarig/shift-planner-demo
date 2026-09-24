import { type DragEvent, type MouseEvent, useState } from 'react'
import { ActionIcon, Badge, Group, Stack, Text } from '@mantine/core'
import type { Station } from '../../types/Station'
import type { Worker } from '../../types/Worker'
import type { Assignment } from '../../types/Assignment'

interface GridCellProps {
  station: Station
  date: Date
  worker: Worker | null
  assignment: Assignment | null
  canAssignWorker: (
    workerId: string,
    date: Date,
    assignmentId?: string,
  ) => boolean
  onCreateAssignment: (workerId: string, stationId: string, date: Date) => void
  onMoveAssignment: (
    assignment: Assignment,
    stationId: string,
    date: Date,
  ) => void
  onRemoveAssignment: (assignment: Assignment) => void
  onSelectAssignment: (assignment: Assignment | null) => void
}

function GridCell({
  station,
  date,
  worker,
  assignment,
  canAssignWorker,
  onCreateAssignment,
  onMoveAssignment,
  onRemoveAssignment,
  onSelectAssignment,
}: GridCellProps) {
  const [isDropTarget, setIsDropTarget] = useState(false)

  function handleRemove(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (assignment) void onRemoveAssignment(assignment)
  }
  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!station.active || assignment) return
    if (
      event.dataTransfer.types.includes('application/x-shift-worker') ||
      event.dataTransfer.types.includes('application/x-shift-assignment') ||
      event.dataTransfer.types.includes('text/plain')
    ) {
      event.preventDefault()
      event.dataTransfer.dropEffect = event.dataTransfer.types.includes(
        'application/x-shift-assignment',
      )
        ? 'move'
        : 'copy'
      setIsDropTarget(true)
    }
  }
  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDropTarget(false)
    if (!station.active || assignment) return
    const workerId =
      event.dataTransfer.getData('application/x-shift-worker') ||
      event.dataTransfer.getData('text/plain')
    if (workerId && canAssignWorker(workerId, date)) {
      await onCreateAssignment(workerId, station.id, date)
      return
    }
    const assignmentData = event.dataTransfer.getData(
      'application/x-shift-assignment',
    )
    if (!assignmentData) return
    try {
      const draggedAssignment = JSON.parse(assignmentData) as Assignment
      if (
        canAssignWorker(draggedAssignment.workerId, date, draggedAssignment.id)
      )
        await onMoveAssignment(draggedAssignment, station.id, date)
    } catch {
      /* Ignore malformed external drop data. */
    }
  }

  return (
    <div
      className={`planner-grid-cell${assignment ? ' planner-grid-cell--assigned' : ''}${isDropTarget ? ' planner-grid-cell--drop-target' : ''}`}
      onClick={() => assignment && onSelectAssignment(assignment)}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(event) => {
        void handleDrop(event)
      }}
      draggable={Boolean(assignment)}
      onDragStart={(event) => {
        if (assignment) {
          event.dataTransfer.setData(
            'application/x-shift-assignment',
            JSON.stringify(assignment),
          )
          event.dataTransfer.effectAllowed = 'move'
        }
      }}
      onDragEnd={() => setIsDropTarget(false)}
      style={{
        cursor: assignment
          ? 'grab'
          : station.active
            ? 'default'
            : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Group justify="space-between" wrap="nowrap" w="100%">
        <Stack gap={2} style={{ minWidth: 0 }}>
          {worker ? (
            <Text size="sm" fw={600} truncate>
              {worker.name}
            </Text>
          ) : (
            <Badge
              color={station.active ? 'gray' : 'red'}
              variant="light"
              size="xs"
            >
              {station.active ? 'Drop worker here' : 'Inactive'}
            </Badge>
          )}
          {assignment?.note && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {assignment.note}
            </Text>
          )}
        </Stack>
        {assignment && (
          <ActionIcon
            aria-label="Remove assignment"
            color="red"
            variant="subtle"
            size="sm"
            onClick={handleRemove}
          >
            ×
          </ActionIcon>
        )}
      </Group>
    </div>
  )
}

export default GridCell
