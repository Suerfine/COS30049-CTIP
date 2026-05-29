<#
.SYNOPSIS
    One-shot setup for accessing the CTIP app from other devices on the same WiFi/hotspot.

.DESCRIPTION
    Detects the active LAN IP, regenerates mkcert certs for it, rewrites the relevant
    keys in backend/.env and frontend/.env, and opens Windows Firewall on the four
    ports the stack uses (5000 backend, 8000 AI, 8081 Metro, 8443 HTTPS proxy).

    Re-run this every time you switch networks (different WiFi, phone hotspot, etc.).

.PARAMETER SkipFirewall
    Skip the Windows Firewall rule changes (which require Administrator).
    Use this when you only want to refresh certs/env without elevating.

.PARAMETER Ip
    Override the auto-detected LAN IP. Useful when you have multiple active
    adapters and the wrong one is picked.

.EXAMPLE
    .\scripts\lan-setup.ps1
.EXAMPLE
    .\scripts\lan-setup.ps1 -Ip 192.168.1.42
.EXAMPLE
    .\scripts\lan-setup.ps1 -SkipFirewall
#>

param(
    [switch]$SkipFirewall,
    [string]$Ip
)

$ErrorActionPreference = 'Stop'

$RepoRoot   = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $RepoRoot 'backend'
$FrontendDir = Join-Path $RepoRoot 'frontend'
$BackendEnv = Join-Path $BackendDir '.env'
$FrontendEnv = Join-Path $FrontendDir '.env'

function Write-Section($msg) {
    Write-Host ''
    Write-Host "=== $msg ===" -ForegroundColor Cyan
}

function Get-ActiveLanIp {
    # Pick the adapter that actually has a default gateway (i.e. the one
    # carrying real traffic). Exclude virtual switches.
    $candidates = Get-NetIPConfiguration |
        Where-Object { $null -ne $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } |
        Where-Object { $_.InterfaceAlias -notmatch '(vEthernet|WSL|VirtualBox|VMware|Loopback)' }

    if (-not $candidates) {
        throw "No active network adapter with a default gateway found. Are you connected to WiFi?"
    }

    if ($candidates.Count -gt 1) {
        Write-Host "Multiple active adapters detected:" -ForegroundColor Yellow
        $candidates | ForEach-Object {
            Write-Host ("  - {0}: {1}" -f $_.InterfaceAlias, $_.IPv4Address.IPAddress)
        }
        Write-Host "Picking the first; re-run with -Ip <addr> to override." -ForegroundColor Yellow
    }

    return $candidates[0].IPv4Address.IPAddress
}

function Assert-MkcertInstalled {
    $mkcert = Get-Command mkcert -ErrorAction SilentlyContinue
    if (-not $mkcert) {
        Write-Host "mkcert is not installed or not on PATH." -ForegroundColor Red
        Write-Host "Install with: winget install FiloSottile.mkcert" -ForegroundColor Yellow
        Write-Host "Then re-run this script." -ForegroundColor Yellow
        throw "mkcert missing"
    }
}

function Invoke-Mkcert {
    param([string]$LanIp)

    Push-Location $BackendDir
    try {
        Write-Host "Installing mkcert local CA (idempotent)..."
        & mkcert -install | Out-Host

        Write-Host "Generating cert for $LanIp ..."
        & mkcert $LanIp localhost 127.0.0.1 | Out-Host

        $certFile = "$LanIp+2.pem"
        $keyFile  = "$LanIp+2-key.pem"
        if (-not (Test-Path (Join-Path $BackendDir $certFile))) {
            throw "Expected cert file $certFile was not produced by mkcert."
        }
        return @{ Cert = $certFile; Key = $keyFile }
    } finally {
        Pop-Location
    }
}

function Update-EnvFile {
    param(
        [string]$Path,
        [hashtable]$Updates
    )

    if (-not (Test-Path $Path)) {
        throw "Env file not found: $Path"
    }

    $lines = Get-Content $Path -Encoding UTF8
    $seen = @{}
    $newLines = foreach ($line in $lines) {
        $match = [regex]::Match($line, '^\s*([A-Z_][A-Z0-9_]*)\s*=')
        if ($match.Success -and $Updates.ContainsKey($match.Groups[1].Value)) {
            $key = $match.Groups[1].Value
            $seen[$key] = $true
            "$key=$($Updates[$key])"
        } else {
            $line
        }
    }

    # Append any keys that were not present in the file.
    foreach ($key in $Updates.Keys) {
        if (-not $seen.ContainsKey($key)) {
            $newLines += "$key=$($Updates[$key])"
        }
    }

    # Write back with UTF-8 (no BOM) so Node's dotenv reads cleanly.
    [System.IO.File]::WriteAllLines($Path, $newLines, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Updated $Path"
}

function Test-IsAdmin {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Set-FirewallRules {
    $ports = @(5000, 5001, 8000, 8081, 8443)
    foreach ($port in $ports) {
        $name = "CTIP-LAN-$port"
        $existing = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
        if ($existing) {
            Write-Host "Firewall rule '$name' already exists - skipping."
            continue
        }
        New-NetFirewallRule -DisplayName $name `
            -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow `
            -Profile Private,Domain | Out-Null
        Write-Host "Added firewall rule '$name' (TCP $port inbound, private+domain profiles)."
    }
}

# --- main -------------------------------------------------------------------

Write-Section 'Detecting LAN IP'
if (-not $Ip) {
    $Ip = Get-ActiveLanIp
}
Write-Host "Using LAN IP: $Ip" -ForegroundColor Green

Write-Section 'Regenerating mkcert certificates'
Assert-MkcertInstalled
$certs = Invoke-Mkcert -LanIp $Ip

Write-Section 'Updating backend/.env'
Update-EnvFile -Path $BackendEnv -Updates @{
    'HTTPS_ENABLED'      = 'true'
    'HTTPS_KEY_PATH'     = "`"$($certs.Key)`""
    'HTTPS_CERT_PATH'    = "`"$($certs.Cert)`""
    'FRONTEND_URL'       = "https://$Ip`:8443"
    # Plain HTTP listener for native clients that can't trust the dev TLS cert.
    'HTTP_FALLBACK_PORT' = '5001'
}

Write-Section 'Updating frontend/.env'
# Web talks HTTPS directly to the backend on 5000 (browser can accept the cert).
# Native talks plain HTTP to the backend's fallback listener on 5001, because
# React Native can't trust the mkcert CA and has no "proceed anyway" prompt.
Update-EnvFile -Path $FrontendEnv -Updates @{
    'EXPO_PUBLIC_API_HOST'      = $Ip
    'EXPO_PUBLIC_API_PORT'      = '5000'
    'EXPO_PUBLIC_API_PROTOCOL'  = 'https'
    'EXPO_PUBLIC_API_HTTP_PORT' = '5001'
    'EXPO_PUBLIC_AI_HOST'       = $Ip
    'EXPO_PUBLIC_AI_PORT'       = '8000'
}

Write-Section 'Windows Firewall'
if ($SkipFirewall) {
    Write-Host "Skipped (use without -SkipFirewall to configure firewall)." -ForegroundColor Yellow
} elseif (-not (Test-IsAdmin)) {
    Write-Host "Not running as Administrator - skipping firewall rules." -ForegroundColor Yellow
    Write-Host "Either re-launch this script in an elevated PowerShell, or run:" -ForegroundColor Yellow
    Write-Host "  New-NetFirewallRule -DisplayName 'CTIP-LAN-<port>' -Direction Inbound -Protocol TCP -LocalPort <port> -Action Allow" -ForegroundColor Yellow
    Write-Host "for each of: 5000, 5001, 8000, 8081, 8443" -ForegroundColor Yellow
} else {
    Set-FirewallRules
}

Write-Section 'Done - share these URLs with the other device'
Write-Host ("  Web app:           https://{0}:8443" -f $Ip) -ForegroundColor Green
Write-Host ("  Backend API (web): https://{0}:5000/api" -f $Ip) -ForegroundColor Green
Write-Host ("  Backend API (app): http://{0}:5001/api  (native, no TLS)" -f $Ip) -ForegroundColor Green
Write-Host ("  AI WebSocket:      ws://{0}:8000/ws/detect" -f $Ip) -ForegroundColor Green
Write-Host ''
Write-Host 'Next: start the three services in separate terminals:' -ForegroundColor Cyan
Write-Host '  1. cd ai      ; uvicorn server:app --host 0.0.0.0 --port 8000'
Write-Host '  2. cd backend ; npm run dev'
Write-Host '  3. cd frontend; npm start'
Write-Host ''
Write-Host 'On the second device, the browser will warn about the cert.'
Write-Host 'Either click through, or install the mkcert root CA from:'
Write-Host '  (run on host)  mkcert -CAROOT'
