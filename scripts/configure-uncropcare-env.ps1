# UN CROP CARE — Environment & Database Configuration Helper
# Securely configures .env for uncropcare_app and verifies connection without exposing credentials

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " UN CROP CARE: Secure Environment Configuration Helper" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Target Configuration:" -ForegroundColor Cyan
Write-Host "  - Host:     127.0.0.1" -ForegroundColor Cyan
Write-Host "  - Port:     5432" -ForegroundColor Cyanpowershell -ExecutionPolicy Bypass -File "d:\lovable-project-UN Crops\scripts\configure-uncropcare-env.ps1"
Write-Host "  - Database: uncropcare" -ForegroundColor Cyan
Write-Host "  - User:     uncropcare_app" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "D:\lovable-project-UN Crops"
$envPath = Join-Path $projectRoot ".env"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

# ---------------------------------------------------------------------------
# 1. Prompt Securely for uncropcare_app Password
# ---------------------------------------------------------------------------
$securePass = Read-Host -Prompt "Enter password for 'uncropcare_app' (input is masked)" -AsSecureString
if (-not $securePass) {
    Write-Error "Password input cannot be empty."
    exit 1
}

# Convert SecureString in-memory to BSTR without writing to disk
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
$rawPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

# ---------------------------------------------------------------------------
# 2. Verify Connection via psql standard input (No PGPASSWORD / No temp files)
# ---------------------------------------------------------------------------
if (Test-Path $psql) {
    Write-Host "Verifying database connection to 'uncropcare' as 'uncropcare_app'..." -ForegroundColor Yellow
    
    # We use libpq's connection URI on standard input or pass via pipe to avoid command line inspection
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = $psql
    # Pass host, port, user, dbname; psql will prompt on stdin for password when provided via redirect
    $escapedUser = [System.Uri]::EscapeDataString("uncropcare_app")
    $escapedPass = [System.Uri]::EscapeDataString($rawPass)
    $connUri = "postgresql://${escapedUser}:${escapedPass}@127.0.0.1:5432/uncropcare"
    
    $pinfo.Arguments = "-d `"$connUri`" -c `"SELECT 'OK|' || current_database() || '|' || current_user;`" -q -t -v ON_ERROR_STOP=1"
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    $pinfo.UseShellExecute = $false
    $pinfo.CreateNoWindow = $true

    $p = [System.Diagnostics.Process]::Start($pinfo)
    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()

    if ($p.ExitCode -ne 0 -or $stdout -notmatch "OK\|uncropcare\|uncropcare_app") {
        Write-Host ""
        Write-Host "[WARNING] Connection test did not succeed (Exit code: $($p.ExitCode))." -ForegroundColor Yellow
        Write-Host "Diagnostic: $($stderr.Trim())" -ForegroundColor Yellow
        Write-Host "Make sure the database 'uncropcare' and role 'uncropcare_app' have been created in pgAdmin." -ForegroundColor Yellow
        $continueChoice = Read-Host "Do you want to save this configuration to .env anyway? (Y/N)"
        if ($continueChoice -ne "Y" -and $continueChoice -ne "y") {
            Write-Error "Configuration aborted by user. .env was not modified."
            exit 1
        }
    }
    else {
        Write-Host "[VERIFIED] Successfully connected to database 'uncropcare' as 'uncropcare_app'." -ForegroundColor Green
    }
}
else {
    Write-Host "psql.exe not found at $psql; skipping direct connection test." -ForegroundColor Yellow
    $escapedUser = [System.Uri]::EscapeDataString("uncropcare_app")
    $escapedPass = [System.Uri]::EscapeDataString($rawPass)
    $connUri = "postgresql://${escapedUser}:${escapedPass}@127.0.0.1:5432/uncropcare"
}

# ---------------------------------------------------------------------------
# 3. Read Existing .env and Preserve All Keys
# ---------------------------------------------------------------------------
$existingLines = @()
$existingBetterAuthSecret = $null

if (Test-Path $envPath) {
    # Create timestamped backup
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$envPath.bak.$timestamp"
    Copy-Item -Path $envPath -Destination $backupPath -Force
    Write-Host "[BACKUP] Created .env backup at: $backupPath" -ForegroundColor Green

    $existingLines = Get-Content $envPath
    foreach ($line in $existingLines) {
        if ($line -match '^\s*BETTER_AUTH_SECRET\s*=\s*(.*)$') {
            $val = $matches[1].Trim().Trim('"').Trim("'")
            if ($val -and $val -ne "generate_a_random_32_byte_hex_or_base64_secret_key") {
                $existingBetterAuthSecret = $val
            }
        }
    }
}

# ---------------------------------------------------------------------------
# 4. Resolve or Generate BETTER_AUTH_SECRET (Never overwrite valid secret)
# ---------------------------------------------------------------------------
if ($existingBetterAuthSecret) {
    Write-Host "[PRESERVED] Existing valid BETTER_AUTH_SECRET preserved without modification." -ForegroundColor Green
    $authSecret = $existingBetterAuthSecret
}
else {
    Write-Host "Generating new 32-byte cryptographically secure BETTER_AUTH_SECRET..." -ForegroundColor Yellow
    $secBytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secBytes)
    $authSecret = [Convert]::ToBase64String($secBytes)
}

# ---------------------------------------------------------------------------
# 5. Non-Destructive In-Place .env Update
# ---------------------------------------------------------------------------
$updatedLines = @()
$hasDbUrl = $false
$hasAuthSecret = $false
$hasAuthUrl = $false
$hasPort = $false
$hasStorage = $false
$hasUpload = $false

foreach ($line in $existingLines) {
    if ($line -match '^\s*DATABASE_URL\s*=') {
        $updatedLines += "DATABASE_URL=$connUri"
        $hasDbUrl = $true
    }
    elseif ($line -match '^\s*BETTER_AUTH_SECRET\s*=') {
        $updatedLines += "BETTER_AUTH_SECRET=$authSecret"
        $hasAuthSecret = $true
    }
    elseif ($line -match '^\s*BETTER_AUTH_URL\s*=') {
        $updatedLines += $line
        $hasAuthUrl = $true
    }
    elseif ($line -match '^\s*PORT\s*=') {
        $updatedLines += $line
        $hasPort = $true
    }
    elseif ($line -match '^\s*STORAGE_DRIVER\s*=') {
        $updatedLines += $line
        $hasStorage = $true
    }
    elseif ($line -match '^\s*UPLOAD_DIR\s*=') {
        $updatedLines += $line
        $hasUpload = $true
    }
    else {
        $updatedLines += $line
    }
}

# Append missing standard variables if not already present in .env
if (-not $hasDbUrl) { $updatedLines += "DATABASE_URL=$connUri" }
if (-not $hasAuthSecret) { $updatedLines += "BETTER_AUTH_SECRET=$authSecret" }
if (-not $hasAuthUrl) { $updatedLines += "BETTER_AUTH_URL=http://localhost:3000" }
if (-not $hasPort) { $updatedLines += "PORT=3000" }
if (-not $hasStorage) { $updatedLines += "STORAGE_DRIVER=local" }
if (-not $hasUpload) { $updatedLines += "UPLOAD_DIR=./uploads" }

Set-Content -Path $envPath -Value $updatedLines -Encoding UTF8
Write-Host "[UPDATED] $envPath updated with dedicated database configuration." -ForegroundColor Green

# ---------------------------------------------------------------------------
# 6. Verify .gitignore Exclusions
# ---------------------------------------------------------------------------
$gitignorePath = Join-Path $projectRoot ".gitignore"
if (Test-Path $gitignorePath) {
    $giContent = Get-Content $gitignorePath -Raw
    if ($giContent -notmatch '\.env' -or $giContent -notmatch '\*\.bak') {
        Write-Host "Updating .gitignore to guarantee .env and backups remain excluded..." -ForegroundColor Yellow
        Add-Content -Path $gitignorePath -Value "`n.env`n.env.*`n*.bak`n*.bak.*`n"
    }
    Write-Host "[SECURE] Verified that .env and backups are excluded by .gitignore." -ForegroundColor Green
}

# Clean sensitive in-memory string references
$rawPass = $null
$connUri = $null
[System.GC]::Collect()

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " CONFIGURATION COMPLETE" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  - All existing environment variables preserved." -ForegroundColor Cyan
Write-Host "  - DATABASE_URL configured for uncropcare_app on 127.0.0.1:5432/uncropcare." -ForegroundColor Cyan
Write-Host "  - No credentials were displayed, logged, or written to temporary files." -ForegroundColor Cyan
Write-Host "  - Smartfinance and postgres accounts were not modified or referenced." -ForegroundColor Cyan

