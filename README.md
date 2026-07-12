<div align="center">

# TransitOps

**Enterprise Fleet Operations Intelligence Platform**

<br />

A full-stack fleet management system built for real-time vehicle tracking,<br />
trip lifecycle orchestration, financial analytics, and operational intelligence.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Recharts](https://img.shields.io/badge/Recharts-3.9-22C55E?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTE4IDIwVjEwTTEyIDIwVjRNNiAyMHYtNiIvPjwvc3ZnPg==&logoColor=white)](https://recharts.org)
[![Vitest](https://img.shields.io/badge/Vitest-2.1-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)

<br />

![Status](https://img.shields.io/badge/Status-Active_Development-22C55E?style=flat-square)
![License](https://img.shields.io/badge/License-Private-EF4444?style=flat-square)

</div>

<br />

---

<br />

## Overview

TransitOps is a modular, production-grade fleet management platform designed to handle the full operational lifecycle of a transport company — from vehicle acquisition and driver management, through trip dispatch and execution, to financial reporting and ROI analysis.

The system is architected around a **state-machine-driven core** where vehicles and drivers transition through well-defined statuses with validated guard clauses, ensuring data integrity across every operation.

<br />

---

<br />

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js App Router)                │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │ Dashboard │  │ Reports &  │  │Maintenance│  │  Fuel Logs &     │ │
│  │   KPIs    │  │ Analytics  │  │  Module   │  │   Expenses       │ │
│  └─────┬─────┘  └─────┬──────┘  └─────┬─────┘  └───────┬──────────┘ │
│        └───────────────┴───────────────┴────────────────┘            │
│                          ↓ API Client Layer (lib/api/*)              │
├─────────────────────────────────────────────────────────────────────┤
│                        Backend (API Routes)                         │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │  Auth     │  │  Vehicles  │  │   Trips   │  │  Analytics &     │ │
│  │  (JWT)    │  │  & Drivers │  │ Lifecycle │  │  Cost Engine     │ │
│  └─────┬─────┘  └─────┬──────┘  └─────┬─────┘  └───────┬──────────┘ │
│        └───────────────┴───────────────┴────────────────┘            │
│                     ↓ Status Transition Engine                      │
├─────────────────────────────────────────────────────────────────────┤
│                    Data Layer (Prisma ORM + PostgreSQL)              │
│  Vehicle ←→ Trip ←→ Driver    MaintenanceLog   FuelLog   Expense   │
└─────────────────────────────────────────────────────────────────────┘
```

### State Machines

```mermaid
stateDiagram-v2
    direction LR

    state "Vehicle Lifecycle" as VL {
        [*] --> Available
        Available --> On_Trip : dispatch
        On_Trip --> Available : complete / cancel
        Available --> In_Shop : open maintenance
        In_Shop --> Available : close maintenance
        Available --> Retired : retire
        On_Trip --> Retired : retire
        In_Shop --> Retired : retire
    }
```

```mermaid
stateDiagram-v2
    direction LR

    state "Trip Lifecycle" as TL {
        [*] --> Draft
        Draft --> Dispatched : dispatch
        Dispatched --> Completed : complete
        Dispatched --> Cancelled : cancel
        Draft --> Cancelled : cancel
    }
```

```mermaid
stateDiagram-v2
    direction LR

    state "Driver Lifecycle" as DL {
        [*] --> Available
        Available --> On_Trip : assigned
        On_Trip --> Available : trip ends
        Available --> Off_Duty : clock out
        Off_Duty --> Available : clock in
        Available --> Suspended : suspend
        On_Trip --> Suspended : suspend
        Off_Duty --> Suspended : suspend
    }
```

<br />

---

<br />

## Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js_14-000?style=flat-square&logo=next.js) | Server/client rendering, file-based routing |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white) | End-to-end type safety |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white) | Relational data store (self-hosted via Docker) |
| **ORM** | ![Prisma](https://img.shields.io/badge/Prisma_5.22-2D3748?style=flat-square&logo=prisma&logoColor=white) | Schema-first data access with migrations |
| **Styling** | ![Tailwind](https://img.shields.io/badge/Tailwind_3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | Design system with HSL token architecture |
| **Charts** | ![Recharts](https://img.shields.io/badge/Recharts_3.9-22C55E?style=flat-square) | Custom-styled data visualizations |
| **Auth** | ![JWT](https://img.shields.io/badge/bcrypt_+_JWT-000?style=flat-square&logo=jsonwebtokens&logoColor=white) | Password hashing, stateless token auth |
| **Testing** | ![Vitest](https://img.shields.io/badge/Vitest_2.1-6E9F18?style=flat-square&logo=vitest&logoColor=white) | Unit tests for business logic & formulas |
| **Infra** | ![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white) | One-command local PostgreSQL provisioning |

<br />

---

<br />

## Modules

<br />

### ![Authentication](https://img.shields.io/badge/Authentication-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTAiLz48L3N2Zz4=)

- Signup with input validation (email format, password strength, name length)
- bcrypt password hashing (12 salt rounds)
- JWT token generation with HttpOnly cookie transport
- Foundation for login/logout session lifecycle

<br />

### ![Dashboard & Analytics](https://img.shields.io/badge/Dashboard_&_Analytics-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iNyIgaGVpZ2h0PSI3Ii8+PHJlY3QgeD0iMTQiIHk9IjMiIHdpZHRoPSI3IiBoZWlnaHQ9IjciLz48cmVjdCB4PSIxNCIgeT0iMTQiIHdpZHRoPSI3IiBoZWlnaHQ9IjciLz48cmVjdCB4PSIzIiB5PSIxNCIgd2lkdGg9IjciIGhlaWdodD0iNyIvPjwvc3ZnPg==)

- **KPI Grid** — Real-time fleet overview: Active Vehicles, Available, In Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %
- **Filter Bar** — Dynamic filtering by status, region, vehicle type with URL state sync
- **Utilization Chart** — Recharts Area chart with gradient fill, custom dark-theme tooltips
- **Skeleton Loaders** — Layout-matching loading states (no spinners)

<br />

### ![Reports Hub](https://img.shields.io/badge/Reports_Hub-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTgiIHkxPSIyMCIgeDI9IjE4IiB5Mj0iMTAiLz48bGluZSB4MT0iMTIiIHkxPSIyMCIgeDI9IjEyIiB5Mj0iNCIvPjxsaW5lIHgxPSI2IiB5MT0iMjAiIHgyPSI2IiB5Mj0iMTQiLz48L3N2Zz4=)

| Report | Visualization | Key Metric |
|:-------|:-------------|:-----------|
| **Fuel Efficiency** | Bar chart + sortable table | km/l per vehicle with color-coded thresholds |
| **Fleet Utilization** | Line chart + data table | Active vs. idle days with red-flagging |
| **Operational Cost** | Stacked bar (Fuel vs. Maintenance) | Total cost per vehicle |
| **ROI Analysis** | Color-coded data table | Per-vehicle return on investment % |

> All reports include **client-side CSV export** — one-click download of the currently filtered dataset.

<br />

### ![Maintenance Management](https://img.shields.io/badge/Maintenance_Management-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTQuNyA2LjNhMSAxIDAgMCAwIDAgMS40bDEuNiAxLjZhMSAxIDAgMCAwIDEuNCAwbDMuNy0zLjdhNiA2IDAgMCAxLTcuNCA3LjRsLTYgNmExLjUgMS41IDAgMCAxLTIuMS0yLjFsNi02YTYgNiAwIDAgMSA3LjQtNy40eiIvPjwvc3ZnPg==)

- Create, track, and close maintenance logs per vehicle
- Vehicle status automatically transitions to `In Shop` on active maintenance
- Closing a maintenance record restores vehicle to `Available`

<br />

### ![Fuel Logs](https://img.shields.io/badge/Fuel_Logs-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyAyMnYtN2wxLTMgNC0yaDZsNCAyIDEgM3Y3Ii8+PHBhdGggZD0iTTEyIDJhNSA1IDAgMCAxIDUgNXYySDd2LTJhNSA1IDAgMCAxIDUtNXoiLz48L3N2Zz4=)

- Log fuel fill-ups with volume (liters), cost, and date
- Per-vehicle fuel history tracking
- Data feeds into the Fuel Efficiency report

<br />

### ![Expense Tracking](https://img.shields.io/badge/Expense_Tracking-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTIiIHkxPSIxIiB4Mj0iMTIiIHkyPSIyMyIvPjxwYXRoIGQ9Ik0xNyA1SDkuNWE0IDQgMCAwIDAgMCA4aDVhNCA0IDAgMCAxIDAgOEg2Ii8+PC9zdmc+)

- Categorized expenses: Toll, Maintenance, Other
- Per-vehicle expense aggregation
- Data feeds into the Operational Cost and ROI reports

<br />

### ![Vehicle & Driver Lifecycle](https://img.shields.io/badge/Vehicle_&_Driver_Lifecycle-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIxIiB5PSIzIiB3aWR0aD0iMTUiIGhlaWdodD0iMTMiIHJ4PSIyIi8+PHBhdGggZD0iTTE2IDhoM2EyIDIgMCAwIDEgMiAydjNhMiAyIDAgMCAxLTIgMmgtMyIvPjxjaXJjbGUgY3g9IjciIGN5PSIxNSIgcj0iMiIvPjxjaXJjbGUgY3g9IjE3IiBjeT0iMTUiIHI9IjIiLz48L3N2Zz4=)

- Full CRUD for vehicles and drivers
- **State Machine Engine** (`lib/statusTransitions.ts`) — validates every status transition:
  - Vehicle: `Available` → `On Trip` → `Available`, `Available` → `In Shop` → `Available`, `*` → `Retired`
  - Driver: `Available` → `On Trip` → `Available`, `Available` → `Off Duty` → `Available`, `*` → `Suspended`
- Atomic trip lifecycle: `Draft` → `Dispatched` → `Completed` | `Cancelled`

<br />

### ![Financial Formulas Engine](https://img.shields.io/badge/Financial_Formulas_Engine-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSI0IiB5PSIyIiB3aWR0aD0iMTYiIGhlaWdodD0iMjAiIHJ4PSIyIi8+PGxpbmUgeDE9IjgiIHkxPSI2IiB4Mj0iMTYiIHkyPSI2Ii8+PGxpbmUgeDE9IjgiIHkxPSIxMCIgeDI9IjE2IiB5Mj0iMTAiLz48bGluZSB4MT0iOCIgeTE9IjE0IiB4Mj0iMTIiIHkyPSIxNCIvPjwvc3ZnPg==)

- **Fuel Efficiency** — `distanceKm / totalLiters` per vehicle
- **Operational Cost** — aggregated fuel + maintenance + expenses per vehicle per period
- **ROI** — `(Revenue - OperationalCost) / AcquisitionCost x 100`
- All formulas are unit-tested with Vitest (`lib/calc.test.ts`)

<br />

---

<br />

## Data Model

```mermaid
erDiagram
    Vehicle ||--o{ MaintenanceLog : has
    Vehicle ||--o{ FuelLog : has
    Vehicle ||--o{ Expense : has
    Vehicle ||--o{ Trip : has
    Driver ||--o{ Trip : drives

    Vehicle {
        string id PK
        string regNumber UK
        string name
        string type
        int maxLoadCapacity
        int odometer
        float acquisitionCost
        string status
    }

    Driver {
        string id PK
        string name
        string licenseNumber UK
        string licenseCategory
        date licenseExpiry
        float safetyScore
        string status
    }

    Trip {
        string id PK
        string vehicleId FK
        string driverId FK
        string status
        float distance
        float revenue
        string region
    }

    MaintenanceLog {
        string id PK
        string vehicleId FK
        string description
        string status
    }

    FuelLog {
        string id PK
        string vehicleId FK
        float liters
        float cost
        date date
    }

    Expense {
        string id PK
        string vehicleId FK
        string type
        float amount
        date date
    }
```

> **6 models** · All relationships indexed · Status fields use plain strings (not enums) for flexibility with space-containing values like `"On Trip"` and `"In Shop"`.

<br />

---

<br />

## API Surface

```mermaid
graph LR
    subgraph Auth
        POST_signup["POST /api/auth/signup"]
        POST_login["POST /api/auth/login"]
        POST_logout["POST /api/auth/logout"]
    end

    subgraph Vehicles
        GET_vehicles["GET /api/vehicles"]
        POST_vehicles["POST /api/vehicles"]
        GET_available["GET /api/vehicles/available"]
        POST_retire["POST /api/vehicles/:id/retire"]
        GET_opcost["GET /api/vehicles/:id/operational-cost"]
        GET_roi["GET /api/vehicles/:id/roi"]
    end

    subgraph Drivers
        GET_drivers["GET /api/drivers"]
        POST_drivers["POST /api/drivers"]
        GET_davail["GET /api/drivers/available"]
        PATCH_driver["PATCH /api/drivers/:id"]
    end

    subgraph Trips
        GET_trips["GET /api/trips"]
        POST_trips["POST /api/trips"]
        POST_dispatch["POST /api/trips/:id/dispatch"]
        POST_complete["POST /api/trips/:id/complete"]
        POST_cancel["POST /api/trips/:id/cancel"]
    end

    subgraph Operations
        GET_maint["GET /api/maintenance"]
        POST_maint["POST /api/maintenance"]
        GET_fuel["GET /api/fuel-logs"]
        POST_fuel["POST /api/fuel-logs"]
        GET_exp["GET /api/expenses"]
        POST_exp["POST /api/expenses"]
    end

    subgraph Analytics
        GET_kpis["GET /api/analytics"]
    end
```

<br />

---

<br />

## Getting Started

### Prerequisites

| Requirement | Version |
|:------------|:--------|
| ![Node](https://img.shields.io/badge/Node.js-≥_18-339933?style=flat-square&logo=node.js&logoColor=white) | LTS recommended |
| ![Docker](https://img.shields.io/badge/Docker-Latest-2496ED?style=flat-square&logo=docker&logoColor=white) | For PostgreSQL |

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/asta-maxx/OneReign_1.git
cd OneReign_1

# 2. Install dependencies
npm install

# 3. Start PostgreSQL
docker compose up -d

# 4. Configure environment
cp .env.example .env

# 5. Run database migrations & generate client
npx prisma migrate dev
npx prisma generate

# 6. Seed the database (optional)
npm run db:seed

# 7. Start the development server
npm run dev
```

Open **http://localhost:3000** to view the application.

### Available Scripts

| Command | Description |
|:--------|:------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run test` | Run unit tests (Vitest) |
| `npm run lint` | Run ESLint |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:migrate` | Run pending database migrations |
| `npm run db:seed` | Seed database with sample data |

<br />

---

<br />

## Project Structure

```
├── app/
│   ├── api/                    # Backend API routes
│   │   ├── auth/               #   ├── signup, login, logout
│   │   ├── analytics/          #   ├── Fleet KPIs & aggregations
│   │   ├── vehicles/           #   ├── CRUD + retire + operational-cost + ROI
│   │   ├── drivers/            #   ├── CRUD + available lookup
│   │   ├── trips/              #   ├── CRUD + dispatch + complete + cancel
│   │   ├── maintenance/        #   ├── Create, list, close
│   │   ├── fuel-logs/          #   ├── Create, list
│   │   └── expenses/           #   └── Create, list
│   ├── dashboard/              # Dashboard screen (KPIs + charts)
│   ├── reports/                # Analytics reports (4 tabs)
│   ├── maintenance/            # Maintenance management UI
│   ├── fuel-logs/              # Fuel logging UI
│   └── expenses/               # Expense tracking UI
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── layout/                 # Sidebar navigation
│   ├── KpiCard.tsx             # Reusable KPI display card
│   ├── FilterBar.tsx           # Dynamic filter controls
│   ├── ReportTable.tsx         # Generic table + CSV export
│   ├── ChartTooltip.tsx        # Custom Recharts tooltip
│   └── SkeletonLoaders.tsx     # Loading state components
├── lib/
│   ├── api/                    # API client layer (mock-toggle)
│   ├── auth/                   # JWT, bcrypt, validation utilities
│   ├── statusTransitions.ts    # State machine for Vehicle/Driver
│   ├── trip.ts                 # Trip lifecycle engine
│   ├── driver.ts               # Driver CRUD operations
│   ├── calc.ts                 # Financial formula library
│   ├── calc.test.ts            # Formula unit tests
│   └── prisma.ts               # Database client singleton
├── prisma/
│   └── schema.prisma           # Data model (6 models)
└── docker-compose.yml          # PostgreSQL 16 container
```

<br />

---

<br />

## Design System

The UI follows a **minimalist, ops-intelligence aesthetic** — inspired by tools like Linear, Vercel, and Stripe Dashboard.

| Principle | Implementation |
|:----------|:--------------|
| **Dark-first** | Pure black (`#000`) background with zinc-toned cards |
| **HSL Tokens** | All colors driven by CSS custom properties, zero hardcoded hex values |
| **Typography** | Strong hierarchy with `tabular-nums` for financial data, `tracking-tight` for headings |
| **Elevation** | Subtle `shadow-sm` + thin 1px borders (`border-border/50`), never both heavy shadow and thick border |
| **Interactions** | Hover lift on cards, smooth transitions on filter changes, Recharts entrance animations |

<br />

---

<br />

<div align="center">

**Built by OneReign.**

</div>
