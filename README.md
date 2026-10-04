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
uv run uvicorn app.main:app --reload   # available from Step 2
```

### 3. Frontend

```bash
cd frontend
pnpm install
pnpm dev                               # http://localhost:5173
```

## Layout

| Path                | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `backend/`          | FastAPI service (routes → services → repositories) |
| `frontend/`         | React + Vite app                          |
| `docs/UI_Reference/`| Read-only HTML mockups (UX source of truth) |
| `docs/architecture/`| Architecture decision records             |
