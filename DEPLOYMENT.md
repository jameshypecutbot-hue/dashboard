# James OS - Vercel Deployment Guide

## Overview
James OS has been refactored for Vercel serverless deployment with Next.js API routes replacing the Express server.

## Changes Made

### 1. API Routes Created
- `app/api/logs/route.ts` - GET, POST, DELETE logs
- `app/api/logs/[id]/route.ts` - GET single log, DELETE specific log
- `app/api/sessions/route.ts` - GET all sessions
- `app/api/health/route.ts` - Health check endpoint

### 2. Storage Solution
- Uses in-memory store (`lib/store.ts`) optimized for serverless
- Data persists during function lifetime (resets on cold starts)
- For production with persistent storage, consider:
  - **Vercel KV** (Redis) - Recommended
  - **Upstash Redis**
  - **MongoDB Atlas**
  - **PostgreSQL** (Vercel Postgres)

### 3. Removed Dependencies
- Removed `express` - Now using Next.js API routes
- Removed `cors` - Handled by Next.js
- Removed `firebase` - App uses password auth via localStorage

### 4. Configuration
- `next.config.ts` - Updated for serverless (removed static export)
- `vercel.json` - Vercel deployment configuration

## Deployment Instructions

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to production**:
   ```bash
   cd my-app
   vercel --prod
   ```

### Option 2: Deploy via Git Integration

1. Push this code to a GitHub/GitLab/Bitbucket repository
2. Connect the repo in Vercel dashboard
3. Vercel auto-detects Next.js and deploys

### Option 3: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import this project
3. Framework preset: Next.js
4. Deploy

## Environment Variables

No environment variables required for basic functionality. The password auth uses a hardcoded password (`hypecut2025`) in `app/contexts/AuthContext.tsx`.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with stats |
| `/api/logs` | GET | Get all logs (filtered) |
| `/api/logs` | POST | Create new log |
| `/api/logs` | DELETE | Delete all logs |
| `/api/logs/[id]` | GET | Get single log with children |
| `/api/logs/[id]` | DELETE | Delete log and children |
| `/api/sessions` | GET | Get all sessions |

## Important Notes

1. **Data Persistence**: Current implementation uses in-memory storage
   - Data resets on function cold starts (new deployments, idle timeout)
   - Fine for demos, but use a database for production

2. **Password**: Default password is `hypecut2025` (defined in `app/contexts/AuthContext.tsx`)

3. **CORS**: API routes are configured to work with the same origin

## Post-Deployment Verification

After deployment, verify these endpoints work:
```bash
# Health check
curl https://YOUR-URL.vercel.app/api/health

# Create a log
curl -X POST https://YOUR-URL.vercel.app/api/logs \
  -H "Content-Type: application/json" \
  -d '{"message": "Test log", "level": "info", "category": "system"}'

# Get logs
curl https://YOUR-URL.vercel.app/api/logs
```
