import { TextInput } from '@mantine/core'
interface SearchProps {
  search: string
  onSearch: (value: string) => void
}

function Search({ search, onSearch }: SearchProps) {
  return (
    <TextInput
      placeholder="Search by name..."
      aria-label="Search"
      leftSection="⌕"
      value={search}
      onChange={(event) => onSearch(event.currentTarget.value)}
    />
  )
}

export default Search
