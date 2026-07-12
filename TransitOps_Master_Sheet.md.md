## — TransitOps Master Build Sheet 

Smart Transport Operations Platform | 8-Hour Hackathon | 4-Person Team - — - Constraint: No third party APIs or hosted/managed DB fully self hosted stack 

## 1. Tech Stack 

|Layer|Choice|Notes|
|---|---|---|
|Frontend|Next.js 14 (AppRouter) +Tailwind|Fast scafolding, noexternal|
||+ shadcn/ui|dependency|
|Backend|Next.jsAPIroutes|Self-contained, no separate|
|||hostedservice|
|Database|PostgreSQL(self-hostedvia|Runslocally, no managed DB|
||Docker) —SQLite as zero-setup|service|
||fallback if Docker unavailable||
|ORM|Prisma|Schema-frst, migrations, type-|
|||safety|
|Auth|Custom-built:bcrypt password|NoAuth0/Clerk/Supabase Auth|
||hashing+JWT(localsecret) +||
||httpOnlycookies||
|RBAC|Custom middlewarereading JWT|Roles:FleetManager,Driver,|
||role claim,guardingroutes/actions|SafetyOfcer,Financial Analyst|
|Filestorage(ifused)|Localflesystem (<br>`/uploads` )|NoS3/Cloudinary|
|Realtimeupdates|Refetch-on-mutation / simple|NoWebSocket serviceneeded|
||polling||
|Charts|Recharts|Clientlibrary, notanAPI|
|CSV export|`papaparse`  or manualserver-|Library, notaruntime API|
||sidestring build|dependency|
|Deployment/Demo|Localhostdemo (safest) orVercel|Confrm withorganizers whether|
||if allowed|hosting countsas "third-party"|
|Dev tools (not|Claude — schema,businesslogic,|Usedtobuildthe app, notcalled|
|runtime deps)|auth, validationengines,code|by the appitself|
||review||
||Antigravity —UIscafolding, page||



Choice 

Layer 

Notes 

generation, component wiring — GPT pitch copy, README, secondary debugging 

" - ⚠ Action item before Hour 0: Confirm with organizers whether no third party APIs/DB" excludes libraries like Prisma/bcrypt/jsonwebtoken/Recharts, or only excludes hosted/managed services (Supabase, Auth0, cloud DB, etc.). This plan assumes the latter (standard interpretation). 

## 2. Scope (Locked) 

## Build (mandatory, from PS): 

- Custom auth + RBAC (4 roles) 

- Vehicle Registry: unique reg number, type, capacity, odometer, acquisition cost, status (Available/On Trip/In Shop/Retired) 

- Driver Management: license number/category/expiry, safety score, status 

- (Available/On Trip/Off Duty/Suspended) 

- Trip Management: Draft → Dispatched → Completed → Cancelled, full validation rules 

- Maintenance Log: create/close, auto vehicle status transitions 

- Fuel Logs + Expenses, auto operational cost computation 

- Dashboard: KPIs + filters (type/status/region) 

- 

- Reports: Fuel Efficiency, Fleet Utilization, Operational Cost, ROI CSV export 

## Cut/defer (bonus items — only if time remains at Hour 7+): 

- PDF export 

- 

- Email license expiry reminders 

- Vehicle document management 

- Dark mode 

## 3. Mandatory Business Rules (the thing judges will actually test) 

- Vehicle registration number is unique (DB-level constraint) 

- Retired / In Shop vehicles never appear in dispatch selection 

- Drivers with expired license or Suspended status cannot be assigned 

- On Trip vehicle/driver cannot be assigned to another trip 

- Cargo weight must not exceed vehicle's max load capacity 

- Dispatch → vehicle + driver → On Trip 

- Complete → vehicle + driver → Available 

- Cancel dispatched trip → vehicle + driver → Available 

- Create active maintenance record → vehicle → In Shop (hidden from dispatch) 

- Close maintenance → vehicle → Available (unless Retired) 

## Design rule: all status transitions go through ONE shared function (e.g. 

`updateVehicleStatus()` / `updateDriverStatus()` ), called by Trip module AND Maintenance module. Never duplicate this logic in two places — this is the #1 source of last-minute bugs in a build like this. 

## 4. Data Model (Prisma schema entities) 

User (id, name, email, passwordHash, role, status) Vehicle (id, regNumber [unique], name, type, maxLoadCapacity, odometer, acquisitionCost, status) 

Driver (id, name, licenseNumber, licenseCategory, licenseExpiry, contactNumber, safetyScore, status) Trip (id, source, destination, vehicleId, driverId, cargoWeight, plannedDistance, status, createdAt) MaintenanceLog (id, vehicleId, description, status [Active/Closed], createdAt, closedAt) FuelLog (id, vehicleId, liters, cost, date) Expense (id, vehicleId, type, amount, date) 

## - - 5. Hour b Hour Plan y 

- Time Activity 0:00– All 4 together: Claude drafts Prisma schema + migrations, Docker Postgres spun up, 0:30 repo/env setup, Tailwind theme tokens locked so screens look consistent across people 

- 0:30– Person 1 builds auth (signup/login, bcrypt, JWT, cookies, middleware) + role guards. 1:15 Others stub their module pages against the agreed schema so nobody is blocked waiting on auth 

- 1:15– Parallel module build (see Work Split below). Sync check-in every ~90 min to catch 5:00 integration drift early 5:00– Business-rule integration pass: verify shared status-transition function is used 6:00 consistently by Trip + Maintenance modules; fix any duplicate/conflicting logic 

Time Activity 

|6:00–|Dashboard+Reports wiring: pullreal data intoKPIs,charts,ROI/utilization/fuel-|
|---|---|
|7:00|efciencyformulas,CSV export|
|7:00–|Full demo rehearsalusingthe exactPS exampleworkfowend-to-end; fxbreakages;|
|7:30|Antigravity passfor visual consistency|
|7:30–|Pitch deck(GPT drafts structure/copy), fnal commit, submission|
|8:00||



## 6. Work Split (4 People) 

## — Person 1 Auth, RBAC & Fleet Registry Lead 

- Custom auth: signup/login routes, bcrypt hashing, JWT + httpOnly cookies, auth middleware, role-based route guards 

- Vehicle Registry: CRUD, unique reg number validation, filters (type/status/region) 

- Tools: Claude for auth flow + Prisma schema (security-sensitive — don't wing this), Antigravity for CRUD UI 

## — Person 2 Driver & Trip Lifecycle Lead (owns the core state machine) 

- Driver Management: CRUD, license expiry check, safety score, status 

- Trip Management: create/dispatch/complete/cancel + all validation (capacity, availability, license/suspension checks) 

- Owns the shared status-transition function used by both Trip and Maintenance modules 

- Tools: Claude for the entire validation + status-transition engine (most judge— 

- visible logic get this airtight), Antigravity for trip creation UI 

## Person 3 — Maintenance & Fuel/Expense Lead 

- Maintenance Log: create/close, calls Person 2's shared status function (does not duplicate it) 

- Fuel Logs + Expenses, auto operational cost computation (Fuel + Maintenance) per vehicle 

- Tools: Claude for cost aggregation logic, Antigravity for maintenance/fuel entry screens 

## — Person 4 Dashboard, Analytics & Reports Lead 

Dashboard: KPIs + filters 

- Reports: Fuel Efficiency, Fleet Utilization, Operational Cost, ROI formula, CSV export 

- Integration testing across all modules + seeding demo data for rehearsal 

- — 

- Tools: Claude for ROI/utilization formulas (judge visible numbers must be 

- correct), GPT for report copy/labels, Antigravity for charts 

## 7. Demo Script (3 minutes, straight from the PS example) 

- 

- 1. Register Van 05 (capacity 500kg), register driver Alex → both show Available 

2. Create trip, cargo = 450kg → dispatch succeeds. Live improvisation: try 600kg on a second trip → rejected on the spot 

3. Vehicle + Driver visibly flip to On Trip on dashboard 

4. Complete trip (enter odometer + fuel consumed) → both flip back to Available 

5. Create maintenance record → vehicle instantly disappears from dispatch dropdown, status → In Shop 

6. Close out on Reports tab → Fleet Utilization % and ROI update live 

## 8. Setup Checklist (Hour 0) 

" - " Confirm no third party API/DB interpretation with organizers 

— `docker-compose.yml` committed to repo (Postgres) one command, identical DB for all 4 machines 

- Prisma schema drafted by Claude, `prisma migrate dev` run successfully 

- `.env` template shared (JWT secret, DB URL) — not committed with real secrets 

Shared Tailwind/shadcn theme tokens agreed before anyone builds a screen 

- Git branching convention agreed (e.g. one branch per person, merge every 90 min) 

## 9. Key Risk to Protect Against 

Shared status-transition logic drift. If Trip and Maintenance modules each write their own vehicle/driver status update code instead of calling one shared function, you'll get race conditions and inconsistent states right before the demo. Person 2 owns this function; Person 3 must call it, not reimplement it. Verify this explicitly during the Hour – 5 6 integration pass. 

