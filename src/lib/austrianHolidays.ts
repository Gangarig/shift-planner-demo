import { toDateKey } from './dateUtils'

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function easterSunday(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

export function austrianPublicHoliday(value: Date | string) {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value
  if (!Number.isFinite(date.getTime())) return null
  const year = date.getFullYear()
  const easter = easterSunday(year)
  const holidays = new Map<string, string>([
    [`${year}-01-01`, "New Year's Day"],
    [`${year}-01-06`, 'Epiphany'],
    [toDateKey(addDays(easter, 1)), 'Easter Monday'],
    [`${year}-05-01`, 'State Holiday'],
    [toDateKey(addDays(easter, 39)), 'Ascension Day'],
    [toDateKey(addDays(easter, 50)), 'Whit Monday'],
    [toDateKey(addDays(easter, 60)), 'Corpus Christi'],
    [`${year}-08-15`, 'Assumption Day'],
    [`${year}-10-26`, 'Austrian National Day'],
    [`${year}-11-01`, "All Saints' Day"],
    [`${year}-12-08`, 'Immaculate Conception'],
    [`${year}-12-25`, 'Christmas Day'],
    [`${year}-12-26`, "St Stephen's Day"],
  ])
  return holidays.get(toDateKey(date)) ?? null
}
