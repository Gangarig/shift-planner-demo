interface SortProps {
  sortOrder: 'Default' | 'Name A-Z' | 'Name Z-A' | 'Status'
  onSort: (value: 'Default' | 'Name A-Z' | 'Name Z-A' | 'Status') => void
}
function WorkerSort({ sortOrder, onSort }: SortProps) {
  return (
    <Select
      aria-label="Sort workers"
      value={sortOrder}
      data={['Default', 'Name A-Z', 'Name Z-A', 'Status']}
      onChange={(value) => value && onSort(value as SortProps['sortOrder'])}
    />
  )
}

export default WorkerSort
import { Select } from '@mantine/core'
