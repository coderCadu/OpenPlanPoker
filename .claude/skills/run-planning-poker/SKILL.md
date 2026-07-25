# Run Planning Poker App

Launch the Planning Poker app development environment with both backend and frontend servers.

## What This Does

Starts:
- **Backend server** (Node.js/Express) on `http://localhost:3000`
- **Frontend dev server** (Vue 3/Vite) on `http://localhost:5173`

Opens a browser window with the app ready to use.

## Prerequisites

- Node.js 18+ and npm installed
- Dependencies installed: `npm install`
- Database configured (see `.env`)

## Quick Start

```bash
/run-planning-poker
```

Or run manually:

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
npm run dev:frontend
```

## What You Can Do

1. **Create a session** — Set a name and get a shareable URL slug
2. **Join a session** — Enter slug + pseudonym to join active sessions
3. **Build hierarchy** — Create epics, stories, and tasks (or import markdown)
4. **Run planning poker** — Select cards (1-21, ?, ☕) to estimate
5. **See results** — View votes, average, median, and confirm final estimate
6. **Chat in real-time** — Discuss while voting (WebSocket-powered)
7. **Export markdown** — Download session as formatted markdown file

## Architecture

- **Backend**: Node.js + Express + PostgreSQL + Socket.io
- **Frontend**: Vue 3 + Vite + Pinia + Socket.io Client
- **Real-time**: WebSocket events for voting, chat, notifications
- **Database**: 7 models (Session, Participant, Epic, Story, Task, Vote, Message)

## Troubleshooting

**Port already in use?**
- Backend: Change `PORT` in `.env` (default 3000)
- Frontend: Vite will use next available port (usually 5174)

**Database connection failed?**
- Check `DATABASE_URL` in `.env` points to valid PostgreSQL instance
- Run migrations: `npx prisma migrate dev`

**Styles not loading?**
- Clear browser cache (Ctrl+Shift+Delete)
- Restart Vite: `npm run dev:frontend`

## Development

- Unit tests: `npm run test:unit`
- Integration tests: `npm run test:integration`
- Full test suite: `npm test`
- Lint: `npm run lint`

See `.specs/features/planning-poker/` for full specification and validation report.