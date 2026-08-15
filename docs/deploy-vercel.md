# Deploying the frontend to Vercel

The frontend (Vue + Vite) deploys to [Vercel](https://vercel.com) using the
`vercel.json` at the repo root:

```json
{
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Setup

1. Import this repository into Vercel.
2. Vercel auto-detects the `vercel.json` config; leave the build/output
   settings as-is (they come from the file).
3. Set the following Environment Variables on the Vercel project (Production,
   and Preview if you want preview deploys to hit a real backend):
   - `VITE_API_BASE_URL` → `https://<your-railway-app>.up.railway.app/api`
   - `VITE_SOCKET_URL` → `https://<your-railway-app>.up.railway.app`
4. Deploy.
5. Back on Railway, add the resulting Vercel URL (e.g.
   `https://openplanpoker.vercel.app`) to the backend's `ALLOWED_ORIGINS`
   environment variable so CORS and Socket.io connections are accepted.

See [`deploy-railway.md`](./deploy-railway.md) for the backend side.
