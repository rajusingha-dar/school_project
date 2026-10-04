<#
.SYNOPSIS
  Developer task runner for LearnCurve (Windows equivalent of a Makefile).

.DESCRIPTION
  Run through the wrapper:  .\dev <task>      e.g.  .\dev up
#>
param(
    [Parameter(Position = 0)][string]$Task = 'help',
    [switch]$NoBrowser
)

# Native tools (docker, uv, pnpm) write progress/warnings to stderr; PowerShell 5.1 would treat
# that as an error under 'Stop'. We run them through cmd (stderr merged) and check exit codes.
$ErrorActionPreference = 'Continue'
$Root = $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'
$EnvFile = Join-Path $Backend '.env'
$AppUrl = 'http://localhost:5173'

function Write-Step($Message) { Write-Host "==> $Message" -ForegroundColor Green }

# Run a command line through cmd in the given directory; throw if it fails.
function Invoke-Cmd([string]$Line, [string]$Directory, [string]$Failure) {
    Push-Location $Directory
    try {
        cmd /c "$Line 2>&1"
        if ($LASTEXITCODE -ne 0) { throw "$Failure (exit code $LASTEXITCODE)" }
    } finally { Pop-Location }
}

function New-Secret([int]$Bytes) {
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer)
    return ([Convert]::ToBase64String($buffer)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Initialize-EnvFile {
    if (Test-Path $EnvFile) { return }
    Write-Step 'Creating backend/.env with generated secrets'
    $content = Get-Content (Join-Path $Backend '.env.example') | ForEach-Object {
        if ($_ -like 'DB_PASSWORD=*') { "DB_PASSWORD=$(New-Secret 18)" }
        elseif ($_ -like 'JWT_SECRET_KEY=*') { "JWT_SECRET_KEY=$(New-Secret 48)" }
        else { $_ }
    }
    $content += "DB_ROOT_PASSWORD=$(New-Secret 18)"
    Set-Content -Path $EnvFile -Value $content -Encoding utf8
}

function Start-Database {
    Initialize-EnvFile
    Write-Step 'Starting MySQL (Docker)'
    cmd /c 'docker info >nul 2>&1'
    if ($LASTEXITCODE -ne 0) { throw 'Docker is not running. Start Docker Desktop and try again.' }
    Invoke-Cmd 'docker compose --env-file backend\.env up -d mysql' $Root 'docker compose failed'
    Write-Host 'Waiting for MySQL to be healthy' -NoNewline
    for ($i = 0; $i -lt 40; $i++) {
        $health = (cmd /c 'docker inspect -f "{{.State.Health.Status}}" learncurve-mysql 2>nul') | Select-Object -First 1
        if ($health -eq 'healthy') { Write-Host ' ok'; return }
        Write-Host '.' -NoNewline
        Start-Sleep -Seconds 3
    }
    throw 'MySQL did not become healthy in time. Check: docker logs learncurve-mysql'
}

function Invoke-Migrations {
    Write-Step 'Applying database migrations'
    Invoke-Cmd 'uv run alembic upgrade head' $Backend 'Migrations failed'
}

function Install-Dependencies {
    Write-Step 'Installing backend dependencies'
    Invoke-Cmd 'uv sync' $Backend 'uv sync failed'
    Write-Step 'Installing frontend dependencies'
    Invoke-Cmd 'pnpm install' $Frontend 'pnpm install failed'
}

# Open a new console window running a long-lived command (server).
function Start-InNewWindow([string]$Title, [string]$Directory, [string]$Line) {
    Start-Process cmd -ArgumentList '/k', "title $Title && cd /d `"$Directory`" && $Line"
}

function Wait-ForUrl([string]$Url, [int]$Seconds) {
    for ($i = 0; $i -lt $Seconds; $i++) {
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
            return $true
        } catch { Start-Sleep -Seconds 1 }
    }
    return $false
}

try {
    switch ($Task) {
        'setup' { Initialize-EnvFile; Install-Dependencies }
        'db' { Start-Database }
        'migrate' { Invoke-Migrations }
        'backend' { Invoke-Cmd 'uv run uvicorn app.main:app --reload' $Backend 'API stopped' }
        'frontend' { Invoke-Cmd 'pnpm dev' $Frontend 'Web server stopped' }
        'up' {
            Start-Database
            Invoke-Migrations
            Write-Step 'Starting backend and frontend in new windows'
            Start-InNewWindow 'LearnCurve API' $Backend 'uv run uvicorn app.main:app --reload'
            Start-InNewWindow 'LearnCurve Web' $Frontend 'pnpm dev'
            Write-Host 'Waiting for the servers' -NoNewline
            $ready = $false
            for ($i = 0; $i -lt 60 -and -not $ready; $i++) {
                $ready = Wait-ForUrl "$AppUrl/api/v1/health" 1
                if (-not $ready) { Write-Host '.' -NoNewline }
            }
            Write-Host ''
            if ($ready) {
                Write-Step "Ready: $AppUrl   (API docs: http://localhost:8000/docs)"
                if (-not $NoBrowser) { Start-Process $AppUrl }
            } else {
                Write-Warning 'Servers did not respond in 60s - check the two new windows for errors.'
            }
        }
        'seed' { Invoke-Cmd 'uv run python -m app.scripts.seed_dev_users' $Backend 'Seeding failed' }
        'admin' {
            $email = Read-Host 'Admin email'
            $name = Read-Host 'Admin full name'
            $school = Read-Host 'School name'
            Push-Location $Backend
            try { uv run python -m app.scripts.create_admin --email $email --name $name --school $school }
            finally { Pop-Location }
        }
        'test' {
            Invoke-Cmd 'uv run pytest -q' $Backend 'Backend tests failed'
            Invoke-Cmd 'pnpm test' $Frontend 'Frontend tests failed'
        }
        'lint' {
            Invoke-Cmd 'uv run ruff check .' $Backend 'ruff failed'
            Invoke-Cmd 'uv run black --check .' $Backend 'black failed'
            Invoke-Cmd 'pnpm lint' $Frontend 'eslint failed'
        }
        'stop' {
            Invoke-Cmd 'docker compose --env-file backend\.env stop mysql' $Root 'docker compose failed'
            Write-Host 'MySQL stopped. Close the API/Web windows to stop the servers.'
        }
        default {
            @'
LearnCurve dev tasks   (usage: .\dev <task>)

  up        Start MySQL, run migrations, launch API + web in new windows, open the browser
  setup     Create backend/.env (if missing) and install all dependencies
  db        Start the MySQL container and wait until it is healthy
  migrate   Apply database migrations
  backend   Run the API in this window  (http://localhost:8000/docs)
  frontend  Run the web app in this window (http://localhost:5173)
  seed      Create demo accounts for testing (see docs\TEST_ACCOUNTS.md)
  admin     Create a school-admin account (prompts for details and password)
  test      Run backend and frontend tests
  lint      Run ruff, black --check and eslint
  stop      Stop the MySQL container
'@ | Write-Host
        }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
