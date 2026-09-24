# ShiftPlanner MVP checklist

This release keeps the existing dashboard, planner, workers, stations, and settings layout.

- [x] Planner: dated week navigation, readable grid, compact/comfortable density, station search.
- [x] Scheduling: click or drag to assign, allow multiple workers at one station, move existing assignments, edit notes, confirm removal, show conflicts.
- [x] Defaults: persistent main station per worker, automatic weekday filling, and manual-override preservation.
- [x] Daily operations: date-level notes and available/late/sick/vacation/inactive quick actions.
- [x] Staff exceptions: dated sick leave, vacation, and late records; sick/vacation clear only the affected dates.
- [x] Shift times: station default times with per-assignment overrides and database-enforced valid ordering.
- [x] Live collaboration: authenticated clients refresh workers, stations, assignments, notes, and absences after database changes.
- [x] Publication: managers, admins, and owners publish or republish a week; workers see the complete week only after publication.
- [x] Notifications: team publication alerts and linked-worker assignment-change alerts with unread state and realtime delivery.
- [x] Reporting: owner audit-history screen plus selected-week and worker CSV exports.
- [x] Retention: complete audit CSV export and automatic deletion of audit records older than one year.
- [x] Distribution: phone share sheet/WhatsApp-friendly weekly plan and A4 landscape full-grid printing.
- [x] Austrian public holidays: automatic fixed/movable dates, closed blank columns, and database-enforced assignment rejection.
- [x] Betriebsurlaub: owner/admin date ranges close the workplace, preserve underlying assignments, and block new bookings at database level.
- [x] Dashboard planning: managers, admins, and owners can fill main stations, publish, print, and open the full planner.
- [x] Data: verify returned rows on writes; show errors; preserve forms after failed saves.
- [x] Security: close legacy public worker access and check role-based database writes.
- [x] Authentication: prevent stale profile requests from restoring a signed-out session.
- [x] Access: owner-only invitations, trusted role changes, disabling, and pending-invitation cancellation.
- [x] Accounts: optional link between a login account and a scheduling worker record.
- [x] Database grants: remove inherited table-level TRUNCATE and retain only required operations.
- [x] RLS: remove overlapping permissive policies and separate insert, update, and delete authorization.
- [x] Account blocking: disabled accounts lose database access immediately.
- [x] Auditability: protect and record planner and access-management security events.
- [x] Abuse protection: limit owner invitations to 10 per hour.
- [x] Browser policy: restrict scripts, connections, forms, and referrer information.
- [x] Dependencies: patch the React Router security advisory and verify zero production audit findings.
- [x] Design: neutral surfaces, readable text, one blue accent, restrained status colors.
- [x] Demo data: remove unused mock modules; provide explicitly labeled database sample workers.
- [x] Verification: build, lint, scheduling/date tests, database permission checks.

## Product boundaries

Current product serves one company, Monday through Friday. A station can have multiple workers, but each worker can only occupy one station per day. Worker records are separate from login accounts. No extra login accounts or shared passwords are required for sample workers.

Future product work: company membership and tenant isolation, leave approval workflows, optional phone push/email delivery, and production email configuration. Payroll and time-clock integration are intentionally out of scope.

## Verified this release

Automated scheduling/date checks pass. Live database checks cover RLS, grants, function access, draft privacy, publication, notifications, permanent worker deletion, date and time integrity, double-booking, dated absences, note editing, and atomic selected-week cleanup. Lint and production build pass.

Browser interaction and visual QA remain unverified: the browser tool cannot pass its administrator policy check. End-to-end signup/email recovery also require the configured email provider and redirect URLs.

The hosted demo is deployed. Before invitation testing, add its `/reset-password` address to the hosted Supabase Auth redirect allow list and disable public email sign-ups.

Demo workers and stations are labeled Demo. Existing database records have been preserved; removed local mock files remain recoverable from Git history.
