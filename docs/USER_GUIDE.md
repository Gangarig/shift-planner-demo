# Prägler Shift Planner — simple user guide

Reviewed: 17 September 2026

## What the app does

Prägler Shift Planner keeps one company’s Monday-to-Friday work plan in one place. It replaces the paper grid with a shared weekly schedule while keeping the familiar station-by-day layout.

Planners can assign several workers to one station, move assignments, record shift times and notes, fill workers into their usual stations, close the company for holidays, publish a finished week, share it, and print it on A4 landscape paper. Workers see the complete published plan but cannot change it.

## Access by role

| Role       | What they can do                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker     | View the complete published weekly plan, see their own dashboard, request leave or absence, upload supporting documents, and open their own payslips.               |
| Manager    | Create and change plans, workers, stations, notes, statuses, and main stations; publish, share, and print weeks.                                                    |
| Admin      | Manager access plus company closures, exports, account settings, and read-only payroll oversight.                                                                   |
| Accountant | Review and approve leave requests, verify supporting documents, record overtime, and upload private payslips. They cannot change the work plan.                     |
| Owner      | Full planning and settings access, invitations and account removal, protected audit history, and read-only payroll oversight. Accountant approval remains separate. |

## Start using it

1. The owner opens **Team & Access**, selects **Invite person**, chooses a role, and links the login to a worker record when that person appears on the schedule.
2. The invited person opens the email, creates a password, and signs in.
3. A manager, admin, or owner creates the stations and worker records, then chooses each worker’s main station when useful.
4. Open **Planner**, choose the week, fill main stations or assign workers manually, add daily and assignment notes, and check the grid.
5. Select **Publish week**. Workers can then see the entire week and receive an in-app notification.

## How weekly planning works

- Choose a worker in the Team panel and click a station/day cell, or drag the worker into a cell.
- A station can contain several workers on the same date.
- A worker can have only one station per date. The app and database both reject double-booking.
- Drag an existing assignment to move it. A manual move takes priority over the worker’s main station.
- **Fill main stations** adds missing weekday assignments for workers who have a main station. It does not overwrite manual assignments.
- Click an assignment to change its worker, start/end time, or handover note.
- A daily note appears at the top of that date for information that applies to the whole day.
- Publishing again creates an updated revision and notifies the team.

An empty week can still be published. This is useful when every working day is an Austrian public holiday or Betriebsurlaub.

## Availability, vacation, and sickness

A worker’s general status can be Available, Late, Sick, Vacation, or Inactive. Dated leave is more precise: an approved vacation or sick-leave request blocks only the covered dates.

When the accountant approves vacation or sick leave, the linked dated absence is created and conflicting assignments on those dates are removed. The planner refreshes immediately, labels the dated leave in the Team panel, disables dates that cannot accept an assignment, and the database rejects a conflicting assignment even if someone bypasses the screen.

Late and doctor-appointment records remain informational so an existing work assignment can stay on the plan.

## Main stations and manual changes

A main station is the worker’s normal location. For example, Mathi can have **BÜRO** as the main station and Edi can have **ARBEITSPLATZ HALLE**.

The main station helps fill an otherwise empty week. If a planner manually places Mathi at another station on Wednesday, the manual Wednesday assignment stays there. Filling main stations later will not move Mathi back on that date.

## Leave, documents, overtime, and payslips

Workers open **Leave & Payroll** to request vacation, sick leave, a doctor/hospital appointment, or another absence. A pending request can include PDF, JPG, or PNG evidence up to 10 MB.

The accountant checks each attached document, then approves or rejects the request. Documents must be verified before approval. The accountant also records monthly overtime and privately uploads each worker’s payslip. Workers can open only their own leave records and payslips. Owners and admins have read-only oversight.

The app stores records and documents; it does not calculate salaries or run payroll.

## Holidays and company closure

Official Austrian public holidays are calculated automatically and appear as closed blank columns. Assignments cannot be created on those dates.

An owner or admin can add a **Betriebsurlaub** date range in Settings. Closed dates appear blank, while the underlying plan remains stored and returns if the closure is removed.

## Sharing, printing, exports, and history

- **Share weekly plan** opens the phone share sheet when supported, with a WhatsApp-compatible fallback.
- **Print A4** prints the complete grid in landscape with a plain white background and black text.
- Settings exports the selected week and worker list as CSV files.
- The owner can view the latest protected audit events and export the one-year audit history as CSV. Audit records older than one year are removed automatically.

## Account administration

Only the owner manages login accounts. The owner can change roles, link a login to a worker, disable access, delete a pending invitation, or delete an existing login so the email can be invited again. Deleting a login preserves the separate worker record, schedule history, leave requests, and documents. Deleting a worker record is a separate permanent scheduling action and removes that worker’s assignments.

## Current deployment status

The current release is designed for a controlled pilot at one company. It has protected routes, database row-level access rules, private document storage, audit logging, schedule integrity rules, automated tests, and continuous deployment.

Before storing normal production employee data, finish the operational setup: production SMTP and branded email, final domain and Auth redirect addresses, a restore-tested backup plan, privacy/retention information, a support contact, and a signed-in walkthrough on the phones and computers the company will use. Supabase’s leaked-password check requires a paid plan; the current 10-character minimum and secure password-change settings remain enabled on the Free plan.
