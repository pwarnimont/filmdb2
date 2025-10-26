# FilmDB

FilmDB is a full-stack web application for managing analogue film rolls and their development history. It features a Node.js/Express API with PostgreSQL (Prisma) and a React (Vite + MUI) frontend. Authentication uses email/password with JWT stored in HTTP-only cookies, and administrators can control registration access at runtime.

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Material UI (square theme), React Query, React Hook Form, Zod, Cypress.
- **Backend**: Node.js 20, Express, TypeScript, Prisma ORM, Zod validation, Swagger UI, Jest + Supertest.
- **Database**: PostgreSQL with Prisma migrations and seeding.
- **Auth**: Email/password, bcrypt hashing, JWT access + refresh tokens in HTTP-only cookies.
- **DevOps**: Docker / docker-compose, GitHub Actions CI, Python helper environment setup.

## Local Development

### Prerequisites

- Node.js 20+
- npm 9+
- PostgreSQL 15+
- Python 3.10+ (for optional maintenance virtualenv)

### Environment setup

1. Copy `.env.example` to `.env` and adjust as needed.
2. Install dependencies and prepare the database:

```bash
# backend
cd backend
npm install
npx prisma generate
npm run migrate:dev
npm run seed

# frontend
cd ../frontend
npm install
```

### Running locally

In separate terminals:

```bash
# Backend (http://localhost:4000)
cd backend
npm run dev

# Frontend (http://localhost:5173)
cd ../frontend
npm run dev
```

The frontend dev server proxies API requests to `http://localhost:4000`.

### Seeded Accounts

| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | `admin@filmdb.local` | `admin123` |
| User  | `user@filmdb.local`  | `user123`  |

## Docker Workflow

Ensure Docker is running, then build and start the stack:

```bash
docker-compose up --build
```

Services exposed:

- Frontend: http://localhost:5173
- API (with Swagger UI): http://localhost:4000/api/docs
- PostgreSQL: localhost:5432 (credentials from `.env`)

The API container runs database migrations and seeds before starting.

## Admin Tools

- Admins can toggle public registration in **Access Control**.
- The **User Management** tab lists all accounts with role and status.
- Promote/demote between `USER` and `ADMIN`, disable or reactivate accounts, and set a temporary password for any user from the admin panel.

## Testing & Quality

```bash
# Backend lint & tests
cd backend
npm run lint
npm run test

# Frontend lint, unit tests (optional), and Cypress smoke
cd ../frontend
npm run lint
npm run test        # vitest (optional)
npm run cypress     # requires running app or docker stack
```

## API Documentation

Swagger UI is hosted at `/api/docs` when the backend is running. An OpenAPI spec is generated via `npm run swagger` in the backend (writes to `backend/openapi.json`).

## Python Maintenance Environment

Set up a project-wide virtual environment for maintenance scripts:

```bash
python3 scripts/setup_env.py
source venv/bin/activate  # Windows: venv\Scripts\activate
```

Packages are listed in `requirements.txt` (psycopg2-binary, requests, python-dotenv, rich).

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs linting, type checks, backend tests, and production builds for both frontend and backend on every push/PR.

## Project Structure

```
backend/        Express API, Prisma schema, tests
frontend/       React app (Vite + MUI)
prisma/         Managed inside backend
scripts/        Python helper scripts
.github/        CI configuration
```

Feel free to extend the platform with additional reporting, camera inventory, or bulk import/export utilities using the provided foundations.
