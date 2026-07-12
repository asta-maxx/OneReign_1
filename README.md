# TransitOps - OneReign

TransitOps is a professional, high-performance fleet operations dashboard built with a Nike-inspired brutalist design aesthetic. It provides real-time mapping, role-based access control, and robust operational analytics in an aggressively fast interface.

## Visual Tour

### Dashboard Overview
![Dashboard Overview](/screenshots/ui-1.png)

### Real-time Dispatch Map
![Operations Map](/screenshots/ui-2.png)

### Secure Role-Based Authentication
![Login Gateway](/screenshots/ui-3.png)

## Core Features

- **Brutalist "Chrome-less" Design System**: Minimal borders, aggressive contrasts, unyielding typography (`Bebas Neue` & `Inter`). Built to echo Nike's digital presence.
- **Edge RBAC & Authentication**: JWT verification running directly in Next.js Edge Middleware. Different views dynamically collapse based on secure user roles (Fleet Manager, Driver, Safety Officer, Financial Analyst).
- **Live Fleet Tracking (Pigeon Maps)**: A lightweight, React-native map implementation stripped of performance-killing wrappers.
- **Prisma-backed Fleet Intelligence**: Live data aggregation mapping everything from Vehicle Odometer decay to daily Fuel Logs.

## Tech Stack

- **Framework**: Next.js 14 App Router
- **Mapping**: Pigeon Maps + CartoDB
- **Database**: Prisma + PostgreSQL (with dynamic API seeding)
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Auth**: `jose` JWTs, HTTP-only secured

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Run the initial seed:**
```bash
npx prisma db seed
```
*(This sets up demo accounts and mock fleet data)*

3. **Start the development server:**
```bash
npm run dev
```

Navigate to `http://localhost:3000` to start exploring. 

## Demo Accounts

All demo accounts share the password: `password1234`
- `fleet@transitops.local` (Fleet Manager)
- `driver@transitops.local` (Driver)
- `safety@transitops.local` (Safety Officer)
- `finance@transitops.local` (Financial Analyst)

## Security & Compliance
TransitOps is architected to be SOC 1, SOC 2, and GDPR friendly right out of the box through strict PII obfuscation and rigorous RBAC matrices. Read more in `SOC_GDPR_COMPLIANCE.md`.
