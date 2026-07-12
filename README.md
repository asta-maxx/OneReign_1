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

## Visual Tour

### Dashboard Overview
![Dashboard Overview](/public/screenshots/ui-1.png)

### Real-time Dispatch Map
![Operations Map](/public/screenshots/ui-2.png)

### Secure Role-Based Authentication
![Login Gateway](/public/screenshots/ui-3.png)

<br />

---

<br />

## 1. Architectural Overview

TransitOps is a modular, production-grade fleet management platform designed to handle the full operational lifecycle of a transport company — from vehicle acquisition and driver management, through trip dispatch and execution, to financial reporting and ROI analysis. 

The system leverages a **state-machine-driven core** where vehicles and drivers transition through well-defined statuses with validated guard clauses, ensuring strict data integrity across the platform.

### High-Level System Design

```mermaid
graph TD
    subgraph Client Layer
        UI[Next.js App Router UI]
        Themes[Composio Theme Engine]
        Components[shadcn/ui + Base UI]
    end

    subgraph API Gateway & Controllers
        AuthAPI[Auth & JWT Sessions]
        FleetAPI[Vehicles & Drivers]
        TripAPI[Dispatch & Lifecycle]
        AnalyticAPI[Reports & Analytics]
    end
    
    subgraph Core Services
        State[State Machine Validator]
        Calc[Financial Formula Engine]
    end

    subgraph Data Persistence
        Prisma[Prisma ORM]
        DB[(PostgreSQL)]
    end

    UI --> AuthAPI
    UI --> FleetAPI
    UI --> TripAPI
    UI --> AnalyticAPI
    
    AuthAPI --> Prisma
    FleetAPI --> State
    TripAPI --> State
    AnalyticAPI --> Calc
    
    State --> Prisma
    Calc --> Prisma
    Prisma --> DB
```

<br />

---

<br />

## 2. Technology Stack

Our infrastructure leverages modern, strictly-typed technologies to ensure high availability, scalable data access, and rapid feature iteration.

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js_14-000?style=flat-square&logo=next.js) | Server/client rendering, file-based routing and middleware |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white) | End-to-end type safety and compilation verification |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat-square&logo=postgresql&logoColor=white) | ACID-compliant relational data store |
| **ORM** | ![Prisma](https://img.shields.io/badge/Prisma_5.22-2D3748?style=flat-square&logo=prisma&logoColor=white) | Schema-first data access with declarative migrations |
| **Styling** | ![Tailwind](https://img.shields.io/badge/Tailwind_3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | Utility-first CSS with HSL token architecture |
| **Visualizations**| ![Recharts](https://img.shields.io/badge/Recharts_3.9-22C55E?style=flat-square) | Dynamic, accessible, and responsive data charts |
| **Authentication**| ![JWT](https://img.shields.io/badge/bcrypt_+_JWT-000?style=flat-square&logo=jsonwebtokens&logoColor=white) | Secure password hashing, stateless HttpOnly token auth |
| **Testing** | ![Vitest](https://img.shields.io/badge/Vitest_2.1-6E9F18?style=flat-square&logo=vitest&logoColor=white) | Unit tests for business logic & financial formulas |
| **Infrastructure**| ![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white) | Declarative environment provisioning |

<br />

---

<br />

## 3. Core Modules

<br />

### ![Authentication](https://img.shields.io/badge/Security_&_Auth-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMjJzOC00IDgtMTBWNWwtOC0zLTggM3Y3YzAgNiA4IDEwIDggMTAiLz48L3N2Zz4=)

- Robust sign-up workflows with input sanitization and validation.
- Cryptographic password hashing utilizing **bcrypt** (12 salt rounds).
- Stateless **JWT** authentication passing via secure HttpOnly cookies.
- Comprehensive Role-Based Access Control (RBAC) foundation.

<br />

### ![Dashboard](https://img.shields.io/badge/Command_Center-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iNyIgaGVpZ2h0PSI3Ii8+PHJlY3QgeD0iMTQiIHk9IjMiIHdpZHRoPSI3IiBoZWlnaHQ9IjciLz48cmVjdCB4PSIxNCIgeT0iMTQiIHdpZHRoPSI3IiBoZWlnaHQ9IjciLz48cmVjdCB4PSIzIiB5PSIxNCIgd2lkdGg9IjciIGhlaWdodD0iNyIvPjwvc3ZnPg==)

- **KPI Grid**: Real-time multi-dimensional view of active vehicles, dispatch volume, and fleet utilization.
- **Dynamic Filtering**: Complex multi-parameter filtering (by status, region, type) synchronized seamlessly with URL state.
- **Utilization Visualizations**: Immersive Recharts Area charts augmented with gradient fills and theme-aware tooltips.
- **Progressive Enhancement**: Skeleton loaders that perfectly mirror final DOM structures for layout-shift-free loading.

<br />

### ![Lifecycle](https://img.shields.io/badge/State_Machine_Engine-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIxIiB5PSIzIiB3aWR0aD0iMTUiIGhlaWdodD0iMTMiIHJ4PSIyIi8+PHBhdGggZD0iTTE2IDhoM2EyIDIgMCAwIDEgMiAydjNhMiAyIDAgMCAxLTIgMmgtMyIvPjxjaXJjbGUgY3g9IjciIGN5PSIxNSIgcj0iMiIvPjxjaXJjbGUgY3g9IjE3IiBjeT0iMTUiIHI9IjIiLz48L3N2Zz4=)

The core operational logic runs on strict transition engines to prevent invalid states.

```mermaid
stateDiagram-v2
    direction LR

    state "Vehicle Status Matrix" as VL {
        [*] --> Available
        Available --> On_Trip : Dispatch
        On_Trip --> Available : Complete / Cancel
        Available --> In_Shop : Open Maintenance
        In_Shop --> Available : Close Maintenance
        Available --> Retired : Retire
    }
```

<br />

### ![Financial](https://img.shields.io/badge/Financial_&_Analytics-0d1117?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNhMGFlYzAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTgiIHkxPSIyMCIgeDI9IjE4IiB5Mj0iMTAiLz48bGluZSB4MT0iMTIiIHkxPSIyMCIgeDI9IjEyIiB5Mj0iNCIvPjxsaW5lIHgxPSI2IiB5MT0iMjAiIHgyPSI2IiB5Mj0iMTQiLz48L3N2Zz4=)

- **Fuel Efficiency Algorithms**: Computational analysis of `distanceKm / totalLiters` across the fleet.
- **Operational Cost Aggregation**: Unifying fuel logs, maintenance overhead, and variable expenses per time period.
- **ROI Engine**: Real-time evaluation of `((Revenue - OperationalCost) / AcquisitionCost) * 100`.
- **Client-Side Export**: Integrated CSV generation algorithms across all data tables for deep offline analysis.

<br />

---

<br />

## 4. Entity-Relationship Architecture

The normalized PostgreSQL schema provides high query performance and referential integrity across 6 distinct but deeply connected domain models.

```mermaid
erDiagram
    Vehicle ||--o{ MaintenanceLog : records
    Vehicle ||--o{ FuelLog : consumes
    Vehicle ||--o{ Expense : incurs
    Vehicle ||--o{ Trip : fulfills
    Driver ||--o{ Trip : operates
    User ||--o{ Action : performs

    Vehicle {
        string id PK
        string regNumber UK
        string type
        int maxLoadCapacity
        int odometer
        float acquisitionCost
        string status
    }

    Driver {
        string id PK
        string licenseNumber UK
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
    }
```

<br />

---

<br />

## 5. API Topography

```mermaid
flowchart LR
    Gateway((Client)) --> Auth["/api/auth"]
    Gateway --> Ops["/api/vehicles"]
    Gateway --> Dispatch["/api/trips"]
    Gateway --> Logs["/api/maintenance"]
    
    Auth --> Signup
    Auth --> Session
    
    Ops --> Fetch[Available Lookup]
    Ops --> Metrics[ROI & OpCost]
    
    Dispatch --> Create
    Dispatch --> Lifecycle[Dispatch / Complete]
```

<br />

---

<br />

## 6. Installation & Deployment

### Dependencies
| Requirement | Minimum Version |
|:------------|:----------------|
| ![Node](https://img.shields.io/badge/Node.js-≥_18-339933?style=flat-square&logo=node.js&logoColor=white) | LTS recommended |
| ![Docker](https://img.shields.io/badge/Docker-Latest-2496ED?style=flat-square&logo=docker&logoColor=white) | Required for local Database |

### Startup Sequence

```bash
# 1. Clone the repository and install packages
git clone https://github.com/asta-maxx/OneReign_1.git
cd OneReign_1
npm install

# 2. Spin up the relational database
docker compose up -d

# 3. Apply schema and generate types
npx prisma migrate dev
npx prisma generate

# 4. (Optional) Hydrate database with mock data
npm run db:seed

# 5. Launch the application
npm run dev
```

Visit the application at **http://localhost:3000**.

<br />

---

<br />

## 7. Demo Accounts

All demo accounts share the password: `password1234`
- `fleet@transitops.local` (Fleet Manager)
- `driver@transitops.local` (Driver)
- `safety@transitops.local` (Safety Officer)
- `finance@transitops.local` (Financial Analyst)

<br />

---

<br />

## 8. UI / UX Design System

The application strictly adheres to a **minimalist, ops-intelligence aesthetic** (heavily inspired by developer infrastructure platforms like Vercel, Linear, and Stripe).

- **Multi-Theme Support**: Flawless transitions between pure black (`#0f0f0f`) dark modes and crisp white light modes using a centralized `ThemeProvider`.
- **CSS Variable Architecture**: All tokens are strictly defined in HSL, completely avoiding hardcoded HEX values to ensure infinite scalability.
- **Data Display**: Tabular numbers for financial integrity, subtle elevations for interactive surfaces, and Recharts optimized with custom CSS vars.

<br />

---

<br />

## 9. Security & Compliance (SOC 1/2 & GDPR)

TransitOps is engineered with security and data privacy by design to streamline compliance audits for SOC 1, SOC 2, and GDPR requirements.

- **SOC 2 (Security & Confidentiality)**: Enforces stateless authentication using **HttpOnly JWTs** and robust **bcrypt password hashing** (12 salt rounds). Eliminates Cross-Site Scripting (XSS) risks related to session tokens. Comprehensive Role-Based Access Control (RBAC) satisfies logical access control requirements.
- **SOC 1 (Data Integrity)**: The state-machine-driven dispatch architecture guarantees valid transitions, producing immutable operational records essential for transparent financial reporting (ROI & Expense metrics).
- **GDPR (Data Privacy)**: Incorporates strict data minimization principles by design. TLS/HTTPS enforcement for in-transit data and bcrypt for at-rest password data satisfy Article 32 (Security of Processing). 

> For detailed technical mappings, see the `SOC_GDPR_COMPLIANCE.md` artifact included in the source code.

<br />

---

<br />

<div align="center">
  <br />
  <strong>Built by OneReign</strong>
  <br />
  <br />
  <img src="https://img.shields.io/badge/Crafted_with_Precision-000000?style=for-the-badge&logo=vercel" alt="Precision" />
</div>
