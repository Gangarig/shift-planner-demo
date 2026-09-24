import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
const output = mkdtempSync(join(tmpdir(), 'shiftplanner-tests-'))
execFileSync('./node_modules/.bin/tsc', [
  '--ignoreConfig',
  '--skipLibCheck',
  '--target',
  'es2022',
  '--module',
  'commonjs',
  '--outDir',
  output,
  'src/lib/plannerRules.ts',
  'src/lib/dateUtils.ts',
  'src/lib/austrianHolidays.ts',
])
const require = createRequire(import.meta.url)
const { assignmentProblem } = require(join(output, 'lib/plannerRules.js'))
const { toDateKey, fromDateKey, getMondayOfWeek } = require(
  join(output, 'lib/dateUtils.js'),
)
const { austrianPublicHoliday } = require(
  join(output, 'lib/austrianHolidays.js'),
)
const worker = { id: 'w', status: 'available' }
const station = { id: 's', active: true }
const date = fromDateKey('2026-09-14')
const assignment = { id: 'a', workerId: 'w', stationId: 's', date }
test('calendar dates round trip across timezones', () => {
  for (const zone of [
    'Europe/Vienna',
    'America/Los_Angeles',
    'Pacific/Auckland',
  ]) {
    process.env.TZ = zone
    assert.equal(toDateKey('2026-09-14'), '2026-09-14')
    assert.equal(toDateKey(fromDateKey('2026-03-29')), '2026-03-29')
  }
})
test('Sunday resolves to preceding Monday', () =>
  assert.equal(
    toDateKey(getMondayOfWeek(fromDateKey('2026-09-20'))),
    '2026-09-14',
  ))
test('free cell accepts worker', () =>
  assert.equal(assignmentProblem(worker, station, date, []), null))
test('worker double-booking rejected', () =>
  assert.match(
    assignmentProblem(worker, { id: 'other', active: true }, date, [
      assignment,
    ]),
    /worker already/,
  ))
test('a station accepts multiple workers on the same day', () =>
  assert.equal(
    assignmentProblem({ id: 'other', status: 'available' }, station, date, [
      assignment,
    ]),
    null,
  ))
test('moving an assignment ignores its own booking', () =>
  assert.equal(
    assignmentProblem(worker, station, date, [assignment], [], 'a'),
    null,
  ))
test('approved vacation blocks assignment on every covered date', () => {
  const absences = [
    {
      id: 'x',
      workerId: 'w',
      startDate: '2026-09-16',
      endDate: '2026-09-20',
      status: 'holiday',
    },
  ]
  assert.match(
    assignmentProblem(worker, station, fromDateKey('2026-09-16'), [], absences),
    /Vacation/,
  )
  assert.match(
    assignmentProblem(worker, station, fromDateKey('2026-09-18'), [], absences),
    /Vacation/,
  )
  assert.equal(
    assignmentProblem(worker, station, fromDateKey('2026-09-15'), [], absences),
    null,
  )
})
test('unavailable workers and inactive stations rejected', () => {
  assert.match(
    assignmentProblem({ ...worker, status: 'sick' }, station, date, []),
    /unavailable/,
  )
  assert.match(
    assignmentProblem(worker, { ...station, active: false }, date, []),
    /inactive/,
  )
})
test('invalid dates rejected', () =>
  assert.match(
    assignmentProblem(worker, station, new Date('invalid'), []),
    /valid date/,
  ))
test('Austrian fixed and movable public holidays are closed', () => {
  assert.equal(austrianPublicHoliday('2026-01-01'), "New Year's Day")
  assert.equal(austrianPublicHoliday('2026-04-06'), 'Easter Monday')
  assert.equal(austrianPublicHoliday('2026-05-14'), 'Ascension Day')
  assert.equal(austrianPublicHoliday('2026-10-26'), 'Austrian National Day')
  assert.equal(austrianPublicHoliday('2027-03-29'), 'Easter Monday')
  assert.equal(austrianPublicHoliday('2026-09-15'), null)
})
test('assignments on Austrian public holidays are rejected', () =>
  assert.match(
    assignmentProblem(worker, station, fromDateKey('2026-10-26'), []),
    /public holiday/,
  ))
