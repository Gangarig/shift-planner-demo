interface StationSortProps {
  sortOrderStation:
    'Default' | 'Name A-Z' | 'Name Z-A' | 'Active first' | 'Inactive first'
  onSortStation: (
    value:
      'Default' | 'Name A-Z' | 'Name Z-A' | 'Active first' | 'Inactive first',
  ) => void
}
function StationSort({ sortOrderStation, onSortStation }: StationSortProps) {
  return (
    <Select
      aria-label="Sort stations"
      value={sortOrderStation}
      data={[
        'Default',
        'Name A-Z',
        'Name Z-A',
        'Active first',
        'Inactive first',
      ]}
      onChange={(value) =>
        value && onSortStation(value as StationSortProps['sortOrderStation'])
      }
    />
  )
}

export default StationSort
import { Select } from '@mantine/core'
