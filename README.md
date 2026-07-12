# TransitOps

**Smart Transport Operations Platform**

TransitOps is a fully self-hosted, end-to-end transport operations platform designed to manage fleets, drivers, trips, maintenance, and operational analytics. Built with a strict constraint of utilizing **zero third-party APIs or hosted/managed databases**, this project demonstrates a robust, self-contained architecture suitable for isolated environments.

## 🚀 Tech Stack

The application is built on a modern, self-contained stack to ensure zero external dependencies at runtime.

### Frontend
*   **Framework:** Next.js 14 (App Router)
*   **Styling:** Tailwind CSS + shadcn/ui for fast, consistent, and accessible components.
*   **Data Visualization:** Recharts for client-side rendering of operational KPIs.

### Backend & Core
*   **API & Logic:** Next.js API Routes (Server-side logic running locally).
*   **Authentication:** Custom-built implementation.
    *   `bcrypt` for secure password hashing.
    *   JWT (JSON Web Tokens) with local secrets.
    *   `httpOnly` cookies for secure session management.
*   **Authorization (RBAC):** Custom middleware guarding routes and actions based on JWT role claims (Fleet Manager, Driver, Safety Officer, Financial Analyst).

### Database & Data Management
*   **Database:** PostgreSQL (Self-hosted via Docker). SQLite supported as a zero-setup fallback.
*   **ORM:** Prisma for schema-first design, type safety, and automated migrations.
*   **File Storage:** Local filesystem (`/uploads`).
*   **Export:** `papaparse` for server-side CSV generation.

## 🏗️ Core Features & Architecture

### 1. Custom Role-Based Access Control (RBAC)
Secure authentication flow tailored for four distinct operational roles, ensuring users only access relevant modules and data.

### 2. Fleet & Driver Management
*   **Vehicle Registry:** Manages unique registration numbers, vehicle types, max load capacities, odometer readings, and current statuses (Available, On Trip, In Shop, Retired).
*   **Driver Profiles:** Tracks license details (number, category, expiry), safety scores, and operational statuses (Available, On Trip, Off Duty, Suspended).

### 3. Trip Lifecycle Engine
A robust state machine governing trip dispatch and execution.
*   **Flow:** Draft -> Dispatched -> Completed -> Cancelled.
*   **Validation Rules:**
    *   Cargo weight cannot exceed the assigned vehicle's maximum load capacity.
    *   Vehicles marked "Retired" or "In Shop" cannot be dispatched.
    *   Drivers with expired licenses or "Suspended" status cannot be assigned.
    *   Entities already "On Trip" are locked from new assignments.

### 4. Maintenance & Expense Tracking
*   **Maintenance Logs:** Creating an active maintenance record automatically transitions the associated vehicle to "In Shop" status, hiding it from the dispatch selection. Closing the log reverts it to "Available".
*   **Financials:** Automated computation of operational costs aggregating fuel logs and maintenance expenses.

### 5. Analytics Dashboard & Reporting
*   Real-time computation of key metrics: Fuel Efficiency, Fleet Utilization, Operational Cost, and ROI.
*   Dynamic filtering by vehicle type, status, and region.
*   Data export to CSV.

## ⚙️ Business Rules & State Management

A critical architectural decision in TransitOps is the **centralization of status transitions**. All entity state changes (e.g., updating a vehicle's status when dispatched or entering maintenance) are routed through a single, shared logical engine. 

This prevents race conditions, eliminates duplicated logic between the Trip and Maintenance modules, and ensures data integrity across the platform.

## 🛠️ Local Setup & Deployment

1.  **Environment Setup:** Clone the repository and configure the local `.env` file (Database URL, JWT Secret).
2.  **Database Spin-up:** Run `docker-compose up -d` to start the local PostgreSQL instance.
3.  **Migrations:** Execute `npx prisma migrate dev` to push the schema to the database.
4.  **Install Dependencies:** Run `npm install` (or `pnpm install` / `yarn install`).
5.  **Start Development Server:** Run `npm run dev`.
