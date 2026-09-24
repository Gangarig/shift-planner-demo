import { useState } from 'react'
import useApp from './useApp'
import type { Worker } from '../types/Worker'

export default function useWorker(search: string) {
  const { workers } = useApp()
  const [sortOrderWorker, setSortOrderWorker] = useState<
    'Default' | 'Name A-Z' | 'Name Z-A' | 'Status'
  >('Default')
  const filteredWorkers = workers.filter((worker: Worker) => {
    const searchValue = search.toLowerCase()
    return (
      worker.name.toLowerCase().includes(searchValue) ||
      worker.email.toLowerCase().includes(searchValue) ||
      worker.role.toLowerCase().includes(searchValue) ||
      (worker.phoneNumber?.toString() ?? '').includes(searchValue)
    )
  })
  let sortedWorkers = [...filteredWorkers]
  if (sortOrderWorker === 'Name A-Z') {
    sortedWorkers = [...filteredWorkers].sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  } else if (sortOrderWorker === 'Name Z-A') {
    sortedWorkers = [...filteredWorkers].sort((a, b) =>
      b.name.localeCompare(a.name),
    )
  } else if (sortOrderWorker === 'Status') {
    sortedWorkers = [...filteredWorkers].sort((a, b) =>
      a.status.localeCompare(b.status),
    )
  }
  return {
    sortedWorkers,
    setSortOrderWorker,
    sortOrderWorker,
  }
}
