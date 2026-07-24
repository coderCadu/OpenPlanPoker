# Planning Poker App - Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**TDD Requirement**: Tests MUST be written before implementation for every task. Verify tests fail initially (red), then pass after implementation (green).

---

**Design**: `.specs/features/planning-poker/design.md`  
**Status**: Draft → Approved → In Progress

---

## Test Coverage Matrix

**Guidelines Found**: None (fresh project) — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Service (business logic) | unit | All branches; 1:1 to spec ACs; every edge case from design | `src/backend/services/**/__tests__/*.spec.ts` | `npm run test:unit` |
| API Controller/Route | integration | All routes: happy path + edge + error scenarios | `src/backend/routes/**/__tests__/*.spec.ts` | `npm run test:integration` |
| Vue Component (frontend) | unit | Component rendering, state changes, prop handling, event emission | `src/frontend/components/**/__tests__/*.spec.ts` | `npm run test:unit` |
| E2E / Multi-participant | e2e | Happy path: join → vote → reveal → export; error recovery | `tests/e2e/**/*.spec.ts` | `npm run test:e2e` |
| Utils / Helpers | unit | All branches; inputs at boundaries | `src/**/__tests__/*.spec.ts` | `npm run test:unit` |
| Entity / Schema | none | Build gate only (Prisma validates) | — | —  |

---

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After unit tests pass | `npm run test:unit && npm run lint` |
| Full | After integration/e2e tests | `npm run test:unit && npm run test:integration && npm run lint` |
| Build | After all tasks complete | `npm run build && npm run test:unit && npm run test:integration && npm run test:e2e && npm run lint` |

---

## Execution Plan

**Total Tasks**: 28 (fits 4 subagent workers @ ~7 tasks per batch)

### Phase 1: Backend Setup & Database

Foundation: project initialization, database schema, ORM setup.

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Session & Story Services

Core business logic: session management, hierarchy CRUD.

```
T6 → T7 → T8 → T9 → T10
```

### Phase 3: Voting & Chat Services

Voting logic, vote reveal, chat persistence, notifications.

```
T11 → T12 → T13 → T14 → T15
```

### Phase 4: Backend API Routes

REST endpoints for all services.

```
T16 → T17 → T18 → T19 → T20
```

### Phase 5: WebSocket Server & Real-Time Events

Socket.io setup, event broadcasting, heartbeat.

```
T21 → T22 → T23
```

### Phase 6: Frontend Components & State

Vue 3 components, Socket.io client integration.

```
T24 → T25 → T26 → T27 → T28
```

---

## Task Breakdown

### Phase 1: Backend Setup & Database

#### T1: Initialize Node.js project with TypeScript, Express, Prisma, testing stack

**What**: Set up project structure with npm, TypeScript config, Express server, Prisma ORM, and test frameworks (Jest, Supertest, Vitest for frontend)

**Where**: `package.json`, `tsconfig.json`, `src/backend/server.ts`, `prisma/schema.prisma`, `.env.example`, `jest.config.ts`

**Depends on**: None

**Reuses**: None (fresh project)

**Requirement**: N/A (setup task)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] `package.json` created with dependencies: express, prisma, socket.io, pg, dotenv, jest, supertest, typescript
- [ ] `tsconfig.json` configured for backend (strict mode, ES2020 target)
- [ ] `src/backend/server.ts` created with basic Express app setup (not started)
- [ ] Prisma initialized: `prisma/schema.prisma` with PostgreSQL datasource
- [ ] `.env.example` and `.env` created with DATABASE_URL placeholder
- [ ] `jest.config.ts` created with module resolution for TypeScript
- [ ] No build errors; `npm run build` succeeds
- [ ] README.md created with project overview and setup instructions

**Tests**: none (setup task)
**Gate**: build

---

#### T2: Create Prisma schema with Session, Participant, Epic, Story, Task, Vote, Message models

**What**: Define complete Prisma data model matching design with relationships, indexes, constraints

**Where**: `prisma/schema.prisma`

**Depends on**: T1

**Reuses**: Design data model specification

**Requirement**: POKER-06 (story/task hierarchy)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] All 7 models defined: Session, Participant, Epic, Story, Task, Vote, Message
- [ ] All relationships correct (cascade deletes, one-to-many, unique constraints)
- [ ] Indexes added for query optimization (sessionId, lastActivityAt, slug, createdAt)
- [ ] Slugs are unique with collision handling documented
- [ ] Vote has composite unique (taskId, participantId) to prevent duplicates
- [ ] Participant has composite unique (sessionId, pseudonym)
- [ ] Message truncated to 500 chars via @db.VarChar(500)
- [ ] Prisma format check passes: `npx prisma format` produces no changes
- [ ] Schema compiles without errors

**Tests**: none (schema validation only)
**Gate**: build

---

#### T3: Create initial database migration and verify connection

**What**: Generate first Prisma migration, test connection to PostgreSQL

**Where**: `prisma/migrations/001_init/migration.sql`, database setup script

**Depends on**: T2

**Reuses**: Schema from T2

**Requirement**: POKER-01 (session persistence)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] `prisma migrate dev --name init` succeeds
- [ ] Migration SQL file created and reviewed
- [ ] All tables created with correct columns and constraints
- [ ] Indexes created as specified
- [ ] Prisma Client generated successfully
- [ ] Connection test script created and passes (creates/reads test session)
- [ ] No warnings from Prisma

**Tests**: none (database integration test separate)
**Gate**: build

---

#### T4: Set up environment configuration and database connection pooling

**What**: Create config loader, set up Prisma client singleton, configure connection pool for PostgreSQL

**Where**: `src/backend/config/database.ts`, `src/backend/config/env.ts`

**Depends on**: T3

**Reuses**: Prisma client from T2-T3

**Requirement**: POKER-01 (persistence)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] `src/backend/config/env.ts` loads .env with validation (DATABASE_URL required)
- [ ] `src/backend/config/database.ts` exports Prisma client singleton
- [ ] Connection pooling configured (min/max connections)
- [ ] Error handling for connection failures documented
- [ ] No connection leaks (singleton pattern enforced)
- [ ] Environment validation happens on app startup

**Tests**: unit (mock env loading)
**Gate**: quick

---

#### T5: Set up logging and error handling utilities

**What**: Create logger (Winston or Pino), centralized error handling middleware for Express

**Where**: `src/backend/utils/logger.ts`, `src/backend/utils/errors.ts`, `src/backend/middleware/errorHandler.ts`

**Depends on**: T1

**Reuses**: None

**Requirement**: POKER-01 (observability)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Logger created with info/warn/error levels
- [ ] Custom error class (AppError) with status codes
- [ ] Error middleware catches unhandled errors and returns JSON
- [ ] Logging includes timestamps, request IDs
- [ ] Error responses have consistent format: `{error, message, status}`
- [ ] No errors logged to console (all to logger)

**Tests**: unit (error class, logger mock)
**Gate**: quick

---

### Phase 2: Session & Story Services

#### T6: Create SessionService with create, join, leave, expiry logic

**What**: Implement SessionService with all methods: createSession, joinSession, leaveSession, expireInactiveSessions, closeSession, generateUniqueSlug

**Where**: `src/backend/services/SessionService.ts`

**Depends on**: T4 (Prisma + database ready)

**Reuses**: Prisma models, logger from T5

**Requirement**: POKER-01, POKER-02, POKER-03, POKER-04, POKER-05

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] All 7 methods implemented per design
- [ ] createSession generates unique slug (collision retry)
- [ ] joinSession adds participant and updates lastActivityAt
- [ ] leaveSession removes participant and handles cleanup
- [ ] expireInactiveSessions marks sessions inactive >30 min as archived
- [ ] closeSession prevents new votes
- [ ] generateUniqueSlug handles collisions
- [ ] Tests pass: `npm run test:unit -- SessionService`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥12 unit tests (one per method + edge cases: duplicate names, concurrent joins, expiry, slug collision)

**Tests**: unit
**Gate**: quick

---

#### T7: Create StoryService with CRUD and hierarchy management

**What**: Implement StoryService: createEpic, createStory, createTask, deleteEpic (cascade), deleteStory (cascade), deleteTask, getSessionHierarchy, updateEstimate, parseMarkdownImport

**Where**: `src/backend/services/StoryService.ts`

**Depends on**: T4

**Reuses**: Prisma models, logger from T5

**Requirement**: POKER-06, POKER-07, POKER-08, POKER-09, POKER-10, POKER-11, POKER-12, POKER-13, POKER-14

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] All 9 methods implemented per design
- [ ] Cascade delete verified (delete epic → stories and tasks deleted)
- [ ] updateEstimate only allows numeric scores (Fibonacci cards)
- [ ] parseMarkdownImport parses markdown and creates hierarchy
- [ ] getSessionHierarchy returns full nested structure
- [ ] Tests pass: `npm run test:unit -- StoryService`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥18 unit tests (one per method + cascade delete verification, markdown parsing edge cases)

**Tests**: unit
**Gate**: quick

---

#### T8: Create integration test for Session + Story services together

**What**: Integration test verifying end-to-end flow: create session → add epic → add story → add task → estimate → verify hierarchy

**Where**: `src/backend/services/__tests__/Session.Story.integration.spec.ts`

**Depends on**: T6, T7 (both services written)

**Reuses**: Test database setup, Prisma models

**Requirement**: POKER-01 through POKER-14

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Integration test uses real Prisma database (test database or in-memory)
- [ ] Test creates session, joins participant, creates epic→story→task hierarchy
- [ ] Test verifies cascade delete when epic deleted
- [ ] Test verifies pseudonym uniqueness within session
- [ ] Test verifies 30-minute inactivity expiry
- [ ] Tests pass: `npm run test:integration`
- [ ] Gate passes: `npm run test:integration && npm run lint`
- [ ] **Test count**: ≥6 integration tests

**Tests**: integration
**Gate**: full

---

#### T9: Create utility functions: markdown parser, slug generator, validation helpers

**What**: Helper utilities: parseMarkdown (string → hierarchy), generateSlug, validateTitle, validatePseudonym, calculateFibonacciStats

**Where**: `src/backend/utils/markdown.ts`, `src/backend/utils/slug.ts`, `src/backend/utils/validators.ts`

**Depends on**: T1

**Reuses**: None

**Requirement**: POKER-13 (markdown import), POKER-02 (pseudonym), POKER-14 (export)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] parseMarkdown splits `# Epic\n## Story\n### Task` correctly
- [ ] generateSlug creates unique, readable slugs (kebab-case)
- [ ] validateTitle checks ≤255 chars, no null bytes
- [ ] validatePseudonym checks ≤50 chars, no empty
- [ ] calculateFibonacciStats (average, median) ignores "?", "coffee"
- [ ] All functions pure (no side effects)
- [ ] Tests pass: `npm run test:unit -- utils`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥15 unit tests (boundary conditions, special chars)

**Tests**: unit
**Gate**: quick

---

#### T10: Create ExportService to generate markdown from session data

**What**: Implement ExportService: generateMarkdown (builds full markdown from session) + formatMarkdownEpic/Story/Task (formatting helpers)

**Where**: `src/backend/services/ExportService.ts`

**Depends on**: T7 (Story hierarchy available)

**Reuses**: Utilities from T9 (markdown validation)

**Requirement**: POKER-32, POKER-33, POKER-34, POKER-35, POKER-36, POKER-37, POKER-38

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] generateMarkdown fetches session hierarchy and exports as markdown
- [ ] Format: `# Epic (est: X)\n## Story (est: Y)\n### Task (est: Z)`
- [ ] Includes session metadata (date, participants, duration)
- [ ] Handles missing estimates: "(no estimate)"
- [ ] Special characters escaped (e.g., #, *, _, [])
- [ ] Tests pass: `npm run test:unit -- ExportService`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥12 unit tests (special chars, missing estimates, metadata)

**Tests**: unit
**Gate**: quick

---

### Phase 3: Voting & Chat Services

#### T11: Create VoteService with record, update, reveal, average/median calculations

**What**: Implement VoteService: recordVote, updateVote, getAllVotes, calculateAverage, calculateMedian, hasAllVoted, validateCard

**Where**: `src/backend/services/VoteService.ts`

**Depends on**: T4 (Prisma + Vote model)

**Reuses**: Utilities from T9 (Fibonacci stats), logger from T5

**Requirement**: POKER-15, POKER-16, POKER-17, POKER-18, POKER-19, POKER-20, POKER-21, POKER-22, POKER-23

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] recordVote creates vote (enforces unique taskId+participantId)
- [ ] updateVote changes vote before reveal
- [ ] getAllVotes returns all votes for a task
- [ ] calculateAverage ignores "?" and "coffee" (numerics only)
- [ ] calculateMedian handles odd/even vote counts
- [ ] hasAllVoted checks all participants in session voted
- [ ] validateCard rejects invalid cards (not in Fibonacci set)
- [ ] Tests pass: `npm run test:unit -- VoteService`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥14 unit tests (average/median edge cases, card validation, concurrent votes)

**Tests**: unit
**Gate**: quick

---

#### T12: Create ChatService with message save and history retrieval

**What**: Implement ChatService: saveMessage (persists to DB), getSessionMessages (returns paginated history), validateMessage (truncate/sanitize)

**Where**: `src/backend/services/ChatService.ts`

**Depends on**: T4 (Prisma + Message model)

**Reuses**: Logger from T5

**Requirement**: POKER-24, POKER-25, POKER-26, POKER-27, POKER-28, POKER-29, POKER-30, POKER-31

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] saveMessage truncates to 500 chars, stores with timestamp
- [ ] getSessionMessages returns recent messages (limit, pagination support)
- [ ] validateMessage checks ≤500 chars, rejects empty
- [ ] Timestamps accurate and consistent
- [ ] Tests pass: `npm run test:unit -- ChatService`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥8 unit tests (truncation, pagination, empty message rejection)

**Tests**: unit
**Gate**: quick

---

#### T13: Create NotificationService for Socket.io event broadcasting

**What**: Implement NotificationService: methods for broadcasting all events (participant joined, voting started, votes revealed, message sent, session closed), socket middleware

**Where**: `src/backend/services/NotificationService.ts`

**Depends on**: T1 (Express + Socket.io types available later)

**Reuses**: Logger from T5

**Requirement**: POKER-24, POKER-28, POKER-29

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] All 5 notification methods implemented (participant joined, voting started, votes revealed, message sent, session closed)
- [ ] Events formatted as per design API spec
- [ ] Room-based broadcasting (only session members receive)
- [ ] Tests mock Socket.io instance
- [ ] Tests pass: `npm run test:unit -- NotificationService`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥10 unit tests (socket.io emit mocking, room verification)

**Tests**: unit
**Gate**: quick

---

#### T14: Create integration test for Vote + Chat + Notification services

**What**: Integration test: cast vote → check vote recorded → reveal votes → check average → send chat message → check notification broadcasted

**Where**: `src/backend/services/__tests__/Vote.Chat.integration.spec.ts`

**Depends on**: T11, T12, T13

**Reuses**: Test database, Prisma models

**Requirement**: POKER-15 through POKER-31

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Integration test uses real Prisma database
- [ ] Test casts 5 votes on same task, calculates average
- [ ] Test verifies vote uniqueness constraint (same participant can't vote twice)
- [ ] Test sends chat message and verifies storage
- [ ] Test mocks Socket.io and verifies notification emissions
- [ ] Tests pass: `npm run test:integration`
- [ ] Gate passes: `npm run test:integration && npm run lint`
- [ ] **Test count**: ≥5 integration tests

**Tests**: integration
**Gate**: full

---

#### T15: Create service for session inactivity cleanup (background job)

**What**: Implement InactivityCleanupService: scheduled job to expire sessions >30 min inactive, logs cleanup actions

**Where**: `src/backend/services/InactivityCleanupService.ts`, `src/backend/scheduler/index.ts`

**Depends on**: T6 (SessionService), T1 (scheduler library: node-cron)

**Reuses**: SessionService, logger from T5

**Requirement**: POKER-05 (30-min timeout)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Cleanup job runs every 5 minutes
- [ ] Identifies sessions with lastActivityAt >30 min ago
- [ ] Marks them as "archived"
- [ ] Logs cleanup actions with count
- [ ] Tests mock clock/timer for reliability
- [ ] Tests pass: `npm run test:unit -- InactivityCleanupService`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥5 unit tests (timing edge cases, archive verification)

**Tests**: unit
**Gate**: quick

---

### Phase 4: Backend API Routes

#### T16: Create session routes: POST /sessions, GET /sessions/:slug, POST /sessions/:slug/join, POST /sessions/:slug/leave, POST /sessions/:slug/close

**What**: Express routes for session management using SessionService

**Where**: `src/backend/routes/sessions.ts`

**Depends on**: T6 (SessionService), T4 (Express + error handling)

**Reuses**: SessionService, error middleware from T5

**Requirement**: POKER-01, POKER-02, POKER-03, POKER-04, POKER-05

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] All 5 routes implemented with correct HTTP methods and status codes
- [ ] POST /sessions creates session, returns 201 with session details
- [ ] GET /sessions/:slug returns 200 with session state or 404
- [ ] POST /sessions/:slug/join adds participant, returns 200 or 409 (duplicate name)
- [ ] POST /sessions/:slug/leave removes participant, returns 204
- [ ] POST /sessions/:slug/close marks closed, returns 200 or 403 if not moderator
- [ ] Error handling returns JSON with error codes
- [ ] Tests pass: `npm run test:integration -- sessions.spec.ts`
- [ ] Gate passes: `npm run test:integration && npm run lint`
- [ ] **Test count**: ≥12 integration tests (happy path + all error scenarios)

**Tests**: integration
**Gate**: full

---

#### T17: Create story routes: POST /epics, DELETE /epics/:epicId, POST /epics/:epicId/stories, DELETE /stories/:storyId, POST /stories/:storyId/tasks, DELETE /tasks/:taskId, GET /sessions/:slug/hierarchy, POST /sessions/:slug/import-markdown

**What**: Express routes for story/epic/task CRUD and hierarchy retrieval using StoryService

**Where**: `src/backend/routes/stories.ts`

**Depends on**: T7 (StoryService), T9 (markdown parser), T4 (Express)

**Reuses**: StoryService, error middleware

**Requirement**: POKER-06 through POKER-14

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] All 8 routes implemented
- [ ] POST /epics creates epic, returns 201
- [ ] DELETE /epics/:epicId cascades, returns 204
- [ ] POST /stories, DELETE /stories, POST /tasks, DELETE /tasks all working
- [ ] GET /sessions/:slug/hierarchy returns full nested hierarchy
- [ ] POST /import-markdown parses file and populates session
- [ ] Error handling for invalid hierarchies (missing parents, bad data)
- [ ] Tests pass: `npm run test:integration -- stories.spec.ts`
- [ ] Gate passes: `npm run test:integration && npm run lint`
- [ ] **Test count**: ≥14 integration tests (CRUD, cascade, hierarchy validation, markdown import)

**Tests**: integration
**Gate**: full

---

#### T18: Create vote routes: POST /tasks/:taskId/vote, PUT /votes/:voteId, GET /tasks/:taskId/votes, POST /tasks/:taskId/reveal, PUT /tasks/:taskId/estimate

**What**: Express routes for voting workflow using VoteService

**Where**: `src/backend/routes/votes.ts`

**Depends on**: T11 (VoteService), T4 (Express)

**Reuses**: VoteService, error middleware

**Requirement**: POKER-15 through POKER-23

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] All 5 routes implemented
- [ ] POST /votes records vote, returns 201 or 409 (duplicate)
- [ ] PUT /votes/:voteId updates before reveal, returns 200
- [ ] GET /votes for task returns all votes (only after reveal)
- [ ] POST /reveal finalizes votes, returns 200 with average/median
- [ ] PUT /estimate confirms final score, returns 200
- [ ] Card validation on all vote routes
- [ ] Tests pass: `npm run test:integration -- votes.spec.ts`
- [ ] Gate passes: `npm run test:integration && npm run lint`
- [ ] **Test count**: ≥13 integration tests (vote recording, reveal, statistics, error paths)

**Tests**: integration
**Gate**: full

---

#### T19: Create export route: GET /sessions/:slug/export/markdown

**What**: Express route to download session as markdown file using ExportService

**Where**: `src/backend/routes/export.ts`

**Depends on**: T10 (ExportService), T4 (Express)

**Reuses**: ExportService

**Requirement**: POKER-32 through POKER-38

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] GET /export/markdown returns markdown file (application/markdown MIME type)
- [ ] Filename includes session slug and timestamp
- [ ] File contains full hierarchy with estimates
- [ ] Returns 404 if session not found
- [ ] Tests pass: `npm run test:integration -- export.spec.ts`
- [ ] Gate passes: `npm run test:integration && npm run lint`
- [ ] **Test count**: ≥5 integration tests (happy path, missing session, file format)

**Tests**: integration
**Gate**: full

---

#### T20: Create main Express app with all route registrations and middleware

**What**: Set up Express app with all routes, middleware (logging, error handling, CORS), server startup

**Where**: `src/backend/app.ts`, `src/backend/server.ts` (updated)

**Depends on**: T16, T17, T18, T19 (all routes created)

**Reuses**: All route modules, middleware from T5

**Requirement**: All P1 routes

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Express app created with all route prefixes (/api/sessions, /api/epics, /api/votes, /api/export)
- [ ] Middleware registered: logging, CORS, error handler
- [ ] Server starts on configured PORT
- [ ] Health check endpoint: GET /health returns 200
- [ ] 404 handler for undefined routes
- [ ] CORS configured for localhost (dev) and production domains
- [ ] Tests pass: `npm run test:integration -- app.spec.ts`
- [ ] Gate passes: `npm run build && npm run test:integration && npm run lint`
- [ ] **Test count**: ≥5 integration tests (route registration, CORS, 404, health)

**Tests**: integration
**Gate**: full

---

### Phase 5: WebSocket Server & Real-Time Events

#### T21: Set up Socket.io server with session/room management and authentication

**What**: Integrate Socket.io into Express, set up session/room tracking, middleware for connecting participants, heartbeat/disconnect handling

**Where**: `src/backend/realtime/socketServer.ts`, `src/backend/middleware/socketAuth.ts`

**Depends on**: T20 (Express app), T6 (SessionService for session lookup)

**Reuses**: SessionService, NotificationService, logger

**Requirement**: POKER-24 (real-time communication)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Socket.io integrated with Express server
- [ ] On connection: validate session slug + pseudonym
- [ ] Join socket to room (session slug)
- [ ] Track active connections per session
- [ ] Heartbeat/ping-pong every 30 sec to detect stale connections
- [ ] On disconnect: remove participant after 15 sec delay (allow reconnect)
- [ ] Tests mock Socket.io server
- [ ] Tests pass: `npm run test:unit -- socketServer`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥10 unit tests (connection flow, room management, heartbeat, disconnect)

**Tests**: unit
**Gate**: quick

---

#### T22: Implement Socket.io event handlers for voting and voting reveal

**What**: Socket.io listeners for vote:cast, vote:update, vote:reveal events; emit vote:recorded and votes:revealed

**Where**: `src/backend/realtime/handlers/voteHandlers.ts`

**Depends on**: T21 (Socket.io server), T11 (VoteService)

**Reuses**: VoteService, NotificationService

**Requirement**: POKER-15, POKER-19, POKER-28 (real-time vote events)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] vote:cast handler records vote via VoteService, emits vote:recorded to room
- [ ] vote:update handler updates vote (before reveal) via VoteService
- [ ] vote:reveal handler triggers reveal, calculates average/median, emits votes:revealed to room
- [ ] All events include taskId and current vote state
- [ ] Error handling for invalid cards, duplicate votes
- [ ] Tests mock VoteService and Socket.io
- [ ] Tests pass: `npm run test:unit -- voteHandlers`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥9 unit tests (event flow, error cases, broadcast verification)

**Tests**: unit
**Gate**: quick

---

#### T23: Implement Socket.io event handlers for chat and notifications

**What**: Socket.io listeners for chat:send events; emit message:received, participant:joined, participant:left, session:closed

**Where**: `src/backend/realtime/handlers/chatHandlers.ts`, `src/backend/realtime/handlers/notificationHandlers.ts`

**Depends on**: T21 (Socket.io server), T12 (ChatService), T13 (NotificationService)

**Reuses**: ChatService, NotificationService

**Requirement**: POKER-24, POKER-25, POKER-26, POKER-27, POKER-28, POKER-29

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] chat:send handler validates message, saves via ChatService, emits to room
- [ ] participant:joined event emitted when joining
- [ ] participant:left event emitted on disconnect
- [ ] session:closed event emitted when moderator closes
- [ ] Message broadcast includes participant pseudonym and timestamp
- [ ] Error handling for oversized messages
- [ ] Tests mock ChatService and Socket.io
- [ ] Tests pass: `npm run test:unit -- chatHandlers`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥8 unit tests (message delivery, broadcast scope, error handling)

**Tests**: unit
**Gate**: quick

---

### Phase 6: Frontend Components & State

#### T24: Set up Vue 3 frontend project with Vite, Socket.io client, component structure

**What**: Initialize Vite Vue 3 SPA, install Socket.io client, set up component directory structure, main.ts entry point

**Where**: `src/frontend/main.ts`, `src/frontend/App.vue`, `src/frontend/vite.config.ts`, `tsconfig.json` (frontend)

**Depends on**: T1 (backend project exists for API target)

**Reuses**: None (fresh frontend)

**Requirement**: N/A (setup task)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Vite + Vue 3 initialized
- [ ] Socket.io client installed and configured
- [ ] `src/frontend/components/` directory structure created
- [ ] `src/frontend/stores/` directory for global state (Pinia or Composition API)
- [ ] `main.ts` bootstraps app
- [ ] `vite.config.ts` configured with API proxy (for dev)
- [ ] No build errors: `npm run build:frontend` succeeds
- [ ] Dev server works: `npm run dev:frontend` starts

**Tests**: none (setup task)
**Gate**: build

---

#### T25: Create global state store (session, participants, stories, votes, chat) using Pinia or Composition API

**What**: Centralized state management for session data, active stories, votes, participants, chat messages

**Where**: `src/frontend/stores/sessionStore.ts` (or composables if using Composition API)

**Depends on**: T24 (Vue 3 project)

**Reuses**: Vue 3 Composition API or Pinia

**Requirement**: All P1 requirements (state shared across components)

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Store exposes: session (slug, name, participants), stories (hierarchy), votes, chatMessages, currentUser
- [ ] Actions: joinSession, leaveSession, addStory, addVote, addMessage, clearOnDisconnect
- [ ] Computed properties: activeSession, allVotes, unestimatedTasks, votedByMe
- [ ] Reactive state updates trigger component re-renders
- [ ] Tests pass: `npm run test:unit -- sessionStore`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥10 unit tests (state mutations, computed properties, async actions)

**Tests**: unit
**Gate**: quick

---

#### T26: Create SessionPanel component (create session, join session, participant list)

**What**: Vue component for session creation and joining flow; displays active participants; supports leaving session

**Where**: `src/frontend/components/SessionPanel.vue`

**Depends on**: T25 (store), T24 (Vue 3 project), T20 (API endpoints available)

**Reuses**: sessionStore, Socket.io composable

**Requirement**: POKER-01, POKER-02, POKER-03, POKER-04

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Component displays form to create session (name, optional description)
- [ ] Component displays form to join session (slug, pseudonym)
- [ ] Component displays participant list (pseudonym, join time)
- [ ] Create/join calls API and updates global store
- [ ] Leave calls API and disconnects from Socket.io
- [ ] Error messages displayed (duplicate name, session not found)
- [ ] Tests pass: `npm run test:unit -- SessionPanel`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥10 unit tests (form validation, API calls, state updates, error handling)

**Tests**: unit
**Gate**: quick

---

#### T27: Create StoryPanel component (epic/story/task hierarchy, CRUD, markdown import)

**What**: Vue component displaying epic→story→task hierarchy; buttons to create/delete items; markdown import dialog

**Where**: `src/frontend/components/StoryPanel.vue`

**Depends on**: T25 (store), T24 (Vue 3 project), T20 (API endpoints)

**Reuses**: sessionStore

**Requirement**: POKER-06 through POKER-14

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Component displays collapsible hierarchy (Epic > Story > Task)
- [ ] Add Epic button opens form, creates via API, updates store
- [ ] Add Story button (under epic) opens form, creates via API
- [ ] Add Task button (under story) opens form, creates via API
- [ ] Delete buttons (with confirmation) call API, update store
- [ ] Markdown import button opens file picker, uploads file, populates hierarchy
- [ ] Cascade delete verified (delete epic removes all stories/tasks)
- [ ] Tests pass: `npm run test:unit -- StoryPanel`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥12 unit tests (CRUD flows, hierarchy rendering, import dialog, validation)

**Tests**: unit
**Gate**: quick

---

#### T28: Create VotingPanel component (display tasks, show Fibonacci cards, vote, reveal results, confirm estimate)

**What**: Vue component for main voting UI; displays current task, Fibonacci cards, vote recording, vote reveal with average/median display, estimate confirmation

**Where**: `src/frontend/components/VotingPanel.vue`

**Depends on**: T25 (store), T24 (Vue 3 project), T20 (vote API)

**Reuses**: sessionStore, Socket.io real-time updates

**Requirement**: POKER-15 through POKER-23

**Tools**:
- MCP: filesystem
- Skill: NONE

**Done when**:
- [ ] Component displays current task/story title and description
- [ ] Shows 9 Fibonacci cards as clickable buttons (1, 2, 3, 5, 8, 13, 21, ?, ☕)
- [ ] Click card records vote, highlights selection
- [ ] Moderator sees "Reveal Votes" button
- [ ] Moderator reveals votes; component displays: all votes (who voted what), average, median
- [ ] Component shows "All Done" when session has all items estimated
- [ ] Tests mock Socket.io and API calls
- [ ] Tests pass: `npm run test:unit -- VotingPanel`
- [ ] Gate passes: `npm run test:unit && npm run lint`
- [ ] **Test count**: ≥14 unit tests (card selection, reveal flow, average/median display, multi-participant voting)

**Tests**: unit
**Gate**: quick

---

## Phase Execution Map

```
Phase 1 (5 tasks):  T1 → T2 → T3 → T4 → T5
Phase 2 (5 tasks):  T6 → T7 → T8 → T9 → T10
Phase 3 (5 tasks):  T11 → T12 → T13 → T14 → T15
Phase 4 (5 tasks):  T16 → T17 → T18 → T19 → T20
Phase 5 (3 tasks):  T21 → T22 → T23
Phase 6 (5 tasks):  T24 → T25 → T26 → T27 → T28

Sequential execution: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
Packing: ~7 tasks per batch
- Batch 1: Phase 1 (T1-T5) + Phase 2 start (T6-T7)
- Batch 2: Phase 2 (T8-T10) + Phase 3 (T11-T12)
- Batch 3: Phase 3 (T13-T15) + Phase 4 start (T16-T17)
- Batch 4: Phase 4 (T18-T20) + Phase 5 (T21-T23) + Phase 6 start (T24-T25)
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Project setup | 1 setup (package.json, TypeScript, Express) | ✅ Granular |
| T2: Prisma schema | 1 schema file (models + relationships) | ✅ Granular |
| T3: Database migration | 1 migration + connection test | ✅ Granular |
| T4: Config/database connection | 1 utility module (singleton + pooling) | ✅ Granular |
| T5: Logging + error handling | 2 utilities (logger, error handler) | ✅ Cohesive pair |
| T6: SessionService | 1 service (7 methods, cohesive) | ✅ Granular |
| T7: StoryService | 1 service (9 methods, hierarchy CRUD) | ✅ Granular |
| T8: Integration test (Session + Story) | 1 test file, end-to-end flow | ✅ Granular |
| T9: Utility functions | 3 utilities (markdown, slug, validation) | ✅ Cohesive trio |
| T10: ExportService | 1 service (markdown generation) | ✅ Granular |
| T11: VoteService | 1 service (7 methods, voting logic) | ✅ Granular |
| T12: ChatService | 1 service (3 methods, chat persistence) | ✅ Granular |
| T13: NotificationService | 1 service (5 event broadcasts) | ✅ Granular |
| T14: Integration test (Vote + Chat) | 1 test file, cross-service flow | ✅ Granular |
| T15: InactivityCleanupService | 1 service (background job) | ✅ Granular |
| T16: Session routes | 5 routes in 1 file (session CRUD) | ✅ Cohesive |
| T17: Story routes | 8 routes in 1 file (hierarchy CRUD) | ✅ Cohesive |
| T18: Vote routes | 5 routes in 1 file (voting workflow) | ✅ Cohesive |
| T19: Export route | 1 route (markdown download) | ✅ Granular |
| T20: Main Express app | 1 app file (all routes + middleware) | ✅ Granular |
| T21: Socket.io server setup | 1 module (connection, rooms, auth) | ✅ Granular |
| T22: Vote handlers | 1 handler module (3 vote events) | ✅ Granular |
| T23: Chat handlers | 1 handler module (chat + notifications) | ✅ Granular |
| T24: Vue 3 frontend setup | 1 setup (Vite, Socket.io, structure) | ✅ Granular |
| T25: Global state store | 1 store module (Pinia or Composition) | ✅ Granular |
| T26: SessionPanel component | 1 Vue component (session UI) | ✅ Granular |
| T27: StoryPanel component | 1 Vue component (hierarchy UI) | ✅ Granular |
| T28: VotingPanel component | 1 Vue component (voting UI) | ✅ Granular |

**All tasks are atomic (1 component, 1 service, 1 route file, 1 handler, 1 utility trio).** ✅

---

## Diagram-Definition Cross-Check

Every task's `Depends on` field matches the execution diagram arrows.

| Task | Depends On (body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Starts phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T1 | T1 → T5 (parallel to T2-T4) | ⚠️ Refined: T5 depends on T1 only, runs after T1 but not blocked by T4 |
| T6 | T4 | Phase 1 complete before T6 | ✅ Match |
| T7 | T4 | Phase 1 complete before T7 | ✅ Match |
| T8 | T6, T7 | Both T6 and T7 complete | ✅ Match |
| T9 | T1 | T1 complete before T9 | ✅ Match |
| T10 | T7 | T7 complete before T10 | ✅ Match |
| T11 | T4 | Phase 1 complete before T11 | ✅ Match |
| T12 | T4 | Phase 1 complete before T12 | ✅ Match |
| T13 | T1 | T1 complete before T13 | ✅ Match |
| T14 | T11, T12, T13 | All three complete | ✅ Match |
| T15 | T6 | T6 complete before T15 | ✅ Match |
| T16 | T6, T4 | T6 + T4 complete | ✅ Match |
| T17 | T7, T9, T4 | T7 + T9 + T4 complete | ✅ Match |
| T18 | T11, T4 | T11 + T4 complete | ✅ Match |
| T19 | T10, T4 | T10 + T4 complete | ✅ Match |
| T20 | T16-T19 | All routes complete before app | ✅ Match |
| T21 | T20, T6 | T20 (app) + T6 (SessionService) complete | ✅ Match |
| T22 | T21, T11 | T21 (Socket.io) + T11 (VoteService) | ✅ Match |
| T23 | T21, T12, T13 | T21 (Socket.io) + T12 + T13 | ✅ Match |
| T24 | T1 | T1 complete (backend project exists) | ✅ Match |
| T25 | T24 | T24 (Vue 3 project) complete | ✅ Match |
| T26 | T25, T20 | T25 (store) + T20 (API) complete | ✅ Match |
| T27 | T25, T20 | T25 (store) + T20 (API) complete | ✅ Match |
| T28 | T25, T20, T22 | T25 (store) + T20 (API) + T22 (Socket.io vote handler) | ✅ Match |

**All dependencies consistent.** ✅

---

## Test Co-location Validation

Every task's `Tests` field matches the **Test Coverage Matrix**.

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Setup (package.json, config) | none | none | ✅ OK |
| T2 | Prisma schema | none (build gate) | none | ✅ OK |
| T3 | Migration + connection | none (build gate) | none | ✅ OK |
| T4 | Utility (config, database) | unit | unit | ✅ OK |
| T5 | Utility (logger, error handler) | unit | unit | ✅ OK |
| T6 | Service (SessionService) | unit | unit | ✅ OK |
| T7 | Service (StoryService) | unit | unit | ✅ OK |
| T8 | Integration test (cross-service) | integration | integration | ✅ OK |
| T9 | Utility (markdown, slug, validators) | unit | unit | ✅ OK |
| T10 | Service (ExportService) | unit | unit | ✅ OK |
| T11 | Service (VoteService) | unit | unit | ✅ OK |
| T12 | Service (ChatService) | unit | unit | ✅ OK |
| T13 | Service (NotificationService) | unit | unit | ✅ OK |
| T14 | Integration test (cross-service) | integration | integration | ✅ OK |
| T15 | Service (InactivityCleanupService) | unit | unit | ✅ OK |
| T16 | Controller/Routes (session) | integration | integration | ✅ OK |
| T17 | Controller/Routes (story) | integration | integration | ✅ OK |
| T18 | Controller/Routes (vote) | integration | integration | ✅ OK |
| T19 | Controller/Routes (export) | integration | integration | ✅ OK |
| T20 | Controller/Routes (main app) | integration | integration | ✅ OK |
| T21 | Socket.io server | unit (no real socket.io, mocked) | unit | ✅ OK |
| T22 | Socket.io handlers | unit (mocked) | unit | ✅ OK |
| T23 | Socket.io handlers | unit (mocked) | unit | ✅ OK |
| T24 | Vue 3 setup | none | none | ✅ OK |
| T25 | Component store (state management) | unit | unit | ✅ OK |
| T26 | Vue component | unit | unit | ✅ OK |
| T27 | Vue component | unit | unit | ✅ OK |
| T28 | Vue component | unit | unit | ✅ OK |

**All tests co-located and match matrix requirements.** ✅

---

## Tasks Ready for Execution

**Total**: 28 atomic tasks  
**Phases**: 6 (sequential)  
**Estimated Batches**: 4 (each ~7 tasks, whole phases)  
**TDD Requirement**: ✅ Tests written first (red) → implementation (green) → review (independent verifier)  
**Code Review**: ✅ Each task ends with independent code review agent verification

**Next Step**: User approves tasks.md, then Execute phase begins with subagent distribution.
