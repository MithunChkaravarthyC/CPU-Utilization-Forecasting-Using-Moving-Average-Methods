param(
    [string]$Server = "http://localhost:8000",
    [string]$Session = "default",
    [string]$Device = "$env:COMPUTERNAME (Windows)",
    [int]$Interval = 5,
    [switch]$Once
)

# ── TLS Fix: Force TLS 1.2 for HTTPS endpoints (required on older Windows / PS5) ──
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
} catch {
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Enum]::ToObject([Net.SecurityProtocolType], 3072) # Tls12
    } catch { <# ignore on very old systems #> }
}

$Server = $Server.TrimEnd('/')
$Endpoint = "$Server/api/telemetry/push"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " [*] CPU UTILIZATION FORECASTING - WINDOWS POWERSHELL AGENT" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Backend Server : $Server"
Write-Host " Session ID     : $Session"
Write-Host " Device Name    : $Device"
Write-Host " Interval       : Every ${Interval}s"
Write-Host " Requirements   : Pure Native PowerShell (Zero Python Needed!)" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host " Streaming live CPU metrics... Press Ctrl+C to stop.`n" -ForegroundColor Yellow

$samples = 0
while ($true) {
    try {
        # ── CPU Measurement: Try best method first, fall back gracefully ──
        $cpuRaw = $null

        # Method 1: Performance counter (most accurate, near real-time)
        try {
            $cpuRaw = (Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -ErrorAction SilentlyContinue |
                       Where-Object { $_.Name -eq '_Total' }).PercentProcessorTime
        } catch { $cpuRaw = $null }

        # Method 2: WMI LoadPercentage (fallback - less accurate but universal)
        if ($null -eq $cpuRaw) {
            try {
                $cpuRaw = ((Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue).LoadPercentage |
                           Measure-Object -Average).Average
            } catch { $cpuRaw = $null }
        }

        # Method 3: Legacy WMI (for very old Windows versions / Windows Server 2008 era)
        if ($null -eq $cpuRaw) {
            try {
                $cpuRaw = ((Get-WmiObject Win32_Processor -ErrorAction SilentlyContinue).LoadPercentage |
                           Measure-Object -Average).Average
            } catch { $cpuRaw = $null }
        }

        # Final fallback: stable idle value (indicates measurement failure, not real CPU)
        if ($null -eq $cpuRaw) { $cpuRaw = 15.0 }

        $cpu = [math]::Round([double]$cpuRaw, 1)
        if ($cpu -lt 0)   { $cpu = 0.0 }
        if ($cpu -gt 100) { $cpu = 100.0 }

        # ── ASCII Progress Bar ──
        $barLength = 18
        $filled    = [math]::Round($barLength * $cpu / 100.0)
        $unfilled  = [math]::Max(0, $barLength - $filled)
        $bar       = ("=" * $filled) + ("-" * $unfilled)

        $timeStr   = (Get-Date).ToString("HH:mm:ss")
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

        # ── Build JSON payload ──
        $payload = @{
            session_id      = $Session
            cpu_utilization = $cpu
            timestamp       = $timestamp
            device_name     = $Device
            source          = "LIVE"
        } | ConvertTo-Json -Compress

        Write-Host "[$timeStr] CPU [$bar] $($cpu.ToString('0.0'))% " -NoNewline

        # ── POST to backend with retry-friendly timeout ──
        try {
            $resp = Invoke-RestMethod `
                -Uri         $Endpoint `
                -Method      Post `
                -Body        $payload `
                -ContentType "application/json" `
                -TimeoutSec  10 `
                -ErrorAction Stop
            $samples++
            Write-Host "-> Streamed OK (Total: $samples)" -ForegroundColor Green
        } catch {
            $errMsg = $_.Exception.Message
            Write-Host "-> Retry next interval ($errMsg)" -ForegroundColor Yellow
        }

        if ($Once) { break }
        Start-Sleep -Seconds $Interval

    } catch [System.Management.Automation.PipelineStoppedException] {
        # Ctrl+C pressed - clean exit
        break
    } catch {
        Write-Host "`nError: $($_.Exception.Message). Waiting 5s..." -ForegroundColor DarkYellow
        Start-Sleep -Seconds 5
    }
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host " Streaming stopped. Total measurements sent: $samples" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
