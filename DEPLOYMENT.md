# Deployment Guide

A common free-tier setup: **MongoDB Atlas** (database) + **Render or Railway** (API) + **Vercel or Netlify** (frontend).

## 1. Database: MongoDB Atlas
1. Create a free cluster, a database user, and allow network access from your API host.
2. Copy the connection string into `MONGO_URI` (keep `MONGO_DB_NAME=finance_assistant`).

## 2. API: Render (Docker)
1. Push the repo to GitHub. Create a **Web Service** from the repo using `backend/Dockerfile` (build context = repo root).
2. Environment variables: `MONGO_URI`, `SECRET_KEY`, `JWT_SECRET_KEY` (long random strings), `CORS_ORIGINS=https://your-frontend.vercel.app`, `FLASK_ENV=production`.
3. Make sure `models/categorizer.pkl` is committed (or run `python models/train_categorizer.py` in the Dockerfile).
4. Health check path: `/api/health`.
5. Optional: seed the demo account once with `python scripts/seed_demo.py`.

The Docker image installs Tesseract, so OCR works in production. Free tiers sleep when idle, so the first request can take about 30 seconds.

## 3. Frontend: Vercel
1. Import the repo, set the root directory to `frontend`, build command `npm run build`, output `dist`.
2. Set `VITE_API_URL=https://your-api.onrender.com`.
3. Add a rewrite so client-side routes work: `vercel.json` → `{"rewrites":[{"source":"/(.*)","destination":"/"}]}`.

## Production checklist
- [ ] Strong random `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] `CORS_ORIGINS` limited to your real frontend URL
- [ ] HTTPS only (Render and Vercel provide this)
- [ ] Rate limiting on `/auth/login` (for example Flask-Limiter)
- [ ] Atlas IP allow-list and daily backups
- [ ] Only unpickle model files you built yourself
