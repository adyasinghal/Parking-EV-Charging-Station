# VoltPark Frontend

React + TypeScript frontend for VoltPark.

## Tech Stack

- React 19
- TypeScript
- React Router
- Zustand
- Axios
- Vitest + Testing Library
- ESLint

## Prerequisites

- Node.js (Node 20+ is recommended)
- npm

## Quick Start

```bash
cd VoltPark/frontend
npm install
cp .env.example .env
npm run dev
```

The Vite dev server runs on its default port unless overridden.

## Environment Variables

`frontend/.env.example` defines:

```dotenv
VITE_API_URL=http://localhost:8080/api/v1
```

Set `VITE_API_URL` to your backend API base URL.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:run
```

- `dev`: start Vite development server
- `build`: type-check and create production build in `dist/`
- `preview`: serve the production build locally
- `lint`: run ESLint
- `test`: run Vitest in watch mode
- `test:run`: run Vitest once (CI-style)

## App Routes

Public routes:

- `/`
- `/login`
- `/register`

Authenticated routes:

- `/dashboard`
- `/zones`
- `/zones/:id`
- `/reservations`
- `/reservations/new`
- `/reservations/:id`
- `/chargers`
- `/chargers/:id`
- `/wallet`
- `/vehicles`
- `/sessions`

Admin-only routes:

- `/admin/users`
- `/admin/users/:id`
- `/admin/maintenance`
- `/admin/topup-requests`
- `/admin/billing`
- `/admin/analytics`
- `/admin/pricing`

## Testing and Quality Checks

Run the standard local checks:

```bash
npm run lint
npm run test:run
npm run build
```
