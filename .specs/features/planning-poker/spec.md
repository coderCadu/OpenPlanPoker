# Planning Poker App Specification

## Problem Statement

Squad members need a real-time collaborative estimation tool to conduct planning poker sessions. Current workflow requires manual coordination, making it difficult to manage simultaneous voting, reveal consensus, and export results. The app must support multiple participants, persistent sessions, real-time communication, and export estimation data in structured markdown format.

## Goals

- [x] Enable real-time collaborative planning poker voting with multiple users in a single session
- [x] Provide persistent session management with 30-minute inactivity timeout
- [x] Support real-time chat and notifications for voting events
- [x] Export session data (epics, stories, tasks with scores) to markdown
- [x] Allow character customization (pseudonym) per user without authentication
- [x] Enable moderator-controlled session lifecycle and vote revelation

---

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| User authentication / login system | MVP uses pseudonyms, no account persistence needed |
| Advanced user profiles (avatars, custom styling) | MVP limits to name/pseudonym only |
| Historical session analytics | Nice-to-have; out of MVP scope |
| Mobile app (native) | Web-based only for MVP |
| Jira/Confluence integration | Out of MVP; export to markdown is sufficient |
| Drag-and-drop story reordering | Manual ordering sufficient for MVP |
| Role-based permissions (scrum master, PO) | Only moderator vs. participant distinction in MVP |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here — nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Database choice | PostgreSQL | Scalable, relational data model fits epic→story→task hierarchy | ✅ |
| Fibonacci sequence | 1, 2, 3, 5, 8, 13, 21, ?, coffee break | Standard planning poker deck with option symbols | ✅ |
| Vote visibility | All participants see all votes + average | Transparency for consensus building | ✅ |
| Session access | Slug-based URL (e.g., `/session/team-sprint-42`) | Simple, shareable, no login required | ✅ |
| Chat location | Integrated in voting screen | Reduces context switching | ✅ |
| Story creation | Both pre-import and in-session creation allowed | Flexibility for different workflows | ✅ |
| Story description | Optional field | Provides context without mandatory data entry | ✅ |
| Inactivity timeout | 30 minutes of zero interactions | Prevents orphaned sessions consuming resources | ✅ |
| Vote re-voting | Allowed until moderator reveals | Supports collaborative refinement | ✅ |
| Real-time notifications | Visual + event-driven (WebSocket) | Keeps participants synchronized | ✅ |
| Moderator permissions | Can only create/delete sessions; cannot override votes | Ensures fair voting process | ✅ |

**Open questions:** none — all resolved.

---

## User Stories

### P1: Create and Join Planning Poker Session ⭐ MVP

**User Story**: As a moderator, I want to create a planning poker session so that my squad can join and estimate stories together.

**Why P1**: Core MVP requirement — without sessions, no estimation is possible.

**Acceptance Criteria**:

1. WHEN moderator submits a form with session name and optional description THEN system SHALL create a unique session with slug URL (e.g., `/session/sprint-week-42`) and generate a shareable link
2. WHEN moderator enters a pseudonym THEN system SHALL persist the pseudonym for this session and display it in the session
3. WHEN participant receives a session link and navigates to it THEN system SHALL prompt for pseudonym entry and allow joining the active session
4. WHEN participant joins an existing session THEN system SHALL display the current session state (active stories, voting progress, chat history)
5. WHEN session remains inactive for 30 minutes THEN system SHALL mark session as archived and prevent new votes

**Independent Test**: Create a session as moderator, join as participant with different names, verify both names appear in participants list.

---

### P1: Add and Manage Stories, Epics, and Tasks ⭐ MVP

**User Story**: As a moderator, I want to add epics, stories, and tasks to a session so that the squad can estimate them.

**Why P1**: Core MVP — without items, there's nothing to vote on.

**Acceptance Criteria**:

1. WHEN moderator clicks "Add Epic" THEN system SHALL display a form with Epic title (required) and optional description field
2. WHEN epic is created THEN system SHALL display it in the session as a collapsible group
3. WHEN moderator clicks "Add Story" under an epic THEN system SHALL display a form with Story title (required), optional description, and optional initial estimate
4. WHEN story is added THEN system SHALL display it under the parent epic in hierarchical view
5. WHEN moderator clicks "Add Task" under a story THEN system SHALL display a form with Task title (required), optional description, and optional initial estimate
6. WHEN task is added THEN system SHALL display it nested under the parent story
7. WHEN moderator deletes an epic/story/task THEN system SHALL remove it and all children (epics cascade delete stories; stories cascade delete tasks)
8. WHEN moderator imports a markdown file with epic→story→task structure THEN system SHALL parse and populate the session (format: `# Epic\n## Story\n### Task`)
9. WHEN story/task has no estimate yet THEN system SHALL display "No estimate" badge; WHEN estimate exists THEN display the score

**Independent Test**: Create epic → story → task hierarchy, verify display structure, delete story, confirm tasks are removed.

---

### P1: Real-Time Voting & Reveal ⭐ MVP

**User Story**: As a squad member, I want to vote on stories/tasks with Fibonacci cards so that the team can estimate collaboratively.

**Why P1**: Core MVP — voting is the primary interaction.

**Acceptance Criteria**:

1. WHEN a story/task is in "voting open" state THEN system SHALL display Fibonacci card options (1, 2, 3, 5, 8, 13, 21, ?, coffee break) as clickable buttons
2. WHEN participant clicks a card THEN system SHALL record their vote and update the card UI (e.g., highlight selection, disable other cards)
3. WHEN participant changes their vote before reveal THEN system SHALL update the vote count without notifying others
4. WHEN moderator clicks "Reveal Votes" THEN system SHALL display all votes (who voted what) and calculate average/median
5. WHEN votes are revealed THEN system SHALL show vote distribution (e.g., "3 votes for 5, 2 votes for 8, 1 vote for 13") and average
6. WHEN all participants have voted OR moderator clicks "Reveal Early" THEN system SHALL display "Votes Revealed" state
7. WHEN votes are revealed THEN system SHALL prompt moderator to confirm or adjust the final score
8. WHEN moderator confirms score THEN system SHALL store it and mark story/task as "Estimated"
9. WHEN story is marked "Estimated" THEN system SHALL move to next unestimated item OR show "All Done" state

**Independent Test**: Cast vote as participant, see it update without others seeing, moderator reveals, verify vote list and average display.

---

### P1: Real-Time Chat & Notifications ⭐ MVP

**User Story**: As a squad member, I want to chat in real-time during planning poker so that we can discuss estimates and clarify stories.

**Why P1**: Communication is essential for consensus; integrated chat reduces context switching.

**Acceptance Criteria**:

1. WHEN chat window is displayed on the voting screen THEN system SHALL show message history (limited to session messages)
2. WHEN participant types a message and presses Enter THEN system SHALL broadcast the message to all connected participants in real-time (WebSocket)
3. WHEN message is sent THEN system SHALL display sender name, timestamp, and message text
4. WHEN new message arrives THEN system SHALL scroll chat to latest message automatically
5. WHEN moderator opens a new story for voting THEN system SHALL broadcast notification event to all participants (e.g., "Voting started on Story X")
6. WHEN participant votes THEN system SHALL NOT broadcast individual vote to chat (votes only visible on reveal)
7. WHEN moderator reveals votes THEN system SHALL broadcast notification event to all (e.g., "Votes revealed for Story X")
8. WHEN participant disconnects and reconnects THEN system SHALL restore chat history for this session

**Independent Test**: Two participants in same session, one sends chat message, verify other receives in real-time; voting starts, verify notification appears.

---

### P1: Export Session to Markdown ⭐ MVP

**User Story**: As a moderator, I want to export the completed planning poker session to markdown so that I can document estimates in our backlog system.

**Why P1**: Critical for workflow — estimates must be exported for ticket tracking.

**Acceptance Criteria**:

1. WHEN session has estimated stories/tasks THEN system SHALL display "Export" button
2. WHEN moderator clicks "Export Markdown" THEN system SHALL generate a markdown file with structure: `# Epic Name\n## Story Name (est: X)\n### Task Name (est: Y)`
3. WHEN markdown is generated THEN system SHALL include optional descriptions as indented paragraphs
4. WHEN export is clicked THEN system SHALL download the file as `session-{slug}-{timestamp}.md`
5. WHEN story has no estimate THEN export SHALL mark it as "(no estimate)"
6. WHEN task has no estimate THEN export SHALL mark it as "(no estimate)"
7. WHEN export is generated THEN system SHALL include session metadata (date, participants, duration)

**Independent Test**: Estimate 3 stories with tasks, export markdown, verify file structure and estimates appear correctly.

---

### P2: Character Customization

**User Story**: As a participant, I want to customize my display name/pseudonym so that others can identify me in the session.

**Why P2**: Important for attribution; deferred because name entry at join time covers MVP needs.

**Acceptance Criteria**:

1. WHEN participant joins a session THEN system SHALL allow editing their pseudonym before first vote
2. WHEN participant enters a name with ≤50 characters THEN system SHALL accept and display it
3. WHEN participant changes their name mid-session THEN system SHALL update it for all participants
4. WHEN participant uses a name already in use THEN system SHALL reject with message "Name already taken, please choose another"

**Independent Test**: Join session, change pseudonym, verify name updates for all participants.

---

### P2: Session Settings & Customization

**User Story**: As a moderator, I want to customize voting cards and other session settings so that we can use different estimation scales if needed.

**Why P2**: Nice-to-have for flexibility; Fibonacci covers most use cases.

**Acceptance Criteria**:

1. WHEN moderator opens session settings THEN system SHALL allow choosing preset card sets (Fibonacci 1-21, 0-5, etc.)
2. WHEN preset is selected THEN system SHALL update voting cards for all participants in real-time

**Independent Test**: Change card set mid-session, verify new cards appear for all participants.

---

### P3: Participant History & Stats

**User Story**: As a squad member, I want to see my voting history and average estimates so that I can track my estimation patterns.

**Why P3**: Nice-to-have for retrospectives; not required for MVP.

**Acceptance Criteria**:

1. WHEN session ends THEN system SHALL display summary of personal votes and statistics

---

## Edge Cases

- WHEN participant navigates away without proper disconnect THEN system SHALL detect disconnection after WebSocket heartbeat timeout (15 sec) and remove from active participants list
- WHEN all participants disconnect during voting THEN system SHALL preserve vote state and allow re-connection within 30 minutes
- WHEN moderator closes session early THEN system SHALL mark all unestimated items as "Not Estimated" and allow export
- WHEN participant submits vote with invalid card value THEN system SHALL reject and request valid card
- WHEN chat message is >500 characters THEN system SHALL truncate and notify sender
- WHEN session slug collision occurs (rare) THEN system SHALL regenerate unique slug

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| POKER-01 | P1: Create Session | Design | Pending |
| POKER-02 | P1: Create Session | Design | Pending |
| POKER-03 | P1: Create Session | Design | Pending |
| POKER-04 | P1: Create Session | Design | Pending |
| POKER-05 | P1: Create Session | Design | Pending |
| POKER-06 | P1: Add Stories | Design | Pending |
| POKER-07 | P1: Add Stories | Design | Pending |
| POKER-08 | P1: Add Stories | Design | Pending |
| POKER-09 | P1: Add Stories | Design | Pending |
| POKER-10 | P1: Add Stories | Design | Pending |
| POKER-11 | P1: Add Stories | Design | Pending |
| POKER-12 | P1: Add Stories | Design | Pending |
| POKER-13 | P1: Add Stories | Design | Pending |
| POKER-14 | P1: Add Stories | Design | Pending |
| POKER-15 | P1: Voting | Design | Pending |
| POKER-16 | P1: Voting | Design | Pending |
| POKER-17 | P1: Voting | Design | Pending |
| POKER-18 | P1: Voting | Design | Pending |
| POKER-19 | P1: Voting | Design | Pending |
| POKER-20 | P1: Voting | Design | Pending |
| POKER-21 | P1: Voting | Design | Pending |
| POKER-22 | P1: Voting | Design | Pending |
| POKER-23 | P1: Voting | Design | Pending |
| POKER-24 | P1: Chat | Design | Pending |
| POKER-25 | P1: Chat | Design | Pending |
| POKER-26 | P1: Chat | Design | Pending |
| POKER-27 | P1: Chat | Design | Pending |
| POKER-28 | P1: Chat | Design | Pending |
| POKER-29 | P1: Chat | Design | Pending |
| POKER-30 | P1: Chat | Design | Pending |
| POKER-31 | P1: Chat | Design | Pending |
| POKER-32 | P1: Export | Design | Pending |
| POKER-33 | P1: Export | Design | Pending |
| POKER-34 | P1: Export | Design | Pending |
| POKER-35 | P1: Export | Design | Pending |
| POKER-36 | P1: Export | Design | Pending |
| POKER-37 | P1: Export | Design | Pending |
| POKER-38 | P1: Export | Design | Pending |
| POKER-39 | P2: Customization | Design | Pending |
| POKER-40 | P2: Customization | Design | Pending |
| POKER-41 | P2: Customization | Design | Pending |
| POKER-42 | P2: Settings | Design | Pending |
| POKER-43 | P2: Settings | Design | Pending |

**ID format:** `POKER-[NUMBER]`

**Coverage:** 43 total requirements, 38 P1 (MVP), 5 P2

---

## Success Criteria

How we know the feature is successful:

- [x] Squad can create session, add stories, and complete full voting cycle (create → vote → reveal → export) in <10 minutes
- [x] All participants see votes, chat, and notifications in real-time (<500ms latency)
- [x] Session persists in PostgreSQL and survives server restart
- [x] Markdown export is valid, properly structured, and preserves all data
- [x] No participant loses connection during normal 30-minute session
- [x] Moderator can manage session lifecycle (create, reveal votes, close, export)
