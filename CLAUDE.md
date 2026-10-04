# CLAUDE.md

## Project mission

LearnCurve is a continuous diagnostic and AI-mentoring platform for school students. It replaces twice-a-year report cards with weekly topic-level testing, a learning-curve chart, and plain-language AI mentor guidance. Parents are the first buyer; schools are the distribution channel for phase two.

## Confirmed tech stack

| Layer                    | Choice                                          |
| ------------------------ | ----------------------------------------------- |
| Backend language         | Python 3.12+                                    |
| Backend framework        | FastAPI                                         |
| Dependency / env manager | uv                                              |
| ORM                      | SQLAlchemy 2.0 (async)                          |
| Migrations               | Alembic                                         |
| Database                 | MySQL 8 (local, already installed)              |
| Frontend                 | React, JavaScript (not TypeScript)              |
| Frontend build tool      | Vite                                            |
| Frontend package manager | pnpm                                            |
| Auth                     | Email + password, JWT access/refresh tokens     |
| Containers               | Docker Desktop — docker-compose for MySQL in dev |
| Backend tests            | pytest                                          |
| Frontend tests           | Vitest + React Testing Library                  |
| Logging                  | Python `logging` module — never `print()`       |
| Lint / format            | ruff + black (backend), eslint + prettier (frontend) |

## Folder structure

```text
school_saas_project/
  backend/
    app/
      api/v1/          # route modules by resource: auth, students, diagnostics, curve, mentor, admin
      core/            # config, security, logging setup
      models/          # SQLAlchemy models
      schemas/         # Pydantic schemas
      services/        # business logic layer
      repositories/    # DB access layer
      db/              # session, base
    alembic/
    tests/
    pyproject.toml
    .env.example
  frontend/
    src/
      pages/           # Landing, Login, Dashboard, Test, Admin
      components/
      features/        # auth, curve, mentor, diagnostics
      api/             # API client layer
      hooks/
      styles/
      App.jsx
    public/
    package.json
    vite.config.js
  docs/
    UI_Reference/      # existing HTML mockups — read-only reference
    architecture/      # ADRs
  docker-compose.yml
  CLAUDE.md
  README.md
  .gitignore
```

## UI_Reference usage

The five files in `UI_Reference/` (`index`, `login`, `dashboard`, `test`, `admin` `.html`) are static mockups from design review.

- Treat them as the UX and visual source of truth: layout, copy tone, the forest-green/amber color system, and screen flow.
- Rebuild them as componentized React; do not copy the raw HTML/CSS wholesale.
- Keep `UI_Reference/` untouched as a read-only reference.

## Domain glossary

- **Student** — the child being evaluated.
- **Parent** — primary account holder and payer in v1.
- **School Admin / Teacher** — v2 role, class-wide view.
- **Question** — tagged by board, class, subject, chapter, topic, difficulty.
- **Diagnostic Attempt** — one weekly test session.
- **Topic Mastery** — a rolling score per topic, computed from attempts.
- **Learning Curve** — mastery over time, per subject/topic — the core screen.
- **AI Mentor Commentary** — a generated plain-language summary of the mastery pattern plus one recommended next action.

## MVP scope

Build for **one board, one class, Mathematics only**, to prove the loop end to end:

- Adaptive-ish MCQ diagnostic — a simple rule-based difficulty step-up/down is enough; no full item-response theory.
- Topic-wise results breakdown.
- Learning curve chart.
- AI mentor summary generated from structured result data, not open-ended chat.

### Explicitly out of scope for now

- Short-video/social features
- E-commerce
- Coins/gamification
- Multi-board or multi-class support
- OTP login (deferred — email/password covers the MVP)
- Native mobile apps

## Engineering standards

- Every public function and class has a docstring (Google style).
- Use the `logging` module everywhere; `print()` is not allowed outside one-off scripts.
- Type hints on all Python function signatures.
- Clear, descriptive names — no `data`, `temp`, `x` for business logic.
- Layered backend: route handlers → services (business logic) → repositories (DB access). Routes never touch the DB directly.
- Pydantic schemas are separate from SQLAlchemy models; endpoints never return ORM objects directly.
- Every endpoint has an OpenAPI summary and description.
- New backend endpoints ship with at least one test.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, …).

## Working agreement for Claude Code

- Ask before any decision that affects architecture or the data model — don't guess silently.
- Propose a plan before writing code for a new module; wait for confirmation on anything structural.
- Build incrementally — one step at a time, confirm it runs before moving to the next.
- Use docker-compose for MySQL in dev; never assume a database is already running.
- Leave `UI_Reference/` untouched.
