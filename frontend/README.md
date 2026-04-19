# VoltPark Frontend

Frontend implementation for VoltPark using React + TypeScript + Vite.

## Implemented

### Frontend Phase 1 (done)

- Auth flow (`/login`, `/register`) with persisted Zustand auth store
- Protected routing and admin-only route guard
- API client with JWT interceptor and 401 logout handling
- Driver pages:
  - `/dashboard`
  - `/zones`, `/zones/:id`
  - `/reservations`
  - `/wallet`
  - `/vehicles`
  - `/sessions`
- Admin pages:
  - `/admin/users`
  - `/admin/maintenance`

### Frontend Phase 2 (done)

- Analytics API module and typed analytics responses
- Admin analytics page:
  - `/admin/analytics`
- SSE hooks/store for live updates:
  - Spot stream integrated in `ZoneDetailPage`
  - Charger stream consumed by `AnalyticsPage`

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Default API URL:

- `VITE_API_URL=http://localhost:8080/api/v1`

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Final phase quality checks

```bash
npm run lint
npm run test:run
npm run build
```

## Deployment runbook

See `../docs/deployment_runbook.md` for full-stack Docker startup and validation.

## Notes

- Frontend is now aligned with backend through phase 5 (`analytics` + `sse`).
- Next step is UX polish + chart components + testing coverage.
