# LearnCurve

A continuous diagnostic and AI-mentoring platform for school students. It replaces twice-a-year
report cards with weekly topic-level tests, a learning-curve chart and plain-language mentor
guidance. Parents are the first users; schools come next.

Project rules, tech stack and engineering standards live in [CLAUDE.md](CLAUDE.md).

## What works today

| Area | Status |
| --- | --- |
| Register / log in / log out / stay signed in (parents) | **Real**, backed by MySQL |
| School-admin accounts | **Real**, created from the command line |
| Parent dashboard (learning curve, topics, mentor panel, recent tests) | **UI built on sample data** |
| "Mission Surveyor" demo test (10 trigonometry questions, hints, points, results) | **Playable demo on sample data**, nothing is saved |
| Questions, attempts and mastery stored in the database | Not built yet (next step) |

Sample-data screens show a yellow banner so nobody mistakes them for real results.

## Prerequisites

Install these once. The check column shows the command that proves each one is ready.

| Tool | Version | Check | Get it |
| --- | --- | --- | --- |
| Python | 3.12+ | `python --version` | https://www.python.org/downloads/ |
| uv (Python package manager) | any recent | `uv --version` | https://docs.astral.sh/uv/getting-started/installation/ |
| Node.js | 20+ | `node --version` | https://nodejs.org/ |
| pnpm | any recent | `pnpm --version` | `npm install -g pnpm` (or `corepack enable`) |
| Docker Desktop | any recent | `docker --version` | https://www.docker.com/products/docker-desktop/ |
| Git | any recent | `git --version` | https://git-scm.com/ |

You do **not** need MySQL installed. It runs inside Docker. **Docker Desktop must be open and
running** before you start the database.

## Quick start on Windows

Open PowerShell in the project folder and run:

```powershell
.\dev setup     # first time only: creates backend\.env, installs all dependencies
.\dev up        # starts MySQL, applies migrations, launches the API and web app, opens the browser
.\dev seed      # first time only: creates the demo logins (see "Try it out")
```

Use `.\dev` (with the dot-slash), not `dev`. Run `.\dev help` to list every task.

`.\dev up` opens two extra console windows (API and web). Close a window to stop that server.
Run `.\dev stop` to stop MySQL.

## Manual setup (macOS, Linux, or Windows without `.\dev`)

Run every command from the project root unless a `cd` is shown.

**1. Get the code**

```bash
git clone https://github.com/rajusingha-dar/school_project.git
cd school_project
```

**2. Create your private settings file**

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set three values (use any passwords you like for local development):

- `DB_PASSWORD` the password for the app's database user
- `DB_ROOT_PASSWORD` the MySQL root password
- `JWT_SECRET_KEY` a long random string. Generate one with:

  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(48))"
  ```

`backend/.env` is ignored by git. **Never commit it.**

**3. Start the database** (Docker Desktop must be running)

```bash
docker compose --env-file backend/.env up -d mysql
docker ps    # wait until the learncurve-mysql row says "(healthy)", about 20-30 seconds
```

MySQL is exposed on host port **3307** (not 3306), so it won't clash with a MySQL you already
have installed.

**4. Install and prepare the backend**

```bash
cd backend
uv sync                          # installs Python dependencies into backend/.venv
uv run alembic upgrade head      # creates the database tables
uv run python -m app.scripts.seed_dev_users    # creates the demo logins
uv run uvicorn app.main:app --reload           # starts the API on http://localhost:8000
```

Leave that terminal running. Check it: open http://localhost:8000/api/v1/health. You should see
`{"status":"ok","database":"up"}`. API docs are at http://localhost:8000/docs.

**5. Install and start the frontend** (in a second terminal)

```bash
cd frontend
pnpm install
pnpm dev                         # starts the web app on http://localhost:5173
```

**6. Open the app** at http://localhost:5173 and log in with a demo account below.

## Try it out

After seeding, these accounts exist (they are fake and for local use only):

| Tab on the login page | Email | Password | What you see |
| --- | --- | --- | --- |
| **Parent** | `priya@example.com` | `Parent@12345` | Full dashboard for a child, Aarav |
| **Parent** | `rahul@example.com` | `Parent@12345` | "Add your child" first-run screen |
| **Teacher / Admin** | `admin@example.com` | `Admin@12345` | Admin placeholder page |

Suggested tour:

1. Log in as Priya and look at the dashboard.
2. Click **Take a test** in the sidebar and play the 10-question Mission Surveyor demo.
   Hints cost 5 points each; the results page shows points and mastery separately.
3. Click **Log out**, then try **Create a parent account** with a new email.

A longer checklist of things to try (wrong password, duplicate email and so on) is in
[docs/TEST_ACCOUNTS.md](docs/TEST_ACCOUNTS.md). To create your own admin instead:

```bash
cd backend
uv run python -m app.scripts.create_admin --email you@school.in --name "Your Name" --school "Your School"
```

The password is asked for interactively and is never passed on the command line.

## Everyday commands

| Task | Windows shortcut | Manual equivalent |
| --- | --- | --- |
| Start everything | `.\dev up` | steps 3-5 above |
| Start MySQL only | `.\dev db` | `docker compose --env-file backend/.env up -d mysql` |
| Apply migrations | `.\dev migrate` | `cd backend && uv run alembic upgrade head` |
| Run the API | `.\dev backend` | `cd backend && uv run uvicorn app.main:app --reload` |
| Run the web app | `.\dev frontend` | `cd frontend && pnpm dev` |
| Create demo logins | `.\dev seed` | `cd backend && uv run python -m app.scripts.seed_dev_users` |
| Create an admin | `.\dev admin` | `cd backend && uv run python -m app.scripts.create_admin ...` |
| Run all tests | `.\dev test` | see "Tests and linting" |
| Lint everything | `.\dev lint` | see "Tests and linting" |
| Stop MySQL | `.\dev stop` | `docker compose --env-file backend/.env stop mysql` |

## Tests and linting

Run these before every commit. The backend tests use an in-memory SQLite database, so they do
**not** need Docker or MySQL.

```bash
# backend
cd backend
uv run pytest
uv run ruff check .
uv run black --check .

# frontend
cd frontend
pnpm test
pnpm lint
pnpm build
```

## Configuration (`backend/.env`)

| Variable | Meaning | Default in `.env.example` |
| --- | --- | --- |
| `APP_ENV` | `development` enables the demo seed script and non-secure cookies | `development` |
| `LOG_LEVEL` | Python log level | `INFO` |
| `DB_HOST` / `DB_PORT` | Where MySQL listens | `127.0.0.1` / `3307` |
| `DB_NAME` / `DB_USER` | Database and user created by Docker | `learncurve` / `learncurve` |
| `DB_PASSWORD` | App database password (**you choose**) | `change-me` |
| `DB_ROOT_PASSWORD` | MySQL root password for the container (**you choose**) | `root-change-me` |
| `JWT_SECRET_KEY` | Signs login tokens (**you choose, keep secret**) | `change-me-to-a-long-random-string` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `CORS_ORIGINS` | Comma-separated allowed browser origins | `http://localhost:5173` |

## Project layout

```text
school_saas_project/
  backend/                      FastAPI service (Python)
    app/
      api/v1/                   HTTP routes: health, auth, shared dependencies
      core/                     settings, security (passwords + JWT), logging, errors
      db/                       async engine/session and the SQLAlchemy base
      models/                   database tables (users, schools, refresh tokens)
      repositories/             database access only
      schemas/                  request/response shapes (Pydantic)
      services/                 business logic (auth)
      scripts/                  command-line tools (create_admin, seed_dev_users)
      main.py                   app factory
    alembic/                    database migrations
    tests/                      pytest tests
  frontend/                     React + Vite app (JavaScript)
    src/
      api/                      API client and the sample-data layer
      components/               shared UI (app shell, form fields, logo)
      features/                 auth, dashboard, curve chart, mentor, diagnostics (test)
      pages/                    Login, Register, Dashboard, Test, Admin
      styles/                   design tokens and CSS
  docs/
    UI_Reference/               original HTML mockups (read-only reference)
    TEST_ACCOUNTS.md            demo logins and a testing checklist
    engaging-tests-design.md    design notes for the gamified test
  docker-compose.yml            MySQL for local development
  dev.ps1 / dev.cmd             Windows task runner (`.\dev ...`)
  CLAUDE.md                     project context and engineering standards
```

## How it fits together

- **Backend layers:** routes call services, services call repositories, repositories talk to
  MySQL. Routes never touch the database directly.
- **Login:** email + password. The API returns a short-lived access token in the response body
  (the browser keeps it in memory) and sets a long-lived refresh token as an `httpOnly` cookie.
  Refresh tokens rotate on every use, and replaying an old one signs that user out everywhere.
- **Roles:** `parent` (self-registers) and `school_admin` (created from the command line).
- **Dev proxy:** the Vite dev server forwards `/api` to `localhost:8000`, so the browser only
  talks to port 5173 and cookies just work.
- **Sample data:** the dashboard and test read from `frontend/src/api/sampleData.js` and
  `frontend/src/features/diagnostics/sampleTest.js`. When the real endpoints exist, only
  `frontend/src/api/dashboard.js` and `diagnostics.js` need to change.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `.\dev` is "not recognized" | Use `.\dev` with the dot-slash, from the project root folder |
| "Docker is not running" or `docker compose` errors | Start Docker Desktop and wait until it says "Engine running" |
| Health page shows `"database":"down"` | MySQL isn't ready. Run `docker ps` and wait for `(healthy)`. Check `DB_PORT=3307` in `.env` |
| `Access denied for user 'learncurve'` | You changed `DB_PASSWORD` after MySQL first started; the old one is stored in its volume. Run `docker compose --env-file backend/.env down -v` (this **deletes local database data**), start MySQL again, then re-run migrations and the seed |
| Port 3307, 8000 or 5173 already in use | Stop the other program using it, or change the port (`DB_PORT` in `.env`; Vite and uvicorn ports are in `frontend/vite.config.js` and the run command) |
| `Settings` / "Field required" error when starting the API | `backend/.env` is missing or lacks `DB_PASSWORD` / `JWT_SECRET_KEY`. Re-do step 2 |
| `pnpm: command not found` | `npm install -g pnpm`, then open a new terminal |
| pnpm warns about ignored build scripts | `pnpm approve-builds --all` (esbuild must be allowed; `pnpm-workspace.yaml` already does this) |
| Demo seed says "Refusing to seed" | Set `APP_ENV=development` in `backend/.env` |
| Want to look inside the database | Connect any MySQL client to host `127.0.0.1`, port `3307`, user `learncurve` (or `root`), with the passwords from `backend/.env`, schema `learncurve` |

## Contributing

- Read [CLAUDE.md](CLAUDE.md) first. It defines the standards below in full.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `chore:`, `docs:` and so on.
- Python: type hints and Google-style docstrings on public code, the `logging` module instead of
  `print()`, and a test with every new endpoint.
- Do not edit `docs/UI_Reference/`. It is a read-only reference.
- Never commit `backend/.env` or any real secret.
