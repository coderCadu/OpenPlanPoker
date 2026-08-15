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
   - `PORT` is provided automatically by Railway; no need to set it.
   - Ensure CORS + Socket.io allowed origins include your frontend URL (currently hardcoded to localhost in `src/backend/server.ts`).
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

The frontend (Vite) is deployed separately (for example, on Vercel as a static site).
Point its `VITE_API_BASE_URL` / `VITE_SOCKET_URL` at the Railway service's public URL,
and update the backend CORS + Socket.io allowed origins in `src/backend/server.ts` to
include that same frontend URL.
