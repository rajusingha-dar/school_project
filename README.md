# LearnCurve

Continuous diagnostic and AI-mentoring platform for school students. See [CLAUDE.md](CLAUDE.md) for the full project context, tech stack, and engineering standards.

## Prerequisites

- Python 3.12+ and [uv](https://docs.astral.sh/uv/)
- Node.js 20+ and [pnpm](https://pnpm.io/) (`corepack enable` or `npm i -g pnpm`)
- Docker Desktop

## Getting started

### 1. Database

```bash
cp backend/.env.example backend/.env   # then edit the passwords
docker compose --env-file backend/.env up -d mysql
```

MySQL listens on host port **3307** (so it won't clash with a local MySQL on 3306).

### 2. Backend

```bash
cd backend
uv sync
uv run alembic upgrade head            # create/update tables
uv run uvicorn app.main:app --reload   # http://localhost:8000/docs
uv run pytest                          # tests (use in-memory SQLite, no Docker needed)
```

Parents sign up through the app. School-admin accounts are created from the CLI (the password is
prompted, never passed as an argument):

```bash
uv run python -m app.scripts.create_admin --email EMAIL --name NAME --school SCHOOL
```

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev                               # http://localhost:5173 (proxies /api to :8000)
pnpm test && pnpm lint
```

Open http://localhost:5173 — it redirects to the login page, where parents can register.

## Layout

| Path                | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `backend/`          | FastAPI service (routes → services → repositories) |
| `frontend/`         | React + Vite app                          |
| `docs/UI_Reference/`| Read-only HTML mockups (UX source of truth) |
| `docs/architecture/`| Architecture decision records             |
