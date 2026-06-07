# RecruitIQ — Enterprise HRMS & Payroll Portal

RecruitIQ is a production-ready, full-stack **Human Resource Management System** and **Automated Payroll Engine** built entirely on Next.js 16. It eliminates the need for a separate backend server by co-locating all business logic, API handlers, and database access within the same Next.js application — deployed as a single unit to Vercel or any Node.js host.

The system is designed for **small-to-mid-size organisations** that need a secure, self-hosted HR platform covering the complete employee lifecycle: from onboarding and daily attendance clocking to automated payroll computation and payslip distribution.

---

## Table of Contents

1. [What RecruitIQ Does](#what-recruitiq-does)
2. [Feature Set](#feature-set)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Role System & Access Control](#role-system--access-control)
7. [Core Engines Explained](#core-engines-explained)
8. [API Reference](#api-reference)
9. [Environment Variables](#environment-variables)
10. [Getting Started](#getting-started)
11. [Deployment](#deployment)
12. [Security Hardening Notes](#security-hardening-notes)

---

## What RecruitIQ Does

**For HR Administrators**
- Approve or reject employee registration requests, assigning department, designation, gross salary, and joining date
- Run monthly payroll for the entire workforce in one click — the engine pro-rates the first month automatically based on the joining date
- Approve and release individual payslips through a four-stage workflow (Generated → Approved → Released → Employee-visible)
- Override attendance records for any employee on any date, including bulk corrections
- Declare company-wide holidays; all active employees are automatically marked and their salary is not deducted
- Manage leave requests — approve or reject with an optional remark sent to the employee
- Configure global payroll parameters: overtime multiplier, PF %, income tax %, maximum free leaves per month, and shift timings
- Edit timings, daily target hours, or declare single-day holidays for any specific calendar date using the interactive **Working Calendar** dashboard
- Recalculate employee attendance statuses (PRESENT, HALF_DAY, ABSENT), overtime, and undertime automatically when daily timings are customized or reverted
- View any released payslip as a print-ready A4 document
- Monitor real-time KPIs on the admin dashboard: workforce count, attendance rate, monthly payroll outlay, pending approvals

**For Employees**
- Self-register; access is granted only after admin approval
- Check in and check out from the dashboard; the system calculates work hours, overtime, and undertime automatically
- View a monthly attendance calendar with status badges, check-in/check-out times, and a payslip release marker on the day salary was disbursed
- Apply for leave (Sick, Casual, Earned, Unpaid, Other) and track approval status
- Access released payslips, view the full A4 slip in-browser, and print or download it
- Keep personal profile up to date: contact number, address, emergency contact, and bank account details
- Receive in-app notifications for salary releases and leave decisions

---

## Feature Set

### AI Agents (RecruitIQ AI)

| Agent | Capability |
|---|---|
| **Hiring Agent** | Create job postings, upload resumes (PDF), AI parses & extracts candidate profiles, scores/ranks against the JD with strengths/weaknesses/recommendation |
| **Interview Agent** | Generates an adaptive 5-question interview set per candidate, public token-based interview link (no login required), live AI scoring of each answer, AI-generated final report with recommendation |
| **Hire-to-Onboard Bridge** | One click converts a candidate into an active employee account (User + Employee), issues a temporary password, and emails onboarding credentials |
| **Assistant Agent (Onboarding + HR Support, unified)** | Floating chat widget grounded in the employee's own HR data via tool-calling — leave balance, attendance summary, latest payslip, company policy/holidays; persona adapts to "onboarding" (first 14 days) vs. "support" (steady-state) |
| **Workforce Analytics Agent** | Aggregates department distribution, headcount growth, attendance & overtime trends, payroll cost trends, and leave utilization, then narrates AI insights (with tone: positive/neutral/warning) for HR leadership on `/admin/analytics` |

### Core HRMS

| Area | Capability |
|---|---|
| **Authentication** | JWT (HS256), HTTP-only cookies, role-based routing, session refresh |
| **Onboarding** | Self-registration → Admin review → Activation with salary assignment |
| **Attendance** | Self check-in/out, overtime/undertime calculation, admin override, auto-absent cron at 22:00 IST |
| **Holidays** | Admin declares holidays; all employees auto-marked HOLIDAY; fully paid (no deduction) |
| **Working Calendar** | Admin interactive calendar view, date-specific shift timings/overrides, custom holiday declaration with automatic propagation & revert logic |
| **Leave Management** | Apply, admin review, approve/reject with remarks, configurable free-leave allowance |
| **Payroll Engine** | Pro-rated first month, HRA per employee, overtime pay, half-day deductions (0.5x daily rate), leave/undertime deductions, PF, TDS |
| **Payroll Workflow** | GENERATED → APPROVED → RELEASED state machine; bulk approve & release |
| **Payslips** | A4-formatted in-browser payslip with print/download; admin can view any employee's slip |
| **Notifications** | In-app bell with unread count, mark-read, time-ago; salary release and leave notifications |
| **Email Alerts** | Nodemailer integration for payslip release and welcome emails |
| **Profile** | Employee self-manages contact, address, emergency contact, bank details |
| **Settings** | Configurable company identity, payroll rates, shift policy, and holiday calendar |
| **Dashboard** | KPI cards, attendance breakdown charts (Recharts), recent registrations feed |
| **Responsive UI** | Fully responsive across mobile, tablet, and desktop |
| **Sidebar** | Collapsible with state persisted in `localStorage` across page refreshes |

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.x |
| UI Primitives | Radix UI | various |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Server State | TanStack Query | 5.x |
| Charts | Recharts | 3.x |
| Icons | Lucide React | 1.x |
| Database | MongoDB Atlas via Mongoose | 9.x |
| Authentication | jsonwebtoken (HS256) | 9.x |
| Password Hashing | bcryptjs | 3.x |
| Email | Nodemailer | 8.x |
| File Storage | Cloudinary | 2.x |
| Client State | Zustand | 5.x |
| Date Utilities | date-fns | 4.x |
| Runtime | Node.js | 20.x+ |

---

## Architecture

RecruitIQ enforces a strict **three-tier layered architecture** to ensure clean separation of concerns and prevent business logic from leaking into the wrong layer.

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│          React Server & Client Components (src/app/)         │
│   – Renders UI, captures user interactions, calls APIs       │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTP  (fetch / Server Actions)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API / Route Layer                       │
│           Next.js Route Handlers  (src/app/api/)             │
│   – Validates session, parses input, delegates to service    │
└──────────────────────────┬──────────────────────────────────┘
                           │  Internal TypeScript call
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
│            Feature Modules  (src/modules/*/service.ts)       │
│   – All business logic, calculations, state transitions      │
└──────────────────────────┬──────────────────────────────────┘
                           │  Internal TypeScript call
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Repository Layer                         │
│               Data Access  (src/repositories/)               │
│   – Mongoose queries only; always returns .lean() objects    │
└──────────────────────────┬──────────────────────────────────┘
                           │  Mongoose / MongoDB Driver
                           ▼
                    MongoDB Atlas Cluster
```

### Non-Negotiable Architecture Rules

1. **No business logic in UI components** — components only render and capture events.
2. **No database calls in route handlers** — handlers call service methods only.
3. **No direct DB calls from the frontend** — all data flows through the API layer.
4. **Repositories are the only Mongoose consumers** — nothing else touches models directly.
5. **All Zod schemas live in `src/validations/`** — shared between client and server.
6. **All TypeScript types live in `src/types/`** — never redeclare interfaces inline.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx              # Login page
│   │   └── register/page.tsx           # Employee self-registration
│   ├── admin/
│   │   ├── layout.tsx                  # Auth guard: ADMIN only
│   │   ├── dashboard/page.tsx          # KPI overview + charts
│   │   ├── employees/page.tsx          # Workforce table + onboarding pipeline
│   │   ├── attendance/page.tsx         # Admin attendance override form
│   │   ├── leaves/page.tsx             # Leave request review queue
│   │   ├── payroll/page.tsx            # Payroll control panel
│   │   ├── payroll/[id]/page.tsx       # Single payslip view (admin)
│   │   └── settings/page.tsx           # Company settings + holiday manager
│   ├── employee/
│   │   ├── layout.tsx                  # Auth guard: EMPLOYEE only
│   │   ├── dashboard/page.tsx          # Clock widget + monthly stats
│   │   ├── profile/page.tsx            # Contact, bank, emergency details
│   │   ├── attendance/page.tsx         # Monthly calendar + log table
│   │   ├── leaves/page.tsx             # Apply for leave + history
│   │   ├── payroll/page.tsx            # Payslip archive list
│   │   └── payroll/[id]/page.tsx       # A4 payslip detail + print
│   ├── api/
│   │   ├── auth/login/                 # POST – authenticate user
│   │   ├── auth/logout/                # POST – clear session cookie
│   │   ├── auth/register/              # POST – create pending employee
│   │   ├── employees/                  # GET – list active employees
│   │   ├── employees/[id]/             # PATCH – update HRA settings
│   │   ├── employees/onboarding/       # GET / POST – approve or reject
│   │   ├── employees/profile/          # GET / PUT – self-profile update
│   │   ├── attendance/check-in/        # POST – record check-in
│   │   ├── attendance/check-out/       # POST – record check-out
│   │   ├── attendance/override/        # POST – admin override
│   │   ├── leave-requests/             # GET / POST – apply / list
│   │   ├── leave-requests/review/      # POST – admin approve / reject
│   │   ├── payroll/                    # GET / POST – list / generate
│   │   ├── payroll/actions/            # POST – approve / release
│   │   ├── holidays/                   # GET / POST / DELETE – holiday manager
│   │   ├── notifications/              # GET / PUT – list / mark read
│   │   ├── settings/                   # GET / PUT – company config
│   │   └── cron/auto-absent/           # GET / POST – nightly absent marker
│   └── page.tsx                        # Root redirect
│
├── modules/
│   ├── auth/service.ts                 # Login, register, token issue
│   ├── employee/service.ts             # Profile CRUD, onboarding logic
│   ├── attendance/service.ts           # Check-in/out, override, monthly ledger
│   ├── calendar/service.ts             # Calendar grids, overrides, holiday propagation
│   ├── payroll/service.ts              # Payroll generation, approve, release
│   ├── dashboard/service.ts            # KPI aggregation for both roles
│   ├── notification/service.ts         # Create, list, mark-read
│   └── settings/service.ts             # Company settings read/write
│
├── repositories/
│   ├── attendance.repository.ts        # Attendance CRUD + aggregations
│   ├── company.repository.ts           # Company settings + holiday management
│   ├── custom-day.repository.ts        # CustomDay CRUD operations
│   ├── employee.repository.ts          # Employee CRUD + findActiveEmployees
│   ├── notification.repository.ts      # Notification CRUD
│   ├── payroll.repository.ts           # Payroll CRUD + findByIdPopulated
│   └── user.repository.ts              # User account CRUD
│
├── lib/
│   ├── db.ts                           # MongoDB connection with singleton guard
│   ├── jwt.ts                          # signAccessToken, verifyAccessToken
│   └── models/                         # Mongoose schema definitions
│       ├── Attendance.ts
│       ├── AuditLog.ts
│       ├── Company.ts                  # Includes holidays[] array
│       ├── CustomDay.ts                # Date-specific office timings & holidays
│       ├── Employee.ts                 # Includes hraEnabled, hraAmount
│       ├── LeaveRequest.ts
│       ├── Notification.ts
│       ├── Payroll.ts                  # IEarnings includes hraAmount
│       └── User.ts
│
├── components/
│   ├── shared/
│   │   ├── admin-shell.tsx             # Admin layout wrapper
│   │   ├── employee-shell.tsx          # Employee layout wrapper
│   │   ├── sidebar.tsx                 # Collapsible nav + sign-out (localStorage state)
│   │   ├── header.tsx                  # Sticky header + notification bell + logout
│   │   ├── clock-widget.tsx            # Live clock + check-in/out controls
│   │   ├── dashboard-charts.tsx        # Recharts attendance pie + payroll bar
│   │   └── bank-details-banner.tsx     # Reminder banner until bank details filled
│   └── ui/                             # shadcn/ui primitives (Button, Dialog, etc.)
│
├── validations/
│   ├── auth.ts                         # loginSchema, registerSchema
│   └── ...                             # Other Zod schemas
│
├── services/
│   └── email.ts                        # Nodemailer wrappers
│
├── hooks/                              # Custom React hooks
├── store/                              # Zustand client state slices
├── types/                              # Shared TypeScript interfaces
├── constants/                          # App-wide enums and constants
└── utils/                              # Pure utility functions
```

---

## Role System & Access Control

### ADMIN
- Email must be listed in the `ADMIN_EMAILS` environment variable (comma-separated)
- Cannot self-register via the registration page — must be set up directly in the environment
- Full system access: workforce management, payroll operations, attendance overrides, settings, holiday declaration
- Session cookie role value: `"ADMIN"`

### EMPLOYEE
- Self-registers through the public `/register` page
- Starts with `employmentStatus: "PENDING"` — no dashboard access until admin approval
- Upon approval: receives an employee ID, department, designation, and gross salary
- Restricted entirely to their own data; cannot access any other employee's records
- Session cookie role value: `"EMPLOYEE"`

### Route Guards
Both `/admin/**` and `/employee/**` route groups have a `layout.tsx` that verifies the JWT cookie server-side before rendering any page. Invalid or missing tokens redirect to `/login` immediately.

---

## Core Engines Explained

### Payroll Calculation

The payroll engine runs per-employee and handles the following in sequence:

**1. Pro-rate for first month**
If the employee's `joiningDate` falls in the current payroll month, the gross salary is proportionally scaled:

```
Remaining Days  =  Total Days in Month  −  Joining Day  +  1
Pro-rated Gross =  Base Gross  ×  (Remaining Days / Total Days in Month)
Daily Rate      =  Pro-rated Gross / Remaining Days
```

**2. HRA (House Rent Allowance)**
If enabled per-employee, HRA is pro-rated by the same ratio and added to gross earnings. Displayed as a separate line on the payslip only when the value is greater than zero.

**3. Overtime Pay**
```
Overtime Pay  =  Overtime Hours  ×  Hourly Rate  ×  Overtime Multiplier
Hourly Rate   =  Daily Rate / Total Daily Hours (from company settings)
```

**4. Deductions**

| Deduction | Formula |
|---|---|
| Leave deduction | `(Absent Days + max(0, Leave Days − Free Allowance) + Half-Day Count * 0.5) × Daily Rate` |
| Undertime deduction | `Undertime Hours × Hourly Rate` |
| Provident Fund (PF) | `Gross Earned × PF Percentage / 100` |
| Income Tax (TDS) | `Gross Earned × Tax Percentage / 100` |
| Professional Tax | Fixed ₹200 |

**5. Net Salary**
```
Net Salary  =  Gross Earned  −  Total Deductions
```

**6. State machine**
Payroll records transition through four states. Employees only see their slip once it reaches `RELEASED`.

```
GENERATED  →  APPROVED  →  RELEASED
   ↑
(Re-generate overwrites GENERATED records; APPROVED/RELEASED records are protected)
```

---

### Attendance Engine

```
Employee checks in          →  Record created: status=PRESENT, checkIn=now
Employee checks out         →  workHours, overtimeHours, undertimeHours computed;
                               Status resolved dynamically based on daily target hours:
                               - PRESENT (>= 100% target hours)
                               - HALF_DAY (>= 50% and < 100% target hours)
                               - ABSENT (< 50% target hours)
No check-in by 22:00 IST   →  Cron job marks status=ABSENT (auto-absent)
Admin override              →  Any status, any date, with check-in/out times
Holiday declared by admin   →  All active employees: status=HOLIDAY (fully paid)
```

Attendance statuses: `PRESENT` | `ABSENT` | `LEAVE` | `HALF_DAY` | `HOLIDAY`

---

### Holiday System

When an admin declares a holiday from the Settings page:

1. The holiday is stored in the `Company.holidays[]` array with a name and date.
2. An attendance record with `status: "HOLIDAY"` is immediately upserted for **every active employee** on that date.
3. Because the payroll deduction formula only counts `ABSENT` and chargeable `LEAVE` days, `HOLIDAY` days carry **zero deduction** — employees receive full pay.
4. The employee's attendance calendar displays the day with a `HOLIDAY` badge.
5. Holidays can be removed from the list; existing attendance records remain and can be corrected via the admin override tool if needed.

---

### Auto-Absent Cron

A scheduled job at **22:00 IST (16:30 UTC)** runs daily via Vercel Cron:

```json
{ "crons": [{ "path": "/api/cron/auto-absent", "schedule": "30 16 * * *" }] }
```

- Fetches all `ACTIVE` employees
- Checks whether an attendance record exists for today
- If no record: creates one with `status: "ABSENT"`
- Secured with `Authorization: Bearer <CRON_SECRET>` header

---

## API Reference

All endpoints return `Response.json()` (Next.js 16 pattern). Authentication is verified by reading and decoding the `recruitiq_access` HTTP-only cookie on every request.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate user, issue cookie |
| POST | `/api/auth/logout` | Any | Clear session cookie |
| POST | `/api/auth/register` | Public | Submit employee registration |
| GET | `/api/employees` | Admin | List active employees (search, filter) |
| PATCH | `/api/employees/[id]` | Admin | Update HRA settings for one employee |
| GET | `/api/employees/onboarding` | Admin | List pending registrations |
| POST | `/api/employees/onboarding` | Admin | Approve or reject a registration |
| GET | `/api/employees/profile` | Employee | Get own profile |
| PUT | `/api/employees/profile` | Employee | Update own contact/bank details |
| POST | `/api/attendance/check-in` | Employee | Record check-in |
| POST | `/api/attendance/check-out` | Employee | Record check-out |
| POST | `/api/attendance/override` | Admin | Override attendance for any employee |
| GET | `/api/leave-requests` | Both | List leave requests |
| POST | `/api/leave-requests` | Employee | Submit a leave request |
| POST | `/api/leave-requests/review` | Admin | Approve or reject a leave request |
| GET | `/api/payroll` | Admin | List payroll records for a period |
| POST | `/api/payroll` | Admin | Generate payroll for all employees |
| POST | `/api/payroll/actions` | Admin | Approve or release a payroll record |
| GET | `/api/calendar/custom-days` | Admin | Retrieve all overrides and holidays for a given month and year |
| POST | `/api/calendar/custom-days` | Admin | Create, update (SET), or revert (REVERT) custom daily shift/holiday settings |
| GET | `/api/holidays` | Admin | List company holidays |
| POST | `/api/holidays` | Admin | Declare a holiday (marks all employees) |
| DELETE | `/api/holidays` | Admin | Remove a holiday from the list |
| GET | `/api/notifications` | Both | List notifications with unread count |
| PUT | `/api/notifications` | Both | Mark one or all notifications as read |
| GET | `/api/settings` | Admin | Read company configuration |
| PUT | `/api/settings` | Admin | Update company configuration |
| GET/POST | `/api/cron/auto-absent` | Cron | Mark absent employees (CRON_SECRET) |

---

## Environment Variables

Create a `.env.local` file in the project root. **Never commit this file.**

```ini
# ── Database ──────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/recruitiq

# ── JWT Signing Keys (generate with: openssl rand -hex 64) ────────────────────
JWT_ACCESS_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<64-character-random-string>

# ── Admin Access Control ──────────────────────────────────────────────────────
# Comma-separated email addresses. Only these addresses can hold ADMIN role.
ADMIN_EMAILS=admin@yourcompany.com,hr@yourcompany.com

# ── OpenAI (powers all five AI agents: Hiring, Interview, Onboarding, ────────
# ── HR Support, Workforce Analytics) ──────────────────────────────────────────
OPENAI_API_KEY=sk-...
# Optional — defaults to gpt-4o-mini if unset
OPENAI_MODEL=gpt-4o-mini

# ── SMTP Email (Nodemailer) ───────────────────────────────────────────────────
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=RecruitIQ <noreply@yourcompany.com>

# ── Application ───────────────────────────────────────────────────────────────
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Cloudinary (profile picture uploads) ─────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Cron Job Security ─────────────────────────────────────────────────────────
# Generate with: openssl rand -hex 32
# Set the same value in Vercel environment variables.
CRON_SECRET=your_cron_secret_key
```

---

## Getting Started

### Prerequisites

- **Node.js** v20.x or later
- **pnpm** (recommended) or npm / yarn
- A **MongoDB Atlas** cluster (free tier works for development)
- A **Cloudinary** account (free tier works for profile pictures)

### 1. Clone and Install

```bash
git clone https://github.com/your-org/recruitiq.git
cd recruitiq
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values as described in the [Environment Variables](#environment-variables) section.

### 3. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. First-Time Setup

1. Open `/register` and create an employee account using the email address listed in `ADMIN_EMAILS`. This account will automatically receive the `ADMIN` role.
2. Log in at `/login` — you will be redirected to the admin dashboard.
3. Go to **Settings** and create your company profile, configure payroll rates, and set shift timings.
4. Invite employees to register at `/register`. Their accounts will appear in the **Workforce → Onboarding Pipeline** tab for your approval.

### 5. Production Build

```bash
pnpm build
pnpm start
```

---

## Deployment

RecruitIQ is designed for **zero-configuration deployment on Vercel**.

### Vercel

1. Push the repository to GitHub / GitLab / Bitbucket.
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Add all environment variables from `.env.local` in the Vercel project settings.
4. Deploy. Vercel automatically detects Next.js and configures the build.

The `vercel.json` file in the repository root configures the nightly auto-absent cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-absent",
      "schedule": "30 16 * * *"
    }
  ]
}
```

`30 16 * * *` is **16:30 UTC = 22:00 IST**. Adjust the schedule if your workforce is in a different timezone.

> Vercel Cron requires a Pro plan or higher. On the free Hobby plan, trigger the endpoint manually or use an external cron service (e.g., cron-job.org) pointing to `POST /api/cron/auto-absent` with `Authorization: Bearer <CRON_SECRET>`.

### Other Hosts (Railway, Render, Fly.io)

Any platform that supports Node.js 20+ and environment variables will work. Set `NODE_ENV=production` and ensure all environment variables are configured. For the cron job, use the platform's native scheduler or an external service.

---

## Security Hardening Notes

### Authentication
- JWT tokens are stored exclusively in **HTTP-only, Secure, SameSite=Strict cookies** — they are never accessible to JavaScript on the client, eliminating XSS-based token theft.
- Token verification happens **server-side** on every protected route and API handler.
- The `ADMIN_EMAILS` list is a server-side environment variable — it never reaches the browser.

### Data Access
- All MongoDB queries use **`.lean()`** — Mongoose documents are returned as plain JavaScript objects, which is faster and prevents accidental document mutation.
- Employees can only query their own records — every service method verifies the session's `userId` matches the requested resource.
- Input is validated with **Zod schemas** at every API boundary before touching the database.

### Secrets & Configuration
- No secrets are embedded in the source code.
- `CRON_SECRET` protects the auto-absent endpoint from being triggered by arbitrary external requests.
- Cloudinary API keys are server-side only (`CLOUDINARY_API_KEY` is not prefixed with `NEXT_PUBLIC_`).

### Email
- Outbound email calls (`emailService.sendMail()`) are dispatched in **fire-and-forget async blocks** using `.catch()` for error capture. They do not block the HTTP response cycle, preventing email provider timeouts from affecting user-facing API latency.

---

## License

This project is proprietary software. All rights reserved.

---

*Built with Next.js 16 · TypeScript · MongoDB · Tailwind CSS*
