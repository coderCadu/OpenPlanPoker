# Deploying the backend to Railway

The backend (Express + Socket.io + Prisma/PostgreSQL) is configured to deploy
on [Railway](https://railway.app) via `railway.json` at the repo root.

## Setup

1. Create a new Railway project and point it at this repository.
2. Add a **PostgreSQL** plugin to the project.
3. On the service created from this repo, set the following variables:
   - `DATABASE_URL` → reference the Postgres plugin's `DATABASE_URL`
     (Railway → Variables → "Add Reference" → `Postgres.DATABASE_URL`).
   - `NODE_ENV` → `production`
   - `ALLOWED_ORIGINS` → comma-separated list of frontend origins allowed to
     call the API / connect via WebSocket (e.g. your Vercel frontend URL).
   - `PORT` is provided automatically by Railway; no need to set it.
4. Deploy. Railway builds with Nixpacks using the `build` config in
   `railway.json`:
   - `npm ci`
   - `npx prisma generate`
   - `npm run build:backend` (compiles `src/backend` to `dist/backend`)
5. On start, `railway.json` runs `npx prisma migrate deploy` to apply any
   pending Prisma migrations, then starts the server with
   `node dist/backend/server.js`.

Railway health-checks the service on `GET /health`, which the server already
exposes.

## Frontend

The frontend (Vite) is deployed separately, e.g. via `vercel.json` at the
repo root. Point its `VITE_API_BASE_URL` / `VITE_SOCKET_URL` at the Railway
service's public URL, and add that same URL to the backend's
`ALLOWED_ORIGINS`.
