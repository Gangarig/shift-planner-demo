# ShiftPlanner

ShiftPlanner is a weekly staff-planning demo built with React, TypeScript, Vite, Mantine, and Supabase.

## Demo setup

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key.
2. Install dependencies with `npm ci`.
3. Start the app with `npm run dev`.
4. Sign in with an invited account. Existing owners invite people and assign trusted roles from **Team & Access**.

## Database

The schema is recorded in `supabase/migrations`. It provides workers, stations, daily notes, multiple workers per station, preferred-station defaults, Auth-backed role profiles, Row Level Security, database-level worker double-booking prevention, and unavailable-worker protection.

Signed-in users can view the planner. Managers, admins, and owners can manage workers, stations, and assignments. Owners can invite accounts, change roles, disable access, cancel pending invitations, and optionally link a login to a worker record.

## Verification

```sh
npm test
npm run lint
npm run build
```

## Planner

Select a worker and click a cell, or drag a worker onto the grid. A station can contain multiple workers. Click an assignment to edit its note, move it, or confirm removal. Main-station assignments are created automatically and become manual overrides when moved. Use the week controls, station/worker search, and density switch to adjust your view. The first column and date header remain visible when scrolling.

Austria's 13 nationwide statutory public holidays are automatically marked closed. Their planner cells remain blank, they are excluded from capacity totals, and assignments are rejected in both the interface and database. Fixed and Easter-based holidays are calculated for any year.

Owners and admins can add company-wide Betriebsurlaub ranges from Settings. Closure dates appear blank and closed throughout the schedule, new assignments are rejected by the database, and the underlying schedule is preserved in case the closure is later removed.

Use **Share weekly plan** to send a text version through the phone share sheet, including WhatsApp. Use **Print A4** for a clean landscape printout of the complete weekly grid.

## Database setup

The migrations describe a fresh database plus follow-up integrity fixes. The existing hosted database has already received equivalent SQL changes; do not replay the baseline there without reconciling migration history. The optional supabase/seed.sql adds three labeled demo worker records and two stations. These are not login accounts. It preserves other records.

## Email configuration

In hosted Supabase Auth, allow the actual app origin with `/login` and `/reset-password` as redirect URLs. Include `http://localhost:5173/reset-password` and `https://gangarig.github.io/shift-planner/reset-password`. Hosted settings are separate from local `supabase/config.toml`. Use an appropriate email provider for recipients outside your Supabase team and disable public email sign-ups before using real employee data.

Invitations are sent by the protected `manage-team` Edge Function. Supabase administrative credentials stay server-side and are never included in the React bundle.

## Security

- Row Level Security is enabled on every public table.
- Read and write policies are separated by operation and use trusted profile roles.
- Disabled accounts lose database access immediately, even before an older access token expires.
- Worker, station, assignment, invitation, and access-management changes are recorded in a protected audit log.
- Owners can send at most 10 invitations per hour.
- The deployed page includes a restrictive content security policy and no-referrer policy.
- Production dependencies are checked with `npm audit`; the current audit reports zero vulnerabilities.

## Hosted demo

GitHub Actions deploys `main` to `https://gangarig.github.io/shift-planner/`.

## User documentation

- [Deutsche Bedienungsanleitung](docs/BENUTZERHANDBUCH.md)
- [English user guide](docs/USER_GUIDE.md)
- The deployed app includes both presentable guides. The sidebar opens German by default and each guide has a language switch.

## Scope and verification

See PRODUCT_CHECKLIST.md for completed product behavior and MARKET_READINESS.md for the production launch gates. This is a single-company MVP. Invitation email delivery and a signed-in phone walkthrough still require manual confirmation.
