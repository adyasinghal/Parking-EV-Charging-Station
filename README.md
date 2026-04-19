# VoltPark

**VoltPark** is a full-stack EV charging station management system built as a DBMS project. It provides a web interface for managing charging stations, sessions, and users.  

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript, React |
| Backend | Go |
| Database | MariaDB 11 |
| Containerization | Docker, Docker Compose |
| Auth | JWT (JSON Web Tokens) |


## Project Structure

```
VoltPark/
├── backend/          # Go REST API
├── frontend/         # TypeScript/React web app
├── docker-compose.yml
└── .github/workflows/
```

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.

### Running with Docker Compose

1. **Clone the repository:**

   ```bash
   git clone https://github.com/adyasinghal/VoltPark.git
   cd VoltPark
   ```

2. **Start all services:**

   ```bash
   docker compose up --build
   ```

   This will spin up three containers:
   - `db` — MariaDB database on port `3306`
   - `backend` — Go API server on port `8080`
   - `frontend` — React app (served via Nginx) on port `3000`

3. **Open the app:**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

The backend is configured via environment variables. Defaults are set in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `db` | Database host |
| `DB_PORT` | `3306` | Database port |
| `DB_USER` | `voltpark` | Database user |
| `DB_PASSWORD` | `voltpark_secret` | Database password |
| `DB_NAME` | `voltpark` | Database name |
| `JWT_SECRET` | `change-me-in-production` | Secret key for signing JWTs |
| `JWT_TOKEN_TTL_HOURS` | `24` | Token expiry duration |
| `USE_DB_PROCEDURES` | `true` | Enable stored procedures |
| `PORT` | `8080` | API server port |
| `APP_ENV` | `production` | Application environment |

> **Important:** Change `JWT_SECRET` and database passwords before deploying to any public environment.


## Development

### Backend (Go)

```bash
cd backend
go mod tidy
go run .
```

### Frontend (TypeScript/React)

```bash
cd frontend
npm install
npm run dev
```


## Database

VoltPark uses **MariaDB 11** as its primary database. The schema is managed through SQL migrations, and core business logic is implemented using **stored procedures** (enabled via `USE_DB_PROCEDURES=true`).

Data is persisted in a named Docker volume (`db_data`) so it survives container restarts.


---

This project was created as a DBMS course project.
