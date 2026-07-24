# Planning Poker App - Project State

## Decisions Log

### AD-001: Tech Stack Selection
- **Decision**: Vue.js (frontend) + Node.js/Express (backend) + PostgreSQL (database)
- **Rationale**: User preference; Vue enables reactive real-time UI; Node/Express simplifies WebSocket integration; PostgreSQL provides relational structure for epic→story→task hierarchy
- **Date**: 2026-07-24
- **Impact**: All frontend/backend architecture decisions flow from this

### AD-002: Authentication Model
- **Decision**: No authentication required; pseudonym-based identification only
- **Rationale**: MVP speed; squad is co-located and trusted; simplifies onboarding
- **Date**: 2026-07-24
- **Trade-off**: No user account persistence; name collisions possible within session scope

### AD-003: Session Access Pattern
- **Decision**: Slug-based URL routing (e.g., `/session/team-sprint-42`)
- **Rationale**: Simple, memorable, shareable; avoids UUID complexity
- **Date**: 2026-07-24
- **Constraint**: Must ensure slug uniqueness; collisions handled via regeneration

### AD-004: Real-Time Communication
- **Decision**: WebSocket (ws://) for chat and voting events; fallback to polling if needed
- **Rationale**: <500ms latency requirement; supports true real-time chat and notifications
- **Date**: 2026-07-24
- **Implementation**: Socket.io or ws library (TBD in design phase)

### AD-005: Voting Card Deck
- **Decision**: Fibonacci 1, 2, 3, 5, 8, 13, 21 + "?" + "☕ Coffee Break"
- **Rationale**: Standard planning poker deck; option symbols support discussions
- **Date**: 2026-07-24
- **Scope**: P1 MVP only; custom decks deferred to P2

### AD-006: Vote Visibility
- **Decision**: All votes and average/median displayed to all participants
- **Rationale**: Transparency builds consensus; average helps moderator decide final score
- **Date**: 2026-07-24
- **Trade-off**: No anonymous voting; assumes trusted squad environment

### AD-007: Inactivity Timeout
- **Decision**: 30 minutes of zero WebSocket activity → session marked archived
- **Rationale**: Prevents orphaned sessions; user-specified requirement
- **Date**: 2026-07-24
- **Implementation**: Server-side heartbeat + cleanup job

### AD-008: Chat Integration
- **Decision**: Chat lives in the voting screen (same panel), not separate tab
- **Rationale**: Reduces context switching; discussion stays with estimation
- **Date**: 2026-07-24
- **UI Layout**: TBD in design phase

### AD-009: Export Format
- **Decision**: Markdown (not JSON, CSV, or XML)
- **Rationale**: Human-readable; integrates with most documentation systems
- **Structure**: `# Epic\n## Story (est: X)\n### Task (est: Y)` with optional descriptions
- **Date**: 2026-07-24
- **Trade-off**: No import of existing markdown in MVP; future feature

### AD-010: Moderator Powers
- **Decision**: Moderator can create/delete/manage session; cannot override participant votes
- **Rationale**: Ensures voting integrity; moderator role is session facilitator, not autocrat
- **Date**: 2026-07-24

---

## Handoff Snapshot

**Phase**: Design phase complete; ready for Tasks phase

**What's Done**:
- ✅ Spec.md written with 5 P1 stories, 2 P2 stories, 1 P3, 43 total requirements
- ✅ All gray areas resolved; assumptions documented
- ✅ 10 critical architectural decisions logged (AD-001 through AD-010)
- ✅ Architecture designed: 3-tier (Vue 3 frontend → Express + Socket.io backend → PostgreSQL)
- ✅ 11 backend services defined with clear interfaces + test points
- ✅ 5 frontend Vue components designed (SessionPanel, StoryPanel, VotingPanel, ChatPanel, SessionExport)
- ✅ Prisma data models defined with full relationships (Session → Epic → Story → Task → Vote)
- ✅ REST + WebSocket API designed (19 endpoints, 12 WebSocket events)
- ✅ Error handling strategy documented (8 scenarios + mitigations)
- ✅ TDD strategy locked (unit → integration → E2E with mocks)
- ✅ 9 architectural risks identified with mitigations

**What's Next**:
- Execute phase: Distribute to subagent workers (4 batches of ~7 tasks each)
- Verification: Code review agents validate each task against spec
- Final: Comprehensive spec validation + lessons distillation

**Key Constraints**:
- MVP must include: sessions, stories/epics/tasks, voting, chat, export (all P1)
- P2 features (customization, settings) deferred if budget tight
- Real-time requirement: <500ms latency for chat and vote updates

**Context Budget**:
- Spec: ~8k tokens
- STATE: ~2k tokens
- Design/Tasks/Execute: ~180k available

---

## Active Feature

**Feature**: `planning-poker`
**Spec Location**: `.specs/features/planning-poker/spec.md`
**Requirement ID Prefix**: `POKER-`
