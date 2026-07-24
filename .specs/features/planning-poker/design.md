# Planning Poker App - Design

**Spec**: `.specs/features/planning-poker/spec.md`  
**Status**: Draft → Approved  
**TDD Approach**: Tests first, implementation second, code review by independent verifier

---

## Architecture Overview

Three-tier architecture optimized for real-time collaboration:

```
┌─────────────────────────────────────────────────────────┐
│         VUE 3 FRONTEND (Composition API + Vite)         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Session    │  │   Voting     │  │   Chat       │  │
│  │  Management  │  │   Panel      │  │   Component  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│              WebSocket (Socket.io client)               │
└─────────────────────────────────────────────────────────┘
                         ↓ (real-time events)
┌─────────────────────────────────────────────────────────┐
│      EXPRESS.JS BACKEND + SOCKET.IO SERVER              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Session     │  │  Vote        │  │  Chat        │  │
│  │  Service     │  │  Service     │  │  Service     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│              Prisma ORM (data access layer)             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│    POSTGRESQL DATABASE (persistent storage)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Sessions   │  │   Stories    │  │   Votes      │  │
│  │   (with TTL) │  │   (hierarchical) │  (transient) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Key Design Patterns**:
- **Reactive state**: Vue 3 Composition API for component reactivity
- **Event-driven**: Socket.io for real-time event broadcasting
- **Service layer**: Centralized business logic (Session, Vote, Chat services)
- **ORM**: Prisma for type-safe database queries
- **TDD-first**: All services tested before implementation

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --- | --- | --- |
| None | N/A | Fresh project — no existing code to reuse |

### Integration Points

| System | Integration Method |
| --- | --- |
| PostgreSQL | Prisma ORM with schema migrations |
| WebSocket | Socket.io for bi-directional real-time communication |
| CLI/Build | Vite for Vue 3 SPA, Node.js with Express for backend |

---

## Components

### Frontend Components (Vue 3)

#### SessionPanel

- **Purpose**: Manage session creation, joining, and participant list
- **Location**: `src/frontend/components/SessionPanel.vue`
- **Interfaces**:
  - `createSession(name: string, description?: string): Promise<Session>` - Create new session
  - `joinSession(slug: string, pseudonym: string): Promise<void>` - Join existing session
  - `leaveSession(): void` - Disconnect from session
  - `getParticipants(): Participant[]` - List active participants
- **Dependencies**: Socket.io client, Session store
- **Reuses**: Vue 3 Composition API patterns
- **Tests**: Unit tests for state changes, integration tests with mock socket

#### StoryPanel

- **Purpose**: Display epic→story→task hierarchy and manage story creation/deletion
- **Location**: `src/frontend/components/StoryPanel.vue`
- **Interfaces**:
  - `addEpic(title: string, description?: string): Promise<Epic>` - Create epic
  - `addStory(epicId: string, title: string, description?: string): Promise<Story>` - Create story under epic
  - `addTask(storyId: string, title: string, description?: string): Promise<Task>` - Create task under story
  - `deleteEpic(epicId: string): Promise<void>` - Delete epic and cascade
  - `deleteStory(storyId: string): Promise<void>` - Delete story and cascade
  - `deleteTask(taskId: string): Promise<void>` - Delete task
  - `importMarkdown(file: File): Promise<void>` - Parse markdown and populate
  - `getHierarchy(): Epic[]` - Get current hierarchy
- **Dependencies**: API service, reactive store
- **Tests**: Unit tests for hierarchy validation, integration tests for CRUD operations

#### VotingPanel

- **Purpose**: Display Fibonacci cards, record votes, show results
- **Location**: `src/frontend/components/VotingPanel.vue`
- **Interfaces**:
  - `castVote(storyId: string, taskId: string, card: string): Promise<void>` - Record participant vote
  - `changeVote(storyId: string, taskId: string, card: string): Promise<void>` - Update vote before reveal
  - `revealVotes(storyId: string, taskId: string): Promise<VoteResult>` - Show all votes + average
  - `confirmEstimate(storyId: string, taskId: string, finalScore: number): Promise<void>` - Finalize score
  - `getVoteResult(): VoteResult` - Get current vote state
- **Dependencies**: Socket.io, Vote service
- **Tests**: Unit tests for vote recording, integration tests for reveal logic, E2E for multi-participant voting

#### ChatPanel

- **Purpose**: Display chat messages and allow real-time messaging
- **Location**: `src/frontend/components/ChatPanel.vue`
- **Interfaces**:
  - `sendMessage(text: string): Promise<void>` - Broadcast message to session
  - `getMessages(): Message[]` - Fetch session chat history
  - `onMessageReceived(callback): void` - Listen for new messages
- **Dependencies**: Socket.io client, Message store
- **Tests**: Unit tests for message formatting, integration tests for real-time delivery

#### SessionExport

- **Purpose**: Export session data to markdown file
- **Location**: `src/frontend/components/SessionExport.vue`
- **Interfaces**:
  - `exportMarkdown(session: Session): string` - Generate markdown content
  - `downloadFile(content: string, filename: string): void` - Trigger browser download
- **Dependencies**: None (pure utility)
- **Tests**: Unit tests for markdown generation, edge cases for special characters

---

### Backend Services (Node.js + Express)

#### SessionService

- **Purpose**: Manage session lifecycle (create, join, leave, archive, expire)
- **Location**: `src/backend/services/SessionService.ts`
- **Interfaces**:
  - `createSession(name: string, description?: string, moderatorId: string): Promise<Session>` - Create and return session
  - `getSession(slug: string): Promise<Session | null>` - Fetch session by slug
  - `joinSession(sessionId: string, participantId: string, pseudonym: string): Promise<Participant>` - Add participant
  - `leaveSession(sessionId: string, participantId: string): Promise<void>` - Remove participant
  - `expireInactiveSessions(minutes: number): Promise<void>` - Cleanup stale sessions
  - `closeSession(sessionId: string): Promise<void>` - Mark session as closed
  - `generateUniqueSlug(): string` - Generate collision-free slug
- **Dependencies**: Prisma (database), Logger
- **Tests**: Unit tests for business logic, database mocks for CRUD, integration tests with real DB

#### StoryService

- **Purpose**: Manage stories, epics, tasks (CRUD and hierarchy)
- **Location**: `src/backend/services/StoryService.ts`
- **Interfaces**:
  - `createEpic(sessionId: string, title: string, description?: string): Promise<Epic>` - Create epic
  - `createStory(epicId: string, title: string, description?: string): Promise<Story>` - Create story
  - `createTask(storyId: string, title: string, description?: string): Promise<Task>` - Create task
  - `deleteEpic(epicId: string): Promise<void>` - Cascade delete stories + tasks
  - `deleteStory(storyId: string): Promise<void>` - Cascade delete tasks
  - `deleteTask(taskId: string): Promise<void>` - Delete task only
  - `getSessionHierarchy(sessionId: string): Promise<Epic[]>` - Full hierarchy
  - `updateEstimate(taskId: string, estimate: number): Promise<void>` - Finalize score
  - `parseMarkdownImport(content: string, sessionId: string): Promise<void>` - Parse and populate from markdown
- **Dependencies**: Prisma, Logger
- **Tests**: Unit tests for hierarchy validation, tests for cascade delete, markdown parser tests

#### VoteService

- **Purpose**: Manage voting (record, reveal, calculate statistics)
- **Location**: `src/backend/services/VoteService.ts`
- **Interfaces**:
  - `recordVote(sessionId: string, storyId: string, taskId: string, participantId: string, card: string): Promise<Vote>` - Record vote
  - `updateVote(voteId: string, card: string): Promise<Vote>` - Change vote before reveal
  - `getAllVotes(sessionId: string, storyId: string, taskId: string): Promise<Vote[]>` - Fetch votes for reveal
  - `calculateAverage(votes: Vote[]): number` - Compute average (ignores ?, coffee)
  - `calculateMedian(votes: Vote[]): number` - Compute median
  - `hasAllVoted(sessionId: string, taskId: string): boolean` - Check if all participants voted
- **Dependencies**: Prisma, Logger
- **Tests**: Unit tests for average/median calculations, tests for vote validation

#### ChatService

- **Purpose**: Persist and retrieve chat messages
- **Location**: `src/backend/services/ChatService.ts`
- **Interfaces**:
  - `saveMessage(sessionId: string, participantId: string, text: string): Promise<Message>` - Store message
  - `getSessionMessages(sessionId: string, limit?: number): Promise<Message[]>` - Fetch message history
- **Dependencies**: Prisma, Logger
- **Tests**: Unit tests for message truncation/validation, tests for history retrieval

#### ExportService

- **Purpose**: Generate markdown from session data
- **Location**: `src/backend/services/ExportService.ts`
- **Interfaces**:
  - `generateMarkdown(sessionId: string): Promise<string>` - Build markdown from session hierarchy + estimates
  - `formatMarkdownEpic(epic: Epic): string` - Format epic section
  - `formatMarkdownStory(story: Story, indent: string): string` - Format story section
  - `formatMarkdownTask(task: Task, indent: string): string` - Format task section
- **Dependencies**: None (data-to-text transformation)
- **Tests**: Unit tests for markdown structure, edge cases (special chars, long titles)

#### NotificationService

- **Purpose**: Broadcast real-time events via Socket.io
- **Location**: `src/backend/services/NotificationService.ts`
- **Interfaces**:
  - `notifyParticipantJoined(sessionId: string, participant: Participant): void` - Broadcast participant joined
  - `notifyVotingStarted(sessionId: string, item: Story | Task): void` - Broadcast voting opened
  - `notifyVotesRevealed(sessionId: string, item: Story | Task, result: VoteResult): void` - Broadcast vote reveal
  - `notifyMessageSent(sessionId: string, message: Message): void` - Broadcast chat message
  - `notifySessionClosed(sessionId: string): void` - Broadcast session closure
- **Dependencies**: Socket.io server instance
- **Tests**: Unit tests mocking socket.io emit calls

---

## Data Models (Prisma Schema)

### Session

```prisma
model Session {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  description String?
  moderatorId String
  participants Participant[]
  epics     Epic[]
  messages  Message[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastActivityAt DateTime @default(now())
  status    String   @default("active") // active, closed, archived
  
  @@index([slug])
  @@index([lastActivityAt])
}

model Participant {
  id        String   @id @default(cuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  pseudonym String
  votes     Vote[]
  messages  Message[]
  joinedAt  DateTime @default(now())
  
  @@unique([sessionId, pseudonym])
  @@index([sessionId])
}

model Epic {
  id        String   @id @default(cuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  title     String
  description String?
  stories   Story[]
  order     Int      // For manual ordering
  createdAt DateTime @default(now())
  
  @@index([sessionId])
}

model Story {
  id        String   @id @default(cuid())
  epicId    String
  epic      Epic     @relation(fields: [epicId], references: [id], onDelete: Cascade)
  title     String
  description String?
  tasks     Task[]
  order     Int      // For manual ordering
  createdAt DateTime @default(now())
  
  @@index([epicId])
}

model Task {
  id        String   @id @default(cuid())
  storyId   String
  story     Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  title     String
  description String?
  estimate  Int?     // Final estimate in points
  votes     Vote[]
  status    String   @default("pending") // pending, voting, estimated
  order     Int      // For manual ordering
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([storyId])
}

model Vote {
  id          String   @id @default(cuid())
  taskId      String
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  participantId String
  participant Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  card        String   // "1", "2", "3", "5", "8", "13", "21", "?", "coffee"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([taskId, participantId])
  @@index([taskId])
}

model Message {
  id          String   @id @default(cuid())
  sessionId   String
  session     Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  participantId String
  participant Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  text        String   @db.VarChar(500)
  createdAt   DateTime @default(now())
  
  @@index([sessionId, createdAt])
}
```

**Relationships**:
- Session → Participant (1:many)
- Session → Epic (1:many)
- Epic → Story (1:many)
- Story → Task (1:many)
- Task → Vote (1:many)
- Participant → Vote (1:many)
- Session → Message (1:many)
- Participant → Message (1:many)

---

## API Endpoints (REST + WebSocket)

### REST Endpoints

**Session Management**:
- `POST /api/sessions` - Create session (moderator)
- `GET /api/sessions/:slug` - Get session details
- `POST /api/sessions/:slug/join` - Join session (participant)
- `POST /api/sessions/:slug/leave` - Leave session
- `POST /api/sessions/:slug/close` - Close session (moderator only)

**Stories & Hierarchy**:
- `POST /api/sessions/:slug/epics` - Create epic
- `DELETE /api/epics/:epicId` - Delete epic (cascade)
- `POST /api/epics/:epicId/stories` - Create story
- `DELETE /api/stories/:storyId` - Delete story (cascade)
- `POST /api/stories/:storyId/tasks` - Create task
- `DELETE /api/tasks/:taskId` - Delete task
- `GET /api/sessions/:slug/hierarchy` - Get full hierarchy
- `POST /api/sessions/:slug/import-markdown` - Import from markdown file

**Voting**:
- `POST /api/tasks/:taskId/vote` - Cast vote
- `PUT /api/votes/:voteId` - Update vote (before reveal)
- `GET /api/tasks/:taskId/votes` - Get all votes for task
- `POST /api/tasks/:taskId/reveal` - Finalize and reveal votes
- `PUT /api/tasks/:taskId/estimate` - Confirm final score

**Export**:
- `GET /api/sessions/:slug/export/markdown` - Download markdown file

**Chat** (via WebSocket):
- `message:send` → `message:received` - Send and receive messages

### WebSocket Events

**Client → Server**:
- `vote:cast` - {taskId, card}
- `vote:update` - {voteId, card}
- `vote:reveal` - {taskId}
- `chat:send` - {text}
- `session:leave` - {}
- `ping` - heartbeat

**Server → Client**:
- `session:joined` - {participants, hierarchy}
- `participant:joined` - {participant}
- `participant:left` - {participantId}
- `vote:recorded` - {taskId, participantCount, hasAllVoted}
- `vote:updated` - {voteId, taskId}
- `votes:revealed` - {taskId, votes, average, median}
- `task:estimated` - {taskId, finalScore}
- `chat:message` - {participantId, pseudonym, text, timestamp}
- `notification:voting-started` - {item}
- `pong` - heartbeat response

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| --- | --- | --- |
| Session not found | 404 Not Found | User sees "Session expired or invalid" |
| Participant not in session | 403 Forbidden | User cannot vote/chat |
| Invalid Fibonacci card | 400 Bad Request | Vote rejected with "Invalid card" message |
| Duplicate pseudonym | 409 Conflict | Prompt to choose different name |
| WebSocket disconnect | Auto-reconnect (exponential backoff, max 5 retries) | Temporary "Reconnecting..." overlay; restore state on reconnect |
| Chat message >500 chars | Truncate + notify | Message sent truncated with notification |
| Session inactive >30min | Archive session | User sees "Session archived" and cannot vote |
| Database connection loss | Graceful degradation (read-only mode) | Display "Connection lost, data is read-only" banner |
| Vote collision (same task, same participant, simultaneous updates) | Last-write-wins | Participant sees latest vote reflected |

---

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| WebSocket scalability | Socket.io server | High: Real-time at scale requires proper connection management | Use Socket.io adapter for clustering (Redis); implement connection pooling |
| Session state sync race conditions | VoteService, StoryService | Medium: Concurrent vote updates + story creation could corrupt state | Implement optimistic locking or database-level constraints (unique constraints on (taskId, participantId)) |
| Large markdown imports | StoryService.parseMarkdownImport | Medium: Parsing >1000 items could block server | Implement async queue for markdown processing; show progress UI |
| Chat message storage growth | Message model | Low: 1M messages @ 200 bytes = 200MB, manageable | Archive messages >90 days; implement pagination (limit to 100 recent) |
| Inactivity timeout precision | Session cleanup job | Low: 30-min timeout may be ±1 min depending on job interval | Run cleanup job every 5 minutes; log all expirations |
| Export markdown special characters | ExportService | Low: Unescaped markdown syntax (e.g., `#`, `*`) could break structure | Escape special chars; wrap titles in code blocks if needed |
| Missing test coverage for WebSocket events | All services | High: Real-time logic untested = production bugs likely | Mock Socket.io in all tests; use integration tests with real socket connection; measure coverage >90% |
| Duplicate session slugs (collision) | SessionService.generateUniqueSlug | Low: Probability ~1 in 10^12 for short alphanumeric slugs, but must handle | Retry slug generation on collision; log collisions |

---

## TDD Strategy

Every component and service is designed to be **testable from day one**:

### Frontend (Vue 3)

1. **Unit Tests** (Vitest): Component logic, state changes, computed properties
2. **Integration Tests**: Component + Socket.io mock; verify real-time updates
3. **E2E Tests** (Playwright): Multi-participant flows (join → vote → reveal)

### Backend (Node.js)

1. **Unit Tests** (Jest): Service methods with mocked Prisma
2. **Integration Tests**: Service + real database (test container); verify business logic
3. **API Tests**: REST endpoints + status codes + error handling

### Key Test Fixtures

- Mock Socket.io instance for event testing
- Prisma mock/test database
- Factory functions for Session/Epic/Story/Task/Participant objects
- Seeded database snapshots for consistent test data

---

## Tech Decisions (Feature-Local)

| Decision | Choice | Rationale |
| --- | --- | --- |
| Frontend framework | Vue 3 + Composition API | User preference; reactive state management; good for real-time UI |
| WebSocket library | Socket.io (fallback to polling) | Easy multi-room support; automatic reconnection; works with Express |
| ORM | Prisma | Type-safe queries; automatic migrations; excellent relation support for hierarchy |
| Testing backend | Jest + Supertest (for REST) | Industry standard; good async support; easy mocking |
| Testing frontend | Vitest + Playwright | Fast unit tests; real-world E2E coverage |
| Message queue | None (direct WebSocket broadcast) | MVP scope: simple broadcast sufficient; async queue can be added if bottleneck |
| Build tool | Vite (frontend) | Fast dev server; tree-shaking; modern ES modules |
| Environment | Node.js 18+ | LTS; good async/await support; excellent WebSocket ecosystem |

---

## Architectural Constraints (from STATE.md Decisions)

Must conform to:
- **AD-001**: Vue.js + Node.js + PostgreSQL ✅
- **AD-002**: No authentication, pseudonym-based ✅
- **AD-003**: Slug-based session URLs ✅
- **AD-004**: WebSocket for real-time ✅
- **AD-005**: Fibonacci 1-21 + ? + ☕ ✅
- **AD-006**: All votes visible to all participants ✅
- **AD-007**: 30-min inactivity timeout ✅
- **AD-008**: Integrated chat on voting screen ✅
- **AD-009**: Markdown export format ✅
- **AD-010**: Moderator cannot override votes ✅

---

## Next Steps: Tasks Phase

Design is complete. Ready to break into **atomic tasks** with:
- Clear test scenarios (WHEN/THEN/ASSERT)
- Testability requirements (mock points, fixtures)
- Acceptance criteria mapped to requirement IDs (POKER-01, etc.)
- Dependency order for subagent parallelization

Expected task count: ~25-30 atomic tasks (fits 3-4 subagent worker batches)
