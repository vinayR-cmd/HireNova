# RecruitIQ — Agentic HRMS, Payroll & AI Hiring Platform

RecruitIQ is a production-grade, full-stack **Human Resource Management System** that has grown into a complete **agentic talent platform**. It is built entirely on **Next.js 16** — there is no separate backend server; every API route, business rule, and database query lives inside the same Next.js application and ships as a single deployable unit.

At its core RecruitIQ still does what an HRMS should: onboarding, attendance, leave, payroll, holidays, notifications, and self-service profiles for both **Admins** and **Employees**. Layered on top of that core is **RecruitIQ AI** — five purpose-built OpenAI-powered agents that automate the entire hire → interview → onboard → support → analyze lifecycle:

- A **Hiring Agent** that reads resumes with a genuine retrieval-augmented-generation (RAG) pipeline and ranks candidates against a job description with cited evidence
- An **Interview Agent** that conducts a live, *adaptive* AI interview — generating each question in real time based on how the candidate is actually performing — and produces a structured hiring-panel report
- A **Hire-to-Onboard Bridge** that converts a vetted candidate into an active employee account in one click
- A unified **Assistant Agent** (Onboarding + HR Support) — a floating chat widget that answers an employee's leave/attendance/payroll/policy questions by calling real internal tools, never by guessing
- A **Workforce Analytics Agent** that turns raw HR aggregations into AI-narrated insights for leadership

A public-facing **careers job board** and **token-based candidate interview links** mean candidates never need an account — they apply, get scored, and (if invited) interview entirely outside the authenticated portal.

---

## Table of Contents

1. [What RecruitIQ Does](#what-recruitiq-does)
2. [Feature Set](#feature-set)
3. [The AI Agent Platform — How Each Agent Actually Works](#the-ai-agent-platform--how-each-agent-actually-works)
4. [Technology Stack](#technology-stack)
5. [Architecture](#architecture)
6. [Project Structure](#project-structure)
7. [Role System & Access Control](#role-system--access-control)
8. [Core HRMS Engines Explained](#core-hrms-engines-explained)
9. [API Reference](#api-reference)
10. [Environment Variables](#environment-variables)
11. [Getting Started](#getting-started)
12. [Deployment](#deployment)
13. [Security Hardening Notes](#security-hardening-notes)

---

## What RecruitIQ Does

**For HR Administrators**
- Run the entire hiring funnel from a single **Hiring Agent** dashboard: post jobs, watch resumes get parsed/scored automatically, review AI-cited evidence for every required skill, shortlist, schedule AI interviews, read AI-written interview reports, and hire — all without leaving the portal
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
- Monitor real-time KPIs on the admin dashboard, plus a dedicated **Workforce Analytics** page with AI-narrated insights about headcount, attendance, payroll, and leave trends
- Chat with the HR Assistant (in admin/policy mode) about working hours, holidays, and leave rules

**For Employees**
- Self-register; access is granted only after admin approval (or arrive pre-activated via the Hiring Agent's hire-to-onboard bridge)
- Check in and check out from the dashboard; the system calculates work hours, overtime, and undertime automatically
- View a monthly attendance calendar with status badges, check-in/check-out times, and a payslip release marker on the day salary was disbursed
- Apply for leave (Sick, Casual, Earned, Unpaid, Other) and track approval status
- Access released payslips, view the full A4 slip in-browser, and print or download it
- Keep personal profile up to date: contact number, address, emergency contact, and bank account details
- Receive in-app notifications for salary releases, leave decisions, and onboarding welcomes
- Chat with their personal **AI Assistant** — a floating widget that knows their actual leave balance, attendance summary, latest payslip, and company policy, and adapts its persona depending on whether they joined in the last two weeks (warm "onboarding" tone) or have been around longer (steady-state "support" tone)

**For Candidates (no account needed)**
- Browse open roles on the public **careers** job board
- Apply directly with a PDF resume — the Hiring Agent parses it, scores it against the role, and routes it into the funnel within seconds
- If shortlisted and invited, complete a live **AI interview** through a private token link — no login, no app to install, just a conversational Q&A in the browser
- Receive a final score breakdown and recommendation once the interview completes

---

## Feature Set

### AI Agents (RecruitIQ AI)

| Agent | Where it lives | Capability |
|---|---|---|
| **Hiring Agent** | `src/modules/agents/hiring/` | Create/manage job postings; ingest resumes (PDF) through a RAG pipeline (extract → segment → embed → retrieve → score); persist a per-skill "evidence dossier"; auto-classify candidates as `SHORTLISTED` (score ≥ 70) or `SCREENED`; expose a hiring funnel overview (open jobs, applicants, shortlisted, interviewing, hired) |
| **Interview Agent** | `src/modules/agents/interview/` | Generate a fixed-length (6-question) **live adaptive interview** — each question is crafted in real time from the full transcript-so-far (questions, answers, scores, feedback), escalating or pivoting based on how the candidate is actually doing; scores every answer 0-10 immediately; synthesizes a final 0-100-scale report (technical / communication / confidence / problem-solving / overall) with a hire recommendation, summary, strengths and weaknesses |
| **Hire-to-Onboard Bridge** | `HiringAgentService.hireCandidate()` | One click converts a `HIRED`-track candidate into a live `User` + `Employee` (inside a Mongo transaction), assigns the next sequential employee ID, generates a temporary password, fires an in-app "Welcome to the team!" notification, and emails onboarding credentials |
| **Assistant Agent** (Onboarding + HR Support, unified) | `src/modules/agents/assistant/` | Floating chat widget grounded in the *caller's own* HR data via OpenAI function/tool-calling — `getLeaveSummary`, `getAttendanceSummary`, `getLatestPayslip`, `getCompanyPolicy`. Persona auto-adapts: employees who joined within the last 14 days get a warmer "onboarding" framing, everyone else gets steady-state "support," and admins (who have no `Employee` profile) get a policy-only persona |
| **Workforce Analytics Agent** | `src/modules/agents/analytics/` | Deterministically aggregates department distribution, headcount growth, attendance & overtime trends, payroll cost trends, and leave utilization over a rolling 6-month window, then asks the model to turn that numeric snapshot into narrative insights tagged `POSITIVE` / `NEUTRAL` / `WARNING` for HR leadership, rendered on `/admin/analytics` |

### Public-Facing Surfaces (no authentication)

| Surface | Route | What it does |
|---|---|---|
| **Careers job board** | `/careers`, `/careers/[id]` | Lists every `OPEN` job posting; lets a candidate apply with name, email, phone, and a PDF resume — runs through the exact same Hiring Agent pipeline as the admin's manual intake |
| **Public AI interview** | `/interview/[token]` | Token-gated, no-login candidate experience: begin the interview, answer one adaptively-generated question at a time, and view the final AI report once complete |

### Core HRMS

| Area | Capability |
|---|---|
| **Authentication** | JWT (HS256) access + refresh tokens, HTTP-only cookies (`recruitiq_access` / `recruitiq_refresh`), role-based routing, silent session refresh via `apiFetch()` |
| **Onboarding / Approval** | Self-registration → `PENDING` → Admin review (`ApprovalService`) → activation with employee ID, department, designation & salary assignment — *or* pre-activated arrival via the Hiring Agent's hire-to-onboard bridge |
| **Attendance** | Self check-in/out, automatic overtime/undertime calculation, admin override for any date, nightly auto-absent cron at 22:00 IST |
| **Holidays** | Admin declares holidays; all active employees are auto-marked `HOLIDAY`; fully paid (zero deduction) |
| **Working Calendar** | Admin interactive calendar, date-specific shift-timing overrides, custom holiday declaration with automatic propagation & revert logic, attendance recalculation on change |
| **Leave Management** | Apply (Sick/Casual/Earned/Unpaid/Other), admin review queue, approve/reject with remarks, configurable monthly free-leave allowance |
| **Payroll Engine** | Pro-rated first month, per-employee HRA, overtime pay, half-day deductions (0.5× daily rate), leave/undertime deductions, PF, TDS, fixed professional tax |
| **Payroll Workflow** | `DRAFT → GENERATED → APPROVED → RELEASED` state machine; bulk approve & release; employees only ever see `RELEASED` slips |
| **Payslips** | A4-formatted in-browser payslip rendered with `@react-pdf/renderer`, print/download, auto-print trigger; admin can view any employee's slip |
| **Notifications** | In-app bell with unread count, mark-one/mark-all-read, time-ago formatting; salary release, leave decision, and onboarding-welcome notifications |
| **Email Alerts** | Nodemailer (SMTP) integration for payslip release and onboarding-welcome credential emails, dispatched fire-and-forget |
| **Profile** | Employee self-manages contact, address, emergency contact, and bank account details; bank-details reminder banner until completed |
| **Settings** | Configurable company identity, payroll rates (PF %, tax %, overtime multiplier), shift policy, and holiday calendar |
| **Dashboard** | Role-aware KPI cards, attendance-share donut + payroll-trajectory bar charts (Recharts, custom dark-theme palette), recent registrations feed, AI Assistant widget |
| **Audit Log** | Fire-and-forget `auditRepository.log()` calls on every consequential admin action (job posting created, candidate hired, interview scheduled, etc.) |
| **Responsive UI** | Fully responsive across mobile, tablet, and desktop; dark-theme (`#08090C` / `#12141A`) with `oklch()` brand accents |
| **Sidebar** | Collapsible navigation with state persisted in `localStorage` across page refreshes |

---

## The AI Agent Platform — How Each Agent Actually Works

All five agents share two thin wrappers around the OpenAI SDK in `src/modules/agents/shared/ai-client.ts`:

- **`chatJSON<T>({ system, user, temperature })`** — forces a `response_format: { type: "json_object" }` completion and parses the result into a typed object `T`. Used everywhere structured extraction or scoring is needed (resume segmentation, evidence scoring, adaptive question generation, answer scoring, report synthesis, analytics insights).
- **`chatText({ system, messages, temperature })`** — a plain conversational completion returning text.
- **`chatWithTools({ system, messages, tools, temperature })`** — runs a full OpenAI function-calling loop: the model can request one or more registered tools, the server executes them against real repositories, feeds the results back, and the loop continues until the model produces a final natural-language reply. This is what powers the Assistant Agent.

A second shared module, `src/modules/agents/shared/embeddings.ts`, wraps the OpenAI embeddings endpoint (`text-embedding-3-small` by default) with `embedTexts()` (batch embedding) and `cosineSimilarity()` / `retrieveTopMatches()` (top-K ranked retrieval above a minimum-similarity threshold) — the retrieval half of the Hiring Agent's RAG pipeline.

The default chat model is `gpt-4o-mini` (overridable via `OPENAI_MODEL`); both the chat client and the embedding client lazily instantiate a single shared `OpenAI` instance and throw a clear error if `OPENAI_API_KEY` is missing.

### 1. Hiring Agent — RAG Resume Parsing & Scoring (`src/modules/agents/hiring/`)

This is a genuine **retrieval-augmented generation pipeline**, not a single free-form "read this resume and tell me what you think" prompt. `HiringAgentService.submitCandidate()` runs five distinct stages:

1. **EXTRACT** — `extractTextFromPdf()` (`src/lib/pdf.ts`, built on `pdf-parse`) pulls raw text out of the uploaded PDF; the file itself is simultaneously uploaded to Cloudinary (`uploadBuffer()`, folder `recruitiq/resumes`, raw resource type) so the original document remains viewable
2. **SEGMENT** — the raw resume text is sent to `chatJSON` with `RESUME_SEGMENTATION_SYSTEM_PROMPT`, which chunks it into labeled sections (e.g. "Work Experience", "Technical Skills", "Projects") **and** extracts structured profile data (`skills[]`, `education[]`, `experience[]`, `totalExperienceYears`) in the same pass
3. **EMBED** — every resume section *and* every required skill from the job posting is embedded into the same vector space via `embedTexts()`
4. **RETRIEVE** — for each required skill, `retrieveTopMatches()` runs a cosine-similarity search over the section embeddings (top-2 matches, minimum similarity 0.25) and assembles a per-skill **evidence dossier** of concrete, citable resume excerpts with their similarity scores
5. **GENERATE** — that evidence dossier (never the raw resume text) is handed to `chatJSON` with `EVIDENCE_SCORING_SYSTEM_PROMPT`, so the model's verdict — `matchScore` (0-100), `recommendation` (`STRONG_HIRE`/`HIRE`/`CONSIDER`/`REJECT`), `strengths[]`, `weaknesses[]`, `aiSummary` — is *grounded*: every claim traces back to a retrieved excerpt and a similarity number rather than free-associating over raw text

The candidate is persisted with the full `parsedData`, `skillEvidence[]` dossier, score, recommendation, and is automatically routed: `matchScore >= 70` → `SHORTLISTED`, otherwise → `SCREENED`. The admin candidate-detail page (`/admin/hiring/candidates/[id]`) surfaces exactly which excerpt backs (or fails to back) each required skill.

Other `HiringAgentService` methods: `createJobPosting`, `listJobPostings` (enriches each posting with live `applicantCount`/`shortlistedCount`/`hiredCount` via `candidateRepository.count()`), `getJobPosting`, `updateJobPostingStatus`, `listCandidates`, `getCandidate`, `updateCandidateStatus`, `getFunnelOverview` (powers the `/api/agents/analytics/hiring-overview` KPI summary).

### 2. Interview Agent — Live Adaptive Interviewing (`src/modules/agents/interview/`)

Most "AI interview" tools hand a candidate a fixed, pre-generated list of questions. RecruitIQ's Interview Agent does something fundamentally different: **it crafts ONE question at a time, live, in reaction to how the conversation is actually going.**

- `TOTAL_QUESTIONS = 6` — kept modest so the demo flow stays tight while still ranging across categories
- `startInterview()` generates *only the opening question* up front (via `generateAdaptiveQuestion()` with an empty transcript), creates the `Interview` document with a unique public `token` (`randomBytes(24).toString("base64url")`), and flips the candidate's status to `INTERVIEWING`
- `submitAnswer()` is the heart of the agent. Each turn:
  1. Scores the just-submitted answer in real time via `chatJSON` + `ANSWER_SCORING_SYSTEM_PROMPT` (0-10 scale, with terse interviewer-style feedback)
  2. If more questions remain, calls `generateAdaptiveQuestion()` again — this time with the *entire* transcript including the score that was just awarded — so the model can decide the next question's category (`TECHNICAL`/`BEHAVIORAL`/`PROBLEM_SOLVING`) and difficulty (`EASY`/`MEDIUM`/`HARD`) itself:
     - **Strong recent scores (7-10)** → escalate: go harder on a strength, or open a new demanding required-skill area
     - **Weak recent scores (0-4)** → pivot to a different category or a more concrete angle, giving the candidate a fair shot to show a different strength rather than hammering the same weak spot
     - **Mixed/middling** → fill a gap — probe an as-yet-untested required skill or category
     - **Vague/hand-wavy answers** → the model is explicitly encouraged to write a direct follow-up that challenges the specific claim
     - **Final question** → always a forward-looking behavioral wrap-up (first-90-days, growth interests) so the conversation ends on a human note
  3. Once the 6th answer is scored, synthesizes a final structured report via `chatJSON` + `REPORT_GENERATION_SYSTEM_PROMPT` — explicitly **rescaling** the 0-10 per-answer notes into 0-100 dimension scores (`technicalScore`, `communicationScore`, `confidenceScore`, `problemSolvingScore`, `overallScore`), plus a `recommendation`, executive `summary`, and `strengths[]`/`weaknesses[]` — and marks the interview `COMPLETED` and the candidate `INTERVIEWED`

`getPublicInterview(token)` is the read model behind the public page: it **never exposes scores or feedback for unanswered questions**, returning only the live current question, progress (`currentIndex` / `totalQuestions`), and — once `COMPLETED` — the full report. `beginInterview(token)` flips `NOT_STARTED → IN_PROGRESS` and stamps `startedAt`.

Generic questions ("Tell me about yourself", "What's your biggest weakness") are explicitly banned in the system prompt — every question must be specific to the exact role and grounded in the candidate's actual resume and skills.

### 3. Hire-to-Onboard Bridge

`HiringAgentService.hireCandidate(adminUserId, candidateId)` closes the loop on the demo flow without duplicating the existing registration/approval pipeline:

1. Validates the candidate isn't already hired and that no `User` already exists for their email
2. Generates a temporary password (`randomBytes(6).toString("base64url")`) and bcrypt-hashes it (cost factor 12)
3. Inside a **MongoDB transaction**, creates a `User` (`role: EMPLOYEE`, `status: ACTIVE`) and an `Employee` record — pre-activated, with department/designation/employment type copied straight from the job posting, `joiningDate: now`
4. Updates the candidate to `HIRED` and links `hiredEmployeeId`
5. Fires an audit log entry, an in-app `ONBOARDING_WELCOME` notification, and an onboarding-welcome email containing the employee ID and temporary password — handing off seamlessly to the **Onboarding Assistant** the moment the new hire logs in

### 4. Assistant Agent — Unified Onboarding + HR Support (`src/modules/agents/assistant/`)

Rather than building two separate chatbots that would duplicate all the tool-calling plumbing, RecruitIQ implements **one** `AssistantAgentService` whose persona adapts to context:

- `resolveMode(joiningDate)` — anyone within `ONBOARDING_WINDOW_DAYS = 14` of their join date gets the warmer **onboarding** system prompt; everyone else gets the steady-state **support** prompt; authenticated admins (who authenticate via `ADMIN_EMAILS` and have no `Employee` record) get a **policy-only admin** persona
- The chat loop runs through `chatWithTools()`, giving the model a registry of real internal tools (`src/modules/agents/assistant/tools.ts`):
  - **`getLeaveSummary`** — derives the employee's annual leave allowance (`Company.maxLeavesPerMonth × 12`), approved days taken this year, remaining balance, and the 5 most recent leave requests
  - **`getAttendanceSummary(month?, year?)`** — present/absent/leave/half-day counts, holidays, overtime/undertime/total work hours for any month (defaults to current)
  - **`getLatestPayslip`** — the most recently `RELEASED` payslip (gross, net, period, release date) — *only* released slips are ever surfaced
  - **`getCompanyPolicy`** — working hours, working days, weekly off, leave allowance, and the next 5 upcoming holidays (the only tool also offered to admins, since it needs no personal `Employee` profile)
- Every tool is bound to the resolved employee's ID at request time — **the model can never reach across to another person's HR data**, by construction, not by prompt instruction alone
- Shared guardrails (`SHARED_GUARDRAILS`) instruct the model to always call a tool before answering data questions, never fabricate numbers, stay concise and warm, and politely redirect off-topic (non-HR) questions
- Surfaced via `src/components/shared/ai-assistant-widget.tsx` — a floating chat bubble (mounted in both employee and admin shells) with mode-aware suggested-prompt chips (`ASSISTANT_SUGGESTED_PROMPTS`)

### 5. Workforce Analytics Agent (`src/modules/agents/analytics/`)

`AnalyticsAgentService.getWorkforceAnalytics()` follows a strict **"numbers are computed deterministically, AI only narrates"** philosophy — the model never invents a statistic:

1. Six parallel MongoDB aggregations over a rolling `TREND_WINDOW_MONTHS = 6` window: department distribution, headcount growth, company-wide monthly attendance trend, payroll trend, leave-type utilization, and total active headcount
2. The resulting numeric snapshot is handed to `chatJSON` with `WORKFORCE_INSIGHTS_SYSTEM_PROMPT`, which returns a short narrative `summary` plus a list of tagged `insights[]` (`title`, `detail`, `tone: POSITIVE | NEUTRAL | WARNING`)
3. Rendered on `/admin/analytics` as KPI tiles (active workforce, average attendance rate, latest payroll net, trend window), an AI Insights panel with tone-colored cards, and four Recharts visualizations: department-distribution donut, headcount-growth bars, attendance-rate/overtime dual-line chart, and a multi-color payroll-cost-trend bar chart — plus a leave-utilization breakdown table

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| Language | TypeScript (strict) | 5.x |
| Runtime | React / React DOM | 19.2.4 |
| Styling | Tailwind CSS v4 + shadcn/ui | 4.x |
| UI Primitives | Radix UI | various |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) | 7.x / 4.x |
| Server State | TanStack Query (+ devtools) | 5.x |
| Client State | Zustand | 5.x |
| Charts | Recharts | 3.x |
| Icons | Lucide React | 1.x |
| Notifications/Toasts | sonner | 2.x |
| Theming | next-themes | 0.4.x |
| Class utilities | clsx, tailwind-merge | — |
| Database | MongoDB Atlas via Mongoose | 9.x |
| Authentication | jsonwebtoken (HS256) | 9.x |
| Password Hashing | bcryptjs | 3.x |
| Email | Nodemailer | 8.x |
| File Storage | Cloudinary | 2.x |
| AI / LLM | OpenAI SDK (`openai`) — chat completions + embeddings | 6.x |
| PDF Text Extraction | pdf-parse | 2.x |
| PDF Generation/Rendering | @react-pdf/renderer | 4.x |
| Date Utilities | date-fns | 4.x |
| Validation | Zod | 4.x |
| Runtime | Node.js | 20.x+ |

---

## Architecture

RecruitIQ enforces a strict **layered architecture** to ensure clean separation of concerns and prevent business logic from leaking into the wrong layer.

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│          React Server & Client Components (src/app/)         │
│   – Renders UI, captures user interactions, calls APIs       │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTP  (fetch / apiFetch)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API / Route Layer                       │
│           Next.js Route Handlers  (src/app/api/)             │
│   – Reads & verifies the JWT cookie, validates input (Zod),  │
│     delegates to a service, returns Response.json()          │
└──────────────────────────┬──────────────────────────────────┘
                           │  Internal TypeScript call
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
│            Feature Modules  (src/modules/*/service.ts)       │
│   – All business logic, calculations, state transitions,     │
│     AI agent orchestration (RAG, tool-calling, adaptive Q&A) │
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

   (Cross-cutting: src/modules/agents/shared/ wraps the OpenAI SDK
    for every agent;  src/lib/{cloudinary,pdf,db,jwt}.ts and
    src/services/email.ts provide shared infrastructure to services)
```

### Non-Negotiable Architecture Rules

1. **No business logic in UI components** — components only render and capture events.
2. **No database calls in route handlers** — handlers call service methods only.
3. **No direct DB calls from the frontend** — all data flows through the API layer.
4. **Repositories are the only Mongoose consumers** — nothing else touches models directly; results are always `.lean()`.
5. **All Zod schemas live in `src/validations/`** — shared between client and server.
6. **All shared TypeScript types live alongside their Mongoose models in `src/lib/models/`** (re-exported via `index.ts`) — interfaces are never redeclared inline.
7. **Services throw plain `Error`s on failure**; route handlers catch them and translate to `Response.json({ error }, { status })`.
8. **Consequential admin actions are audited** via fire-and-forget `auditRepository.log(...).catch(...)` calls that never block the response.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx                  # Login page
│   │   └── register/page.tsx               # Employee self-registration
│   ├── admin/
│   │   ├── layout.tsx                      # Auth guard: ADMIN only
│   │   ├── dashboard/page.tsx              # KPI overview + charts + AI Assistant widget
│   │   ├── employees/page.tsx              # Workforce table + onboarding pipeline
│   │   ├── attendance/page.tsx             # Admin attendance override form
│   │   ├── calendar/page.tsx               # Working Calendar (shift/holiday overrides)
│   │   ├── leaves/page.tsx                 # Leave request review queue
│   │   ├── payroll/page.tsx                # Payroll control panel
│   │   ├── payroll/[id]/page.tsx           # Single payslip view (admin)
│   │   ├── analytics/page.tsx              # Workforce Analytics Agent dashboard
│   │   ├── settings/page.tsx               # Company settings + holiday manager
│   │   └── hiring/                         # Hiring Agent admin surface
│   │       ├── page.tsx                    #   Job postings + funnel KPIs
│   │       ├── jobs/[id]/page.tsx          #   Ranked candidate list for a posting
│   │       ├── candidates/[id]/page.tsx    #   Score breakdown, evidence dossier, AI verdict, hire/interview actions
│   │       └── interviews/[id]/page.tsx    #   Live interview status + final AI report (admin view)
│   ├── employee/
│   │   ├── layout.tsx                      # Auth guard: EMPLOYEE only
│   │   ├── dashboard/page.tsx              # Clock widget + monthly stats + AI Assistant widget
│   │   ├── profile/page.tsx                # Contact, bank, emergency details
│   │   ├── attendance/page.tsx             # Monthly calendar + log table
│   │   ├── leaves/page.tsx                 # Apply for leave + history
│   │   ├── payroll/page.tsx                # Payslip archive list
│   │   └── payroll/[id]/page.tsx           # A4 payslip detail + print
│   ├── careers/                            # PUBLIC — no auth
│   │   ├── page.tsx                        #   Open-roles job board
│   │   └── [id]/page.tsx                   #   Job detail + resume application form
│   ├── interview/[token]/page.tsx          # PUBLIC — token-gated AI interview experience
│   ├── api/
│   │   ├── auth/{login,logout,register,refresh}/   # POST – session lifecycle
│   │   ├── employees/                      # GET – list active employees
│   │   ├── employees/[id]/                 # PATCH – update HRA settings
│   │   ├── employees/onboarding/           # GET / POST – list / approve-reject pending registrations
│   │   ├── employees/profile/              # GET / PUT – self-profile read & update
│   │   ├── attendance/{check-in,check-out,override}/   # POST – clock + admin override
│   │   ├── leave-requests/                 # GET / POST – list / apply
│   │   ├── leave-requests/review/          # POST – admin approve / reject
│   │   ├── payroll/                        # GET / POST – list / generate
│   │   ├── payroll/actions/                # POST – approve or release a payroll record
│   │   ├── calendar/custom-days/           # GET / POST – working-calendar overrides
│   │   ├── holidays/                       # GET / POST / DELETE – holiday manager
│   │   ├── notifications/                  # GET / PUT – list / mark read
│   │   ├── settings/                       # GET / PUT – company configuration
│   │   ├── cron/auto-absent/               # GET / POST – nightly absent marker (CRON_SECRET)
│   │   ├── jobs/{,[id]}/                   # GET / POST / PATCH – job posting CRUD (admin)
│   │   ├── candidates/{,[id]}/             # GET / POST / PATCH – candidate intake, listing, status (admin)
│   │   ├── candidates/[id]/hire/           # POST – Hire-to-Onboard bridge
│   │   ├── interviews/{,[id]}/             # GET / POST – schedule & inspect AI interviews (admin)
│   │   ├── interviews/public/[token]/      # GET / POST – PUBLIC candidate interview flow
│   │   ├── careers/{,[id],apply}/          # GET / POST – PUBLIC job board + application intake
│   │   └── agents/
│   │       ├── analytics/{hiring-overview,workforce}/   # GET – funnel KPIs / AI workforce insights (admin)
│   │       └── assistant/chat/             # POST – unified Onboarding/HR-Support chat (any authenticated user)
│   └── page.tsx                            # Root redirect (role-aware)
│
├── modules/
│   ├── auth/service.ts                     # Login, register, token issue & refresh
│   ├── approval/service.ts                 # Onboarding review: approve/reject pending registrations
│   ├── employee/service.ts                 # Profile CRUD, employee lifecycle
│   ├── attendance/service.ts               # Check-in/out, override, monthly ledger, status resolution
│   ├── calendar/service.ts                 # Calendar grids, daily overrides, holiday propagation
│   ├── payroll/service.ts                  # Payroll generation, approve, release, deduction math
│   ├── dashboard/service.ts                # KPI aggregation for both roles
│   ├── notification/service.ts             # Create, list, mark-read
│   ├── settings/service.ts                 # Company settings read/write
│   └── agents/                             # ───── RecruitIQ AI ─────
│       ├── shared/
│       │   ├── ai-client.ts                #   chatJSON<T>, chatText, chatWithTools — OpenAI wrappers
│       │   └── embeddings.ts               #   embedTexts, cosineSimilarity, retrieveTopMatches (RAG retrieval)
│       ├── hiring/
│       │   ├── service.ts                  #   HiringAgentService — RAG resume pipeline, funnel, hire bridge
│       │   └── prompts.ts                  #   RESUME_SEGMENTATION / EVIDENCE_SCORING system prompts
│       ├── interview/
│       │   ├── service.ts                  #   InterviewAgentService — adaptive question loop, scoring, reports
│       │   └── prompts.ts                  #   ADAPTIVE_QUESTION / ANSWER_SCORING / REPORT_GENERATION prompts
│       ├── assistant/
│       │   ├── service.ts                  #   AssistantAgentService — mode resolution + tool-calling chat
│       │   ├── tools.ts                    #   getLeaveSummary / getAttendanceSummary / getLatestPayslip / getCompanyPolicy
│       │   └── prompts.ts                  #   Mode-aware system prompts + suggested-prompt chips
│       └── analytics/
│           ├── service.ts                  #   AnalyticsAgentService — deterministic aggregation + AI narration
│           └── prompts.ts                  #   WORKFORCE_INSIGHTS_SYSTEM_PROMPT
│
├── repositories/
│   ├── attendance.repository.ts            # Attendance CRUD + monthly/company aggregations
│   ├── audit.repository.ts                 # AuditLog write/read
│   ├── candidate.repository.ts             # Candidate CRUD, funnel counts, populated lookups
│   ├── company.repository.ts               # Company settings + holiday management
│   ├── custom-day.repository.ts            # CustomDay CRUD operations
│   ├── employee.repository.ts              # Employee CRUD, next-ID allocation, dept/headcount aggregations
│   ├── interview.repository.ts             # Interview CRUD, by-token / by-candidate lookups
│   ├── job-posting.repository.ts           # JobPosting CRUD, status counts
│   ├── leave.repository.ts                 # LeaveRequest CRUD, balance & utilization aggregations
│   ├── notification.repository.ts          # Notification CRUD
│   ├── payroll.repository.ts               # Payroll CRUD, trend aggregations, released-slip lookups
│   └── user.repository.ts                  # User account CRUD
│
├── lib/
│   ├── db.ts                                # MongoDB connection with singleton guard (connectDB)
│   ├── jwt.ts                               # sign/verify access & refresh tokens, cookie names & options
│   ├── pdf.ts                               # extractTextFromPdf — pdf-parse wrapper
│   ├── cloudinary.ts                        # Cloudinary v2 config + uploadBuffer()
│   ├── api-fetch.ts                         # apiFetch — fetch wrapper with auto session-refresh
│   ├── utils.ts                             # cn() and misc helpers
│   └── models/                              # Mongoose schema definitions + co-located TS interfaces
│       ├── Attendance.ts
│       ├── AuditLog.ts
│       ├── Candidate.ts                     # ICandidate, ICandidateParsedData, ISkillEvidence, …
│       ├── Company.ts                       # Includes holidays[] array, workingHoursPolicy
│       ├── CustomDay.ts                     # Date-specific office timings & holidays
│       ├── Employee.ts                      # Includes hraEnabled, hraAmount
│       ├── Interview.ts                     # IInterview, IInterviewQuestion, IInterviewReport
│       ├── JobPosting.ts                    # IJobPosting, JobPostingStatus
│       ├── LeaveRequest.ts
│       ├── Notification.ts
│       ├── Payroll.ts                       # IEarnings includes hraAmount
│       ├── User.ts
│       └── index.ts                         # Barrel re-export of every model + type
│
├── components/
│   ├── shared/
│   │   ├── admin-shell.tsx                 # Admin layout wrapper
│   │   ├── employee-shell.tsx              # Employee layout wrapper
│   │   ├── sidebar.tsx                     # Collapsible nav + sign-out (localStorage state)
│   │   ├── header.tsx                      # Sticky header + notification bell + logout
│   │   ├── clock-widget.tsx                # Live clock + check-in/out controls
│   │   ├── dashboard-charts.tsx            # Recharts attendance donut + payroll bar (multi-color palette)
│   │   ├── ai-assistant-widget.tsx         # Floating chat bubble for the unified Assistant Agent
│   │   ├── attendance-filter-form.tsx      # Admin attendance query/filter controls
│   │   ├── bank-details-banner.tsx         # Reminder banner until bank details filled
│   │   ├── payroll-action-bar.tsx          # Approve / release bulk action controls
│   │   ├── auto-print-trigger.tsx          # Triggers window.print() on payslip detail load
│   │   └── print-button.tsx                # Print/download control
│   └── ui/                                  # shadcn/ui primitives (Button, Dialog, Card, …)
│
├── validations/
│   ├── auth.ts                              # loginSchema, registerSchema
│   ├── hiring.ts                            # createJobPostingSchema, candidateApplicationSchema
│   ├── interview.ts                         # createInterviewSchema, public-answer schema
│   └── assistant.ts                         # assistantChatSchema
│
├── services/
│   └── email.ts                             # Nodemailer wrappers (payslip release, onboarding welcome)
│
├── constants/
│   └── hr.ts                                # DEPARTMENTS, DESIGNATIONS and other HR enums
│
├── hooks/                                   # Custom React hooks
├── store/                                   # Zustand client state slices
└── providers/                               # React context / query providers
```

---

## Role System & Access Control

### ADMIN
- Email must be listed in the `ADMIN_EMAILS` environment variable (comma-separated)
- Cannot self-register via the registration page — must be set up directly in the environment
- Full system access: workforce management, payroll operations, attendance overrides, settings, holiday declaration, **plus the entire Hiring/Interview/Analytics agent surfaces**
- Has no `Employee` profile of their own — the Assistant Agent therefore serves admins a **policy-only** persona (`getCompanyPolicy` is the only tool offered)
- Session cookie role value: `"ADMIN"`

### EMPLOYEE
- Self-registers through the public `/register` page, **or** arrives pre-activated via the Hiring Agent's hire-to-onboard bridge (with a temporary password emailed to them)
- Self-registered accounts start with `employmentStatus: "PENDING"` — no dashboard access until admin approval
- Upon approval/hire: receives a sequential employee ID, department, designation, and gross salary
- Restricted entirely to their own data; cannot access any other employee's records — every Assistant Agent tool is bound to the caller's own `employeeId` at request time
- Session cookie role value: `"EMPLOYEE"`

### Public / Unauthenticated
- Anyone can browse `/careers` and apply to an `OPEN` job posting at `/careers/[id]` — candidates never need an account
- Anyone holding a valid, unexpired interview `token` can complete their AI interview at `/interview/[token]` — the link is the only "credential"

### Route Guards
Both `/admin/**` and `/employee/**` route groups have a `layout.tsx` that verifies the JWT cookie server-side before rendering any page. Invalid or missing tokens redirect to `/login` immediately. `/careers/**` and `/interview/[token]` deliberately sit **outside** both guarded groups and perform no session check — they are the system's public surface by design.

---

## Core HRMS Engines Explained

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
| Leave deduction | `(Absent Days + max(0, Leave Days − Free Allowance) + Half-Day Count × 0.5) × Daily Rate` |
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
DRAFT  →  GENERATED  →  APPROVED  →  RELEASED
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
5. Holidays can be removed from the list; existing attendance records remain and can be corrected via the admin override tool if needed. The `getCompanyPolicy` tool surfaces the next 5 upcoming holidays to the Assistant Agent.

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

All endpoints return `Response.json()` (Next.js 16 pattern). Authentication is verified by reading and decoding the **`recruitiq_access`** HTTP-only cookie on every protected request via `verifyAccessToken()`; the **`recruitiq_refresh`** cookie powers silent session renewal through `apiFetch()`.

### Core HRMS

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate user, issue access + refresh cookies |
| POST | `/api/auth/logout` | Any | Clear session cookies |
| POST | `/api/auth/register` | Public | Submit a `PENDING` employee registration |
| POST | `/api/auth/refresh` | Any | Mint a fresh access token from a valid refresh cookie |
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
| GET | `/api/calendar/custom-days` | Admin | Retrieve overrides and holidays for a given month/year |
| POST | `/api/calendar/custom-days` | Admin | Create, update (`SET`), or revert (`REVERT`) custom shift/holiday settings |
| GET | `/api/holidays` | Admin | List company holidays |
| POST | `/api/holidays` | Admin | Declare a holiday (marks all active employees) |
| DELETE | `/api/holidays` | Admin | Remove a holiday from the list |
| GET | `/api/notifications` | Both | List notifications with unread count |
| PUT | `/api/notifications` | Both | Mark one or all notifications as read |
| GET | `/api/settings` | Admin | Read company configuration |
| PUT | `/api/settings` | Admin | Update company configuration |
| GET / POST | `/api/cron/auto-absent` | Cron | Mark absent employees (`Authorization: Bearer <CRON_SECRET>`) |

### RecruitIQ AI — Hiring & Interview Agents

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs` | Admin | List job postings (filter by status, paginated, enriched with applicant/shortlist/hire counts) |
| POST | `/api/jobs` | Admin | Create a job posting (validated by `createJobPostingSchema`) |
| GET | `/api/jobs/[id]` | Admin | Get a single job posting |
| PATCH | `/api/jobs/[id]` | Admin | Update a job posting's status (`DRAFT`/`OPEN`/`CLOSED`) |
| GET | `/api/candidates?jobPostingId=` | Admin | List candidates for a job posting, ranked by match score |
| POST | `/api/candidates` | Admin | Manual resume intake (multipart: name, email, phone, PDF) — runs the full RAG scoring pipeline |
| GET | `/api/candidates/[id]` | Admin | Get a candidate's full profile, parsed data, evidence dossier, and AI verdict |
| PATCH | `/api/candidates/[id]` | Admin | Update a candidate's pipeline status |
| POST | `/api/candidates/[id]/hire` | Admin | **Hire-to-Onboard bridge** — converts the candidate into an active employee account |
| GET | `/api/interviews?candidateId=` | Admin | Look up the interview generated for a candidate |
| POST | `/api/interviews` | Admin | Generate a bespoke adaptive AI interview + public token for a shortlisted candidate |
| GET | `/api/interviews/[id]` | Admin | Inspect an interview's live status, transcript, and final report |
| GET | `/api/interviews/public/[token]` | **Public** | Candidate-facing: fetch current question / progress / final report (never leaks unanswered scores) |
| POST | `/api/interviews/public/[token]` | **Public** | Candidate-facing: `{ action: "begin" }` to start, or `{ answer }` to submit and advance |

### Public Careers Surface

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/careers` | **Public** | List `OPEN` job postings (sanitized — no internal fields) |
| GET | `/api/careers/[id]` | **Public** | Get a single open job posting's public detail |
| POST | `/api/careers/apply` | **Public** | Candidate self-application intake (multipart resume upload) — same RAG pipeline as admin intake |

### RecruitIQ AI — Assistant & Analytics Agents

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/agents/assistant/chat` | Authenticated | Unified Onboarding/HR-Support chat — `{ messages: ChatTurn[] }` → `{ mode, reply, suggestedPrompts }` |
| GET | `/api/agents/analytics/hiring-overview` | Admin | Hiring funnel KPIs: open jobs, total candidates, shortlisted, interviewing, hired |
| GET | `/api/agents/analytics/workforce` | Admin | Full Workforce Analytics Agent payload: trends + AI-narrated insights & summary |

---

## Environment Variables

Create a `.env.local` file in the project root. **Never commit this file** — it is gitignored.

```ini
# ── Database ──────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/?appName=Cluster0

# ── JWT Signing Keys (generate with: openssl rand -hex 64) ────────────────────
JWT_ACCESS_SECRET=<128-character-random-hex-string>
JWT_REFRESH_SECRET=<128-character-random-hex-string>

# ── Admin Access Control ──────────────────────────────────────────────────────
# Comma-separated email addresses. Only these addresses can hold the ADMIN role.
ADMIN_EMAILS=admin@yourcompany.com,hr@yourcompany.com

# ── Cron Job Security (generate with: openssl rand -hex 32) ──────────────────
# Set the same value in your scheduler (Vercel Cron / external cron service).
CRON_SECRET=<random-secret-string>

# ── SMTP Email (Nodemailer) ───────────────────────────────────────────────────
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=RecruitIQ <noreply@yourcompany.com>

# ── OpenAI — powers all five AI agents (Hiring, Interview, Onboarding, ───────
# ── HR Support, Workforce Analytics). Get a key at platform.openai.com ───────
OPENAI_API_KEY=sk-...
# Optional — chat completion model, defaults to gpt-4o-mini if unset
OPENAI_MODEL=gpt-4o-mini
# Optional — embedding model for the Hiring Agent's RAG pipeline,
# defaults to text-embedding-3-small if unset
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# ── Cloudinary — stores uploaded resume PDFs (Hiring Agent intake) ───────────
# Get credentials from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Application ───────────────────────────────────────────────────────────────
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Getting Started

### Prerequisites

- **Node.js** v20.x or later
- **npm** / **pnpm** / **yarn**
- A **MongoDB Atlas** cluster (free tier works for development)
- An **OpenAI** API key (powers all five AI agents — required for the agentic features to function)
- A **Cloudinary** account (free tier works — stores uploaded resume PDFs)
- An SMTP provider for outbound mail (e.g. Mailtrap sandbox for development)

### 1. Clone and Install

```bash
git clone https://github.com/your-org/recruitiq.git
cd recruitiq
npm install
```

### 2. Configure Environment

Create `.env.local` in the project root and fill in the variables described in the [Environment Variables](#environment-variables) section above.

### 3. Seed Sample Data (optional but recommended)

```bash
npm run seed
```

`scripts/seed.ts` populates a realistic demo dataset — company settings, employees, attendance history, leave requests, and payroll cycles — so every dashboard, chart, and AI agent has real data to work with from the first run.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. First-Time Setup

1. Open `/register` and create an account using an email address listed in `ADMIN_EMAILS`. This account automatically receives the `ADMIN` role.
2. Log in at `/login` — you will be redirected to the admin dashboard.
3. Go to **Settings** and configure your company profile, payroll rates, and shift timings.
4. Post your first role from **Hiring Agent → New Job Posting**, then visit `/careers` in an incognito window to apply as a candidate and watch the Hiring Agent parse and score the resume in real time.
5. Invite employees to register at `/register` — their accounts will appear in **Workforce → Onboarding Pipeline** for your approval — or hire a scored candidate directly from the Hiring Agent to onboard them pre-activated.

### 6. Production Build

```bash
npm run build
npm run start
```

---

## Deployment

RecruitIQ is designed for **zero-configuration deployment on Vercel**.

### Vercel

1. Push the repository to GitHub / GitLab / Bitbucket.
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Add every environment variable from `.env.local` (including `OPENAI_API_KEY` and the Cloudinary keys) in the Vercel project settings.
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

Any platform that supports Node.js 20+ and environment variables will work. Set `NODE_ENV=production` and ensure all environment variables — including the AI/Cloudinary keys — are configured. For the cron job, use the platform's native scheduler or an external service.

---

## Security Hardening Notes

### Authentication
- JWT access (15-minute) and refresh (7-day) tokens are stored exclusively in **HTTP-only, SameSite=Lax cookies** (`recruitiq_access` / `recruitiq_refresh`, `secure: true` in production) — never accessible to JavaScript on the client, eliminating XSS-based token theft.
- Token verification happens **server-side** on every protected route handler and layout guard via `verifyAccessToken()` / `verifyRefreshToken()`.
- The `ADMIN_EMAILS` list is a server-side environment variable — it never reaches the browser.

### Data Access & AI Boundaries
- All MongoDB queries use **`.lean()`** — Mongoose documents are returned as plain JavaScript objects, which is faster and prevents accidental document mutation.
- Employees can only query their own records — every service method verifies the session's `userId` matches the requested resource, and every Assistant Agent tool is bound to a single resolved `employeeId` so the model **cannot** be prompted into looking up someone else's leave, attendance, or payroll data.
- The Assistant Agent only ever discusses `RELEASED` payslips and never fabricates figures — its system prompt and tool design force it to call a real tool (or admit "no data available") rather than guess.
- Input is validated with **Zod schemas** at every API boundary before touching the database.
- Public endpoints (`/api/careers/*`, `/api/interviews/public/[token]`) are deliberately scoped: the careers feed strips internal fields from job postings, and the public interview reader (`getPublicInterview`) **never returns scores or feedback for unanswered questions**.

### Secrets & Configuration
- No secrets are embedded in source code; all live in `.env.local` (gitignored) or the hosting platform's environment settings.
- `CRON_SECRET` protects the auto-absent endpoint from being triggered by arbitrary external requests.
- `OPENAI_API_KEY` and the Cloudinary keys are server-side only — consumed exclusively inside `src/modules/agents/shared/` and `src/lib/cloudinary.ts`, never prefixed with `NEXT_PUBLIC_`.

### Email
- Outbound email calls (`emailService.sendMail()` / `sendOnboardingWelcomeEmail()`) are dispatched in **fire-and-forget async blocks** using `.catch()` for error capture. They do not block the HTTP response cycle, preventing email provider timeouts from affecting user-facing API latency.

### Auditability
- Every consequential admin action across both the core HRMS and the AI agent platform — job posting creation, candidate hiring, interview scheduling, onboarding approvals, and more — is recorded via `auditRepository.log(...)`, fired-and-forgotten so a logging hiccup never breaks the primary operation.

---

## License

This project is proprietary software. All rights reserved.

---
