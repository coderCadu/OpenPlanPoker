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

**Feature**: Planning Poker App (`.specs/features/planning-poker/`)  
**Phase**: Execute (tlc-spec-driven skill)  
**Status**: Batch 1 (T1–T10, Phases 1+2) running in background  

**What's Done**:
- ✅ Spec.md written with 5 P1 stories, 2 P2 stories, 1 P3, 43 total requirements
- ✅ Design complete: 3-tier architecture, 11 services, 5 Vue components, REST + WebSocket API
- ✅ Tasks.md created: 28 atomic tasks across 6 phases with full dependency graph
- ✅ Packing strategy: 3 subagent batches (~10 tasks each, whole phases per worker)
- ✅ Batch 1 worker dispatched (agentId: a631039acbde46092)

**Currently In-Progress**:
- 🔄 **Batch 1** (Phases 1+2, T1–T10) — Backend foundation + services
  - T1: Node.js/TypeScript/Express/Prisma setup
  - T2: Prisma schema (7 models)
  - T3: Database migration + connection test
  - T4: Env config + connection pooling
  - T5: Logger + error handling
  - T6: SessionService (7 methods)
  - T7: StoryService (9 methods)
  - T8: Integration test (Session+Story)
  - T9: Utility functions (markdown, slug, validators)
  - T10: ExportService
  - Worker follows: implement → tests → gate → atomic commit per task

**Next Steps (on resume)**:
1. Await Batch 1 completion notification
2. Dispatch Batch 2 (Phases 3+4, T11–T20) — Voting & Chat services + API routes
3. Dispatch Batch 3 (Phases 5+6, T21–T28) — WebSocket + Vue 3 frontend
4. ✅ **Verifier dispatched** (agentId: aa53bb87a7a7132e5) — waiting for Batch 3 completion, then validates all 28 tasks
5. Generate `/run-planning-poker` skill (after Verifier passes)

**Blockers**: None  
**Uncommitted files**: None (Batch 1 worker handles commits atomically per task)  
**Branch**: main  

**Key Notes**:
- User preference: Full autonomy on code decisions, no questions needed
- Batch workers: sequential execution (Batch 1 → Batch 2 → Batch 3 → Verifier)
- Test gates: Quick (unit), Full (integration), Build (all tests + lint)
- Spec coverage: Every task's tests derived from "Done when" criteria + spec ACs

---

## Active Feature

**Feature**: `planning-poker`
**Spec Location**: `.specs/features/planning-poker/spec.md`
**Requirement ID Prefix**: `POKER-`
