import useApp from './useApp'
import { useState } from 'react'
import type { Station } from '../types/Station'

type StationSortOrder =
  'Default' | 'Name A-Z' | 'Name Z-A' | 'Active first' | 'Inactive first'

export default function useStation(search: string) {
  const { stations } = useApp()
  const [sortOrderStation, setSortOrderStation] =
    useState<StationSortOrder>('Default')

  const filteredStations = stations.filter((station: Station) => {
    const searchValue = search.toLowerCase()
    return station.name.toLowerCase().includes(searchValue)
  })
  let sortedStations = [...filteredStations]
  if (sortOrderStation === 'Name A-Z') {
    sortedStations = [...filteredStations].sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  } else if (sortOrderStation === 'Name Z-A') {
    sortedStations = [...filteredStations].sort((a, b) =>
      b.name.localeCompare(a.name),
    )
  } else if (sortOrderStation === 'Active first') {
    sortedStations = [...filteredStations].sort(
      (a, b) => Number(b.active) - Number(a.active),
    )
  } else if (sortOrderStation === 'Inactive first') {
    sortedStations = [...filteredStations].sort(
      (a, b) => Number(a.active) - Number(b.active),
    )
  }
  return {
    sortOrderStation,
    setSortOrderStation,
    sortedStations,
  }
}
