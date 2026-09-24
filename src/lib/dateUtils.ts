export function getMondayOfWeek(selectedDate: Date) {
  const day = selectedDate.getDay()
  const daysBack = day === 0 ? 6 : day - 1
  return new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate() - daysBack,
  )
}

export function getWeekDays(monday: Date) {
  return [0, 1, 2, 3, 4].map((offset) => {
    const date = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + offset,
    )
    return {
      label: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date),
      date,
    }
  })
}

export function toDateKey(value: Date | string) {
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : typeof value === 'string'
        ? new Date(value)
        : value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateKey(value: string) {
  return new Date(`${value.length === 10 ? value : toDateKey(value)}T00:00:00`)
}
