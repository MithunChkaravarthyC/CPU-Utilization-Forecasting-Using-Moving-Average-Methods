param(
    [string]$Server = "http://localhost:8000",
    [string]$Session = "default",
    [string]$Device = "$env:COMPUTERNAME (Windows)",
    [int]$Interval = 5,
    [switch]$Once
)

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
        # Native Windows Performance Counter for exact CPU usage percentage
        $cpuRaw = $null
        try {
            $cpuRaw = (Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -ErrorAction SilentlyContinue | Where-Object Name -eq '_Total').PercentProcessorTime
        } catch {
            $cpuRaw = $null
        }

        if ($null -eq $cpuRaw) {
            try {
                $cpuRaw = ((Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue).LoadPercentage | Measure-Object -Average).Average
            } catch {
                $cpuRaw = 15.0
            }
        }

        $cpu = [math]::Round([double]$cpuRaw, 1)
        if ($cpu -lt 0) { $cpu = 0.0 }
        if ($cpu -gt 100) { $cpu = 100.0 }

        $barLength = 18
        $filled = [math]::Round($barLength * $cpu / 100.0)
        $unfilled = $barLength - $filled
        if ($unfilled -lt 0) { $unfilled = 0 }
        $bar = ("=" * $filled) + ("-" * $unfilled)

        $timeStr = (Get-Date).ToString("HH:mm:ss")
        $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

        $payload = @{
            session_id = $Session
            cpu_utilization = $cpu
            timestamp = $timestamp
            device_name = $Device
            source = "LIVE"
        } | ConvertTo-Json -Compress

        Write-Host "[$timeStr] CPU [$bar] $($cpu.ToString('0.0'))% " -NoNewline

        try {
            $resp = Invoke-RestMethod -Uri $Endpoint -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 6
            $samples++
            Write-Host "-> Streamed (Total: $samples)" -ForegroundColor Green
            if ($Once) { break }
        } catch {
            Write-Host "-> Retrying next interval ($($_.Exception.Message))" -ForegroundColor Yellow
        }

        Start-Sleep -Seconds $Interval
    } catch [System.Management.Automation.PipelineStoppedException] {
        break
    } catch {
        Write-Host "`nNotice: $($_.Exception.Message). Waiting 5s..." -ForegroundColor DarkYellow
        Start-Sleep -Seconds 5
    }
}
Write-Host "`nStreaming stopped. Total measurements sent: $samples" -ForegroundColor Cyan
