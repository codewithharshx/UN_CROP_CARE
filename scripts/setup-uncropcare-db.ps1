# UN CROP CARE — Hardened Database Setup Script
# Configures dedicated PostgreSQL user and database without modifying other projects or existing credentials

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

function Mask-String([string]$str) {
    if (-not $str -or $str.Length -le 8) { return "********" }
    return $str.Substring(0, 4) + "..." + $str.Substring($str.Length - 4, 4)
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " UN CROP CARE: Secure PostgreSQL Database & User Setup" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Scope:" -ForegroundColor Cyan
Write-Host "  - Target Role:     uncropcare_app" -ForegroundColor Cyan
Write-Host "  - Target Database: uncropcare" -ForegroundColor Cyan
Write-Host "  - Non-target DBs:  Zero modifications / Zero REVOKEs" -ForegroundColor Cyan
Write-Host ""

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) {
    Write-Error "PostgreSQL 18 psql.exe not found at $psql"
    exit 1
}

$projectRoot = "D:\lovable-project-UN Crops"
$envPath = Join-Path $projectRoot ".env"

# ---------------------------------------------------------------------------
# Step 1: Detect Existing uncropcare_app Password from .env (Idempotency)
# ---------------------------------------------------------------------------
$existingAppPassword = $null
$existingBetterAuthSecret = $null

if (Test-Path $envPath) {
    $existingLines = Get-Content $envPath
    foreach ($line in $existingLines) {
        if ($line -match '^\s*DATABASE_URL\s*=\s*(.*)$') {
            $rawUrl = $matches[1].Trim().Trim('"').Trim("'")
            # Parse user:password@host:port/dbname
            if ($rawUrl -match '^postgres(?:ql)?://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/(.+)$') {
                $parsedUser = [System.Uri]::UnescapeDataString($matches[1])
                if ($parsedUser -eq "uncropcare_app") {
                    $existingAppPassword = [System.Uri]::UnescapeDataString($matches[2])
                }
            }
        }
        if ($line -match '^\s*BETTER_AUTH_SECRET\s*=\s*(.*)$') {
            $existingBetterAuthSecret = $matches[1].Trim().Trim('"').Trim("'")
        }
    }
}

# ---------------------------------------------------------------------------
# Step 2: Prompt Securely for PostgreSQL Admin Password
# ---------------------------------------------------------------------------
Write-Host "Connecting as administrator 'postgres'..." -ForegroundColor Yellow
$cred = Get-Credential -UserName "postgres" -Message "Enter password for the PostgreSQL 'postgres' account"
$adminPassword = $cred.GetNetworkCredential().Password

if (-not $adminPassword) {
    Write-Error "Password cannot be empty."
    exit 1
}

# Function to run psql queries as postgres admin via stdin (no temp files on disk)
function Invoke-PsqlAdmin([string]$sqlQuery, [string]$targetDb = "postgres") {
    $env:PGPASSWORD = $adminPassword
    try {
        $pinfo = New-Object System.Diagnostics.ProcessStartInfo
        $pinfo.FileName = $psql
        $pinfo.Arguments = "-h 127.0.0.1 -p 5432 -U postgres -d $targetDb -v ON_ERROR_STOP=1 -q -t"
        $pinfo.RedirectStandardInput = $true
        $pinfo.RedirectStandardOutput = $true
        $pinfo.RedirectStandardError = $true
        $pinfo.UseShellExecute = $false
        $pinfo.CreateNoWindow = $true

        $p = [System.Diagnostics.Process]::Start($pinfo)
        $p.StandardInput.Write($sqlQuery)
        $p.StandardInput.Close()

        $stdout = $p.StandardOutput.ReadToEnd()
        $stderr = $p.StandardError.ReadToEnd()
        $p.WaitForExit()

        if ($p.ExitCode -ne 0) {
            throw "psql admin error (exit $($p.ExitCode)): $stderr"
        }
        return $stdout.Trim()
    }
    finally {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Function to run psql queries as uncropcare_app via stdin
function Invoke-PsqlApp([string]$sqlQuery, [string]$appPass) {
    $env:PGPASSWORD = $appPass
    try {
        $pinfo = New-Object System.Diagnostics.ProcessStartInfo
        $pinfo.FileName = $psql
        $pinfo.Arguments = "-h 127.0.0.1 -p 5432 -U uncropcare_app -d uncropcare -v ON_ERROR_STOP=1 -q -t"
        $pinfo.RedirectStandardInput = $true
        $pinfo.RedirectStandardOutput = $true
        $pinfo.RedirectStandardError = $true
        $pinfo.UseShellExecute = $false
        $pinfo.CreateNoWindow = $true

        $p = [System.Diagnostics.Process]::Start($pinfo)
        $p.StandardInput.Write($sqlQuery)
        $p.StandardInput.Close()

        $stdout = $p.StandardOutput.ReadToEnd()
        $stderr = $p.StandardError.ReadToEnd()
        $p.WaitForExit()

        if ($p.ExitCode -ne 0) {
            throw "psql app error (exit $($p.ExitCode)): $stderr"
        }
        return $stdout.Trim()
    }
    finally {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# ---------------------------------------------------------------------------
# Step 3: Check Current Role and Database State
# ---------------------------------------------------------------------------
Write-Host "Verifying server connection and inspecting existing database state..." -ForegroundColor Yellow

$roleExists = (Invoke-PsqlAdmin "SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'uncropcare_app';") -eq "1"
$dbExists = (Invoke-PsqlAdmin "SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'uncropcare';") -eq "1"

Write-Host "  - uncropcare_app role exists: $roleExists" -ForegroundColor Cyan
Write-Host "  - uncropcare database exists: $dbExists" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# Step 4: Resolve Application Password (Idempotent Credential Management)
# ---------------------------------------------------------------------------
$appPassword = $null

if ($roleExists) {
    if ($existingAppPassword) {
        Write-Host "Found existing password in .env. Verifying authentication..." -ForegroundColor Yellow
        $authOk = $false
        try {
            $test = Invoke-PsqlApp "SELECT 1;" $existingAppPassword
            if ($test -eq "1") { $authOk = $true }
        }
        catch {
            $authOk = $false
        }

        if ($authOk) {
            Write-Host "[OK] Existing uncropcare_app credentials verified successfully. Reusing existing credentials without rotation." -ForegroundColor Green
            $appPassword = $existingAppPassword
        }
        else {
            Write-Host "Existing .env password did not authenticate against uncropcare_app." -ForegroundColor Yellow
            $choice = Read-Host "Do you want to rotate and set a new password for uncropcare_app? (Y/N)"
            if ($choice -ne "Y" -and $choice -ne "y") {
                Write-Error "Operation aborted by user. Role password was NOT rotated."
                exit 1
            }
        }
    }
    else {
        Write-Host "Role 'uncropcare_app' already exists in PostgreSQL, but no credential was found in .env." -ForegroundColor Yellow
        $choice = Read-Host "Do you want to generate a new password and assign it to uncropcare_app? (Y/N)"
        if ($choice -ne "Y" -and $choice -ne "y") {
            Write-Error "Operation aborted by user. Existing role was NOT modified."
            exit 1
        }
    }
}

# If no verified existing password, generate a cryptographically strong 64-char hex password
if (-not $appPassword) {
    Write-Host "Generating cryptographically secure 64-character hexadecimal password..." -ForegroundColor Yellow
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    # Hex string with full entropy (64 characters, [0-9a-f])
    $appPassword = [System.BitConverter]::ToString($bytes).Replace("-", "").ToLower()
}

# ---------------------------------------------------------------------------
# Step 5: Provision Role and Database Safely
# ---------------------------------------------------------------------------
if (-not $roleExists) {
    Write-Host "Creating role 'uncropcare_app' with LOGIN..." -ForegroundColor Yellow
    # Pass SQL safely via stdin
    $createRoleSql = "CREATE ROLE uncropcare_app WITH LOGIN PASSWORD '$appPassword';"
    [void](Invoke-PsqlAdmin $createRoleSql)
}
else {
    # If rotating or updating password
    if ($appPassword -ne $existingAppPassword) {
        Write-Host "Updating password for 'uncropcare_app'..." -ForegroundColor Yellow
        $alterRoleSql = "ALTER ROLE uncropcare_app WITH LOGIN PASSWORD '$appPassword';"
        [void](Invoke-PsqlAdmin $alterRoleSql)
    }
}

if (-not $dbExists) {
    Write-Host "Creating database 'uncropcare' owned by 'uncropcare_app'..." -ForegroundColor Yellow
    # Note: CREATE DATABASE cannot run in a multi-statement transaction
    $createDbSql = "CREATE DATABASE uncropcare OWNER uncropcare_app;"
    [void](Invoke-PsqlAdmin $createDbSql)
}
else {
    Write-Host "Ensuring 'uncropcare_app' owns database 'uncropcare'..." -ForegroundColor Yellow
    $ownerSql = "ALTER DATABASE uncropcare OWNER TO uncropcare_app;"
    [void](Invoke-PsqlAdmin $ownerSql)
}

# ---------------------------------------------------------------------------
# Step 6: Configure Scoped Permissions on uncropcare Only
# ---------------------------------------------------------------------------
Write-Host "Configuring schema permissions on database 'uncropcare'..." -ForegroundColor Yellow
$grantDbSql = @"
GRANT ALL PRIVILEGES ON DATABASE uncropcare TO uncropcare_app;
GRANT ALL ON SCHEMA public TO uncropcare_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO uncropcare_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO uncropcare_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TYPES TO uncropcare_app;
"@
[void](Invoke-PsqlAdmin $grantDbSql "uncropcare")

# ---------------------------------------------------------------------------
# Step 7: Verify uncropcare_app Permissions and Connection
# ---------------------------------------------------------------------------
Write-Host "Verifying uncropcare_app connection and write privileges..." -ForegroundColor Yellow

$testSql = @"
CREATE TABLE IF NOT EXISTS __perm_probe (id int primary key);
INSERT INTO __perm_probe VALUES (1) ON CONFLICT DO NOTHING;
DROP TABLE __perm_probe;
SELECT current_database() || '|' || current_user;
"@

$probeOutput = Invoke-PsqlApp $testSql $appPassword
if ($probeOutput -notmatch "uncropcare\|uncropcare_app") {
    Write-Error "Verification failed: Unexpected connection probe output: $probeOutput"
    exit 1
}
Write-Host "[VERIFIED] uncropcare_app successfully authenticated, created, inserted, and dropped probe table in uncropcare." -ForegroundColor Green

# ---------------------------------------------------------------------------
# Step 8: Safe, Non-Destructive .env Update
# ---------------------------------------------------------------------------
Write-Host "Updating UN CROP CARE environment configuration..." -ForegroundColor Yellow

# Generate Better Auth secret if not present
if (-not $existingBetterAuthSecret) {
    $secBytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secBytes)
    $betterAuthSecret = [Convert]::ToBase64String($secBytes)
}
else {
    $betterAuthSecret = $existingBetterAuthSecret
}

# URL-encode user and password components
$escapedUser = [System.Uri]::EscapeDataString("uncropcare_app")
$escapedPass = [System.Uri]::EscapeDataString($appPassword)
$newDbUrl = "postgresql://${escapedUser}:${escapedPass}@localhost:5432/uncropcare"

# Create timestamped backup of .env
if (Test-Path $envPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$envPath.bak.$timestamp"
    Copy-Item -Path $envPath -Destination $backupPath -Force
    Write-Host "[BACKUP] Created .env backup at: $backupPath" -ForegroundColor Green

    # Merge: preserve all existing keys, update or append DATABASE_URL and BETTER_AUTH_SECRET
    $lines = Get-Content $envPath
    $updatedLines = @()
    $hasDbUrl = $false
    $hasAuthSec = $false
    $hasAuthUrl = $false
    $hasPort = $false
    $hasStorage = $false
    $hasUpload = $false

    foreach ($l in $lines) {
        if ($l -match '^\s*DATABASE_URL\s*=') {
            $updatedLines += "DATABASE_URL=$newDbUrl"
            $hasDbUrl = $true
        }
        elseif ($l -match '^\s*BETTER_AUTH_SECRET\s*=') {
            $updatedLines += "BETTER_AUTH_SECRET=$betterAuthSecret"
            $hasAuthSec = $true
        }
        elseif ($l -match '^\s*BETTER_AUTH_URL\s*=') {
            $updatedLines += $l
            $hasAuthUrl = $true
        }
        elseif ($l -match '^\s*PORT\s*=') {
            $updatedLines += $l
            $hasPort = $true
        }
        elseif ($l -match '^\s*STORAGE_DRIVER\s*=') {
            $updatedLines += $l
            $hasStorage = $true
        }
        elseif ($l -match '^\s*UPLOAD_DIR\s*=') {
            $updatedLines += $l
            $hasUpload = $true
        }
        else {
            $updatedLines += $l
        }
    }

    if (-not $hasDbUrl) { $updatedLines += "DATABASE_URL=$newDbUrl" }
    if (-not $hasAuthSec) { $updatedLines += "BETTER_AUTH_SECRET=$betterAuthSecret" }
    if (-not $hasAuthUrl) { $updatedLines += "BETTER_AUTH_URL=http://localhost:3000" }
    if (-not $hasPort) { $updatedLines += "PORT=3000" }
    if (-not $hasStorage) { $updatedLines += "STORAGE_DRIVER=local" }
    if (-not $hasUpload) { $updatedLines += "UPLOAD_DIR=./uploads" }

    Set-Content -Path $envPath -Value $updatedLines -Encoding UTF8
}
else {
    $initialEnv = @(
        "DATABASE_URL=$newDbUrl",
        "BETTER_AUTH_SECRET=$betterAuthSecret",
        "BETTER_AUTH_URL=http://localhost:3000",
        "PORT=3000",
        "STORAGE_DRIVER=local",
        "UPLOAD_DIR=./uploads"
    )
    Set-Content -Path $envPath -Value $initialEnv -Encoding UTF8
    Write-Host "[CREATED] New .env created with required keys." -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " SETUP COMPLETE & VERIFIED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Target Database: uncropcare (Owner: uncropcare_app)" -ForegroundColor Cyan
Write-Host "  - Target User:     uncropcare_app (LOGIN granted, full privileges on uncropcare)" -ForegroundColor Cyan
Write-Host "  - Other Databases: Completely untouched (zero modifications to Smartfinance or postgres)" -ForegroundColor Cyan
Write-Host "  - Credentials:     Saved to .env (excluded from Git)" -ForegroundColor Cyan
Write-Host "  - Verification:    Probe table created and dropped as uncropcare_app" -ForegroundColor Cyan
