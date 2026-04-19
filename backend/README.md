# VoltPark Backend

Backend scaffold for VoltPark using Go, Gin, and sqlx.

## Included currently

- Env-first config loader
- MariaDB connection bootstrap
- Auth endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
- Health endpoints:
  - `GET /healthz`
  - `GET /readyz`
- Users endpoints:
  - `GET /api/v1/users/me`
  - `PUT /api/v1/users/me`
  - `GET /api/v1/users` (Admin)
  - `GET /api/v1/users/:id` (Admin)
  - `DELETE /api/v1/users/:id` (Admin)
- Wallet endpoints:
  - `GET /api/v1/wallet`
  - `POST /api/v1/wallet/topup`
  - `GET /api/v1/wallet/transactions`
- Vehicles endpoints:
  - `GET /api/v1/vehicles`
  - `POST /api/v1/vehicles`
  - `PUT /api/v1/vehicles/:id`
  - `DELETE /api/v1/vehicles/:id`
- Zones endpoints:
  - `GET /api/v1/zones`
  - `GET /api/v1/zones/:id`
  - `GET /api/v1/zones/:id/spots`
  - `POST /api/v1/zones` (Admin)
  - `PUT /api/v1/zones/:id` (Admin)
- Spots endpoints:
  - `GET /api/v1/spots/:id`
  - `GET /api/v1/spots/:id/availability?start_time=...&end_time=...`
  - `PUT /api/v1/spots/:id/status` (Admin/Operator)
  - `POST /api/v1/spots` (Admin)
- Reservations endpoints:
  - `GET /api/v1/reservations`
  - `POST /api/v1/reservations`
  - `GET /api/v1/reservations/:id`
  - `DELETE /api/v1/reservations/:id`
  - `GET /api/v1/reservations/admin/all` (Admin)
- Sessions endpoints:
  - `POST /api/v1/sessions`
  - `GET /api/v1/sessions/active`
  - `PUT /api/v1/sessions/:id/end`
  - `GET /api/v1/sessions`
  - `GET /api/v1/sessions/admin/all` (Admin)
- Billing endpoints:
  - `GET /api/v1/billing`
  - `GET /api/v1/billing/admin/all` (Admin)
- Maintenance endpoints:
  - `GET /api/v1/maintenance/alerts` (Admin)
  - `PUT /api/v1/maintenance/alerts/:id/resolve` (Admin)
  - `GET /api/v1/maintenance/risk` (Admin)
- Analytics endpoints:
  - `GET /api/v1/analytics/high-traffic` (Admin)
  - `GET /api/v1/analytics/charger-efficiency` (Admin)
  - `GET /api/v1/analytics/top-spenders` (Admin)
  - `GET /api/v1/analytics/no-show-rate` (Admin)
  - `GET /api/v1/analytics/heatmap` (Admin)
  - `GET /api/v1/analytics/charger-utilization` (Admin)
  - `GET /api/v1/analytics/parking-only-users` (Admin)
  - `GET /api/v1/analytics/overtime-sessions` (Admin)
  - `GET /api/v1/analytics/session-frequency` (Admin)
- SSE endpoints:
  - `GET /api/v1/sse/spots/:zone_id`
  - `GET /api/v1/sse/chargers`
- Base migration files and initial schema migration
- `CHANGE.md` for hardcoded or environment-specific values

## Quick start

```bash
cp .env.example .env
go run ./cmd/api
```

## Procedure mode QA

- Migration smoke script: `scripts/migration_smoke.sh`
- Endpoint checklist: `docs/reservation_procedure_mode_checklist.md`

Run smoke checks with your DB env set:

```bash
bash ./scripts/migration_smoke.sh
```

## Final phase quality checks

```bash
go test ./...
```

## Deployment runbook

See `../docs/deployment_runbook.md` for full-stack Docker startup, health verification, and smoke checks.

## Full project init

From repository root, use:

- `INIT.sh` for automated MariaDB + backend env setup
- `INIT.md` for manual step-by-step setup

## Notes

- This backend is being delivered in phases.
- `USE_DB_PROCEDURES=false` keeps reservation flows on direct SQL until procedure SQL is loaded.
- Set `USE_DB_PROCEDURES=true` after `sp_make_reservation` and `sp_cancel_reservation` exist.
- Session end and analytics procedure-backed endpoints rely on SQL objects in `000002_procedures.up.sql`.
- See `CHANGE.md` for values to externalize or replace.
