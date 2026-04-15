# CLAUDE.md — OutMeets (organiser-platform)

Outdoor event & group management platform. Backend: Spring Boot API. Frontend: React SPA.

## Project Structure

```
organiser-platform/
├── backend/                  # Spring Boot 3.1.5, Java 17, Gradle
│   └── src/main/java/com/organiser/platform/
│       ├── controller/       # REST endpoints
│       ├── service/          # Business logic
│       ├── repository/       # JPA repositories
│       ├── model/            # JPA entities
│       ├── dto/              # Request/response DTOs (admin/ subdirectory too)
│       ├── config/           # Security, database, etc.
│       ├── security/         # JWT, auth filters
│       ├── enums/            # Shared enums
│       ├── scheduler/        # Scheduled tasks
│       ├── exception/        # Custom exceptions
│       └── util/             # Utilities
│   └── src/main/resources/db/migration/postgresql/
│       └── V{n}__{Description}.sql   # Flyway migrations (currently at V9)
├── frontend/                 # React 18, Vite, Tailwind CSS
│   └── src/
│       ├── pages/            # Page-level components (one per route)
│       ├── components/       # Reusable UI components
│       ├── contexts/         # React context providers
│       ├── hooks/            # Custom hooks
│       ├── lib/              # API client (Axios)
│       ├── store/            # State management
│       └── utils/            # Helpers
├── docker-compose.yml        # Local PostgreSQL
└── docs/                     # Additional docs
```

## Local Development

### Start backend
```bash
docker-compose up -d postgres   # start DB
cd backend && ./gradlew bootRun  # API on http://localhost:8080
```

### Start frontend
```bash
cd frontend
npm install
npm run dev                      # App on http://localhost:3000
```

Frontend `.env` (only needed for production builds — local dev uses Vite proxy):
```
VITE_API_URL=http://localhost:8080/api/v1
```

### Run tests
```bash
cd backend && ./gradlew test
cd frontend && npm test
```

## Key Conventions

### Backend (Java/Spring Boot)
- Lombok used extensively — avoid adding boilerplate getters/setters manually
- REST endpoints in `controller/`, business logic in `service/`, DB in `repository/`
- Database changes must be done via Flyway migration files: `V{next}__Description.sql` in `backend/src/main/resources/db/migration/postgresql/`
- To find the next migration version: `ls backend/src/main/resources/db/migration/postgresql/ | grep -oE 'V[0-9]+' | sed 's/V//' | sort -n | tail -1`
- **Never reuse a migration version number**: If a V{n} file previously existed (even if now deleted), Flyway has it in history. Creating a new V{n} with different content causes a checksum mismatch or silent skip — the DDL never runs but `bootRun` fails with Hibernate schema-validation errors. Always use the next unused version.
- Java package root: `com.organiser.platform`
- **Never use H2** — tests always run against real PostgreSQL (`outmeets_test` DB, port 5433). H2 hides PostgreSQL-specific behaviour. The Gradle `createTestDb` task auto-creates `outmeets_test` before tests run.
- **`@Column(columnDefinition)` — always use `NUMERIC`, never `DECIMAL`**: PostgreSQL reports column metadata as `numeric`. Hibernate maps `DECIMAL` → JDBC FLOAT but finds NUMERIC in the DB → startup failure: `wrong column type encountered; found [numeric (Types#NUMERIC)], but expecting [decimal(x,y) (Types#FLOAT)]`.
- **SecurityConfig — every new endpoint must be explicitly listed**: The config ends with `.anyRequest().denyAll()`. Any endpoint not in the list returns 403. Always add a matching `AntPathRequestMatcher` when adding a new controller method.
- **Always verify the build compiles after backend changes**: Run `./gradlew compileJava --rerun-tasks` from `backend/` before finishing. Do not rely on Gradle's incremental cache — it can mask missing imports and still report success.
- **Never use fully-qualified class names inline** (e.g. `java.util.List<Foo>`): Always add the import at the top of the file instead. Inline FQNs make the import unused and pollute the code.
- **`@Builder.Default` is required for any field with an initialiser inside a `@Builder` class**: Without it Lombok silently ignores the default value at build time. Applies to collections (`new HashSet<>()`, `new ArrayList<>()`) and primitives with defaults.
- **Add all imports explicitly**: When writing or editing a Java file always check the import block. Missing imports compile fine from Gradle's cache but fail on a clean build or CI.

### Frontend (React)
- Functional components with hooks only — no class components
- Tailwind CSS for all styling — purple/pink/orange gradient palette (`purple-600`, `pink-600`, `orange-500/600`)
- Keep components under ~200 lines; split if larger
- API calls go through `src/lib/` (Axios client)
- Pages live in `src/pages/`, reusable UI in `src/components/`

### Mobile vs Desktop UI
- Mobile and desktop are **different interfaces within the same page component** — not separate files
- Mobile sticky action bar: `lg:hidden fixed bottom-0` — only visible below 1024px
- Desktop sidebar: right-column layout visible at `lg+`
- Never alter desktop layout when fixing mobile issues and vice versa
- **Always clarify which surface (mobile or desktop) is in scope before making UI changes**

### User Roles — Different UI per Role
Pages render different interfaces depending on the viewer's role. Always confirm which role(s) a change applies to before implementing.

| Role | Primary device | Notes |
|---|---|---|
| **Attendee** | Mobile | Joins events, manages guests, leaves events |
| **Host** | Mobile + Desktop | Leads the event on the day, cannot leave |
| **Organiser** | Desktop | Creates/manages events, uses Manage panel — power user |

- On `EventDetailPage`, the action bar conditionally renders one of: attendee view, host view, organiser view, or guest (not logged in)
- UI improvements for attendees do **not** automatically apply to organisers/hosts and vice versa
- Organiser and host views are intentionally more functional than visual — prioritise desktop usability for those roles

## Deployment

| Layer    | Service  | Branch trigger |
|----------|----------|---------------|
| Backend  | Render.com | `main`      |
| Frontend | Netlify    | `main`      |
| Database | PostgreSQL on Render | — |
| Email    | Resend.com (magic links) | — |

- **`staging` branch** = staging environment; PRs go `feature/* → staging → main`
- Auto-deploy on push to `main`

## Git & PRs

Conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

```bash
git checkout -b feature/your-feature
# work...
git commit -m "feat: describe the change"
# PR into staging first, then staging → main for prod deploy
```

### Branch protection rules (enforced manually — free GitHub plan)

- **Never push directly to `main`** — always via PR from `staging`
- **Never push directly to `staging`** — always via PR from a `feature/*` branch
- The only valid flow is: `feature/* → staging → main`
- This applies to Claude too. When asked to make changes: create a feature branch, commit there, and open a PR targeting `staging`. Never commit directly to `staging` or `main`.
- Exception: hotfixes to production may go `hotfix/* → main` directly, but only with explicit user instruction.

## Auth

- Default: passwordless **magic link** via email (Resend.com)
- Alternative: **6-digit passcode** via email — toggled by the `PASSCODE_AUTH_ENABLED` feature flag
  - When enabled, login UI switches from magic link to passcode entry
  - Admin toggles this at runtime via the Admin Dashboard → Feature Flags (no deploy needed)
  - Backend: `POST /api/v1/auth/passcode` (request) + `POST /api/v1/auth/passcode/verify` (verify)
  - Rate limited: 5 requests/hour per IP+email, 10 verify attempts per 15 min
- JWT access token: 24h expiry; **refresh token: 90 days** with rotation on every use
- On app load, expired access tokens are not force-logged-out if a valid refresh token exists — the API interceptor silently refreshes on the next API call (`frontend/src/store/authStore.js`, `frontend/src/lib/api.js`)
- Security config: `backend/src/main/java/com/organiser/platform/config/` and `security/`

## Business Domain Rules

### Event Timing
Events have three time-related fields — always check all three before writing filtering logic:

| Field | Type | Required | Purpose |
|---|---|---|---|
| `eventDate` | `Instant` | Yes | Start time |
| `endDate` | `Instant` | No | Explicit end time set by organiser |
| `estimatedDurationHours` | `BigDecimal` | No | Duration when no explicit end time |

**Effective end time priority** (used for filtering past/upcoming/live):
1. `endDate` — use if set
2. `eventDate + estimatedDurationHours` — use if endDate null but duration set
3. `23:59:59 UTC` on the event's start day — fallback (keeps event visible all day)

This logic lives in `EventTimingUtils` (`backend/src/main/java/com/organiser/platform/util/EventTimingUtils.java`) and is mirrored in `EventDetailPage.jsx` (`eventEnd` calculation).

**Tests:** `EventTimingUtilsTest` covers all boundary cases — run before changing any timing logic.

**JPQL note:** Discover queries use `eventDate >= startOfToday` as the DB-level fallback (can't compute duration in JPQL). The precise `effectiveEnd` filtering happens at the service layer.

### Frontend — No Test Framework
The frontend has no test framework installed (no Jest/Vitest). When adding business logic to the frontend, extract it to a pure utility function and add Vitest tests. Install with:
```bash
cd frontend && npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

## Working Style

### Before implementing, always confirm first
When the user asks a question or describes a problem, **do not start implementing**. First explain your approach and ask for confirmation. Only write code after the user explicitly says to go ahead.

### Only do what was asked
Do not fix, refactor, or improve anything beyond the explicit request — even if you spot related issues. If you notice something worth fixing, mention it separately and wait to be asked. Do not bundle unrequested changes into a commit.

## Activities

Currently only **Hiking** is supported as an activity type. Do not suggest, display, or hardcode other activities (Cycling, Running, Swimming, Climbing, etc.) anywhere in the UI or copy unless explicitly told new activities have been added.

## Key Docs

- `STARTUP_GUIDE.md` — full local setup walkthrough
- `DEPLOYMENT.md` — production deploy steps
- `ENV_VARIABLES_REFERENCE.md` — all environment variables
- `CONTRIBUTING.md` — code style and PR checklist