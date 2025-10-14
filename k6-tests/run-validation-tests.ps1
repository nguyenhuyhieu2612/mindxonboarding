
param(
    [string]$ApiUrl = "",
    [switch]$SkipLatency,
    [switch]$SkipTraffic,
    [switch]$SkipErrorRate,
    [switch]$SkipCapacity
)

$ColorHeader = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor $ColorHeader
Write-Host "    k6 Validation Test Suite - Week 2" -ForegroundColor $ColorHeader
Write-Host "    Azure Application Insights Metrics Validation" -ForegroundColor $ColorHeader
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor $ColorHeader
Write-Host ""

Write-Host "Checking k6 installation..." -ForegroundColor $ColorWarning
try {
    $k6Version = k6 version 2>&1
    Write-Host "✓ k6 is installed: $k6Version" -ForegroundColor $ColorSuccess
} catch {
    Write-Host "✗ k6 is not installed!" -ForegroundColor $ColorError
    Write-Host "Install with: choco install k6" -ForegroundColor $ColorWarning
    exit 1
}

if ($ApiUrl -eq "") {
    if ($env:API_URL) {
        $ApiUrl = $env:API_URL
        Write-Host "Using API_URL from environment: $ApiUrl" -ForegroundColor $ColorSuccess
    } else {
        Write-Host ""
        Write-Host "API URL not provided!" -ForegroundColor $ColorError
        Write-Host "Usage:" -ForegroundColor $ColorWarning
        Write-Host "  .\run-validation-tests.ps1 -ApiUrl https://your-app.com" -ForegroundColor $ColorWarning
        Write-Host "  OR set environment variable:" -ForegroundColor $ColorWarning
        Write-Host '  $env:API_URL="https://your-app.com"' -ForegroundColor $ColorWarning
        exit 1
    }
}

Write-Host ""
Write-Host "Testing API connectivity..." -ForegroundColor $ColorWarning
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -Method Get -TimeoutSec 10 -UseBasicParsing
    Write-Host "✓ API is reachable (Status: $($response.StatusCode))" -ForegroundColor $ColorSuccess
} catch {
    Write-Host "✗ Cannot reach API at $ApiUrl" -ForegroundColor $ColorError
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor $ColorError
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

$env:API_URL = $ApiUrl

$tests = @()

if (-not $SkipLatency) {
    $tests += @{
        Name = "Latency Validation"
        File = "validate-latency.js"
        Description = "Validates P50, P95, P99 latency metrics"
        Duration = "~9 minutes"
    }
}

if (-not $SkipTraffic) {
    $tests += @{
        Name = "Traffic Volume Validation"
        File = "validate-traffic.js"
        Description = "Validates request counting and throughput"
        Duration = "~6 minutes"
    }
}

if (-not $SkipErrorRate) {
    $tests += @{
        Name = "Error Rate Validation"
        File = "validate-error-rate.js"
        Description = "Validates 4xx, 5xx, and timeout tracking"
        Duration = "~3 minutes"
    }
}

if (-not $SkipCapacity) {
    $tests += @{
        Name = "Capacity Validation"
        File = "validate-capacity.js"
        Description = "Validates CPU, Memory, and resource metrics"
        Duration = "~10 minutes"
    }
}

if ($tests.Count -eq 0) {
    Write-Host "No tests to run (all tests skipped)" -ForegroundColor $ColorWarning
    exit 0
}

# Display test plan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor $ColorHeader
Write-Host "Test Plan:" -ForegroundColor $ColorHeader
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor $ColorHeader
$totalDuration = 0
for ($i = 0; $i -lt $tests.Count; $i++) {
    $test = $tests[$i]
    Write-Host "[$($i+1)/$($tests.Count)] $($test.Name)" -ForegroundColor $ColorWarning
    Write-Host "    File: $($test.File)" -ForegroundColor Gray
    Write-Host "    Purpose: $($test.Description)" -ForegroundColor Gray
    Write-Host "    Duration: $($test.Duration)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Target API: $ApiUrl" -ForegroundColor $ColorSuccess
Write-Host ""

$confirm = Read-Host "Start validation tests? (Y/n)"
if ($confirm -eq "n" -or $confirm -eq "N") {
    Write-Host "Tests cancelled" -ForegroundColor $ColorWarning
    exit 0
}

$results = @()
$startTime = Get-Date

for ($i = 0; $i -lt $tests.Count; $i++) {
    $test = $tests[$i]
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor $ColorHeader
    Write-Host "[$($i+1)/$($tests.Count)] Running: $($test.Name)" -ForegroundColor $ColorHeader
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor $ColorHeader
    Write-Host ""
    
    $testStartTime = Get-Date
    
    try {
        k6 run $test.File
        $exitCode = $LASTEXITCODE
        
        $testEndTime = Get-Date
        $testDuration = ($testEndTime - $testStartTime).TotalSeconds
        
        if ($exitCode -eq 0) {
            Write-Host ""
            Write-Host "✓ Test completed successfully!" -ForegroundColor $ColorSuccess
            $results += @{
                Name = $test.Name
                Status = "PASSED"
                Duration = $testDuration
            }
        } else {
            Write-Host ""
            Write-Host "✗ Test failed with exit code: $exitCode" -ForegroundColor $ColorError
            $results += @{
                Name = $test.Name
                Status = "FAILED"
                Duration = $testDuration
            }
        }
    } catch {
        $testEndTime = Get-Date
        $testDuration = ($testEndTime - $testStartTime).TotalSeconds
        
        Write-Host ""
        Write-Host "✗ Test error: $($_.Exception.Message)" -ForegroundColor $ColorError
        $results += @{
            Name = $test.Name
            Status = "ERROR"
            Duration = $testDuration
        }
    }
    
    if ($i -lt $tests.Count - 1) {
        Write-Host ""
        Write-Host "Waiting 10 seconds before next test..." -ForegroundColor $ColorWarning
        Start-Sleep -Seconds 10
    }
}

$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalMinutes

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor $ColorHeader
Write-Host "    Test Results Summary" -ForegroundColor $ColorHeader
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor $ColorHeader
Write-Host ""

foreach ($result in $results) {
    $statusColor = $ColorSuccess
    $statusIcon = "✓"
    
    if ($result.Status -eq "FAILED") {
        $statusColor = $ColorError
        $statusIcon = "✗"
    } elseif ($result.Status -eq "ERROR") {
        $statusColor = $ColorError
        $statusIcon = "✗"
    }
    
    Write-Host "$statusIcon $($result.Name)" -ForegroundColor $statusColor
    Write-Host "   Status: $($result.Status) | Duration: $([math]::Round($result.Duration, 2))s" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Total Duration: $([math]::Round($totalDuration, 2)) minutes" -ForegroundColor $ColorWarning

$passedCount = ($results | Where-Object { $_.Status -eq "PASSED" }).Count
$failedCount = ($results | Where-Object { $_.Status -ne "PASSED" }).Count

Write-Host ""
if ($failedCount -eq 0) {
    Write-Host "✓ All tests passed! ($passedCount/$($results.Count))" -ForegroundColor $ColorSuccess
} else {
    Write-Host "✗ Some tests failed: $passedCount passed, $failedCount failed" -ForegroundColor $ColorError
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor $ColorHeader
Write-Host "    Next Steps: Verify in Application Insights" -ForegroundColor $ColorHeader
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor $ColorHeader
Write-Host ""
Write-Host "1. Open Azure Portal → Application Insights" -ForegroundColor $ColorWarning
Write-Host "2. Navigate to each blade:" -ForegroundColor $ColorWarning
Write-Host "   • Performance (for Latency)" -ForegroundColor Gray
Write-Host "   • Metrics (for Traffic)" -ForegroundColor Gray
Write-Host "   • Failures (for Error Rate)" -ForegroundColor Gray
Write-Host "   • Metrics > Performance Counters (for Capacity)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run KQL queries from test output to validate data" -ForegroundColor $ColorWarning
Write-Host ""
Write-Host "4. Check Kubernetes pod metrics:" -ForegroundColor $ColorWarning
Write-Host "   kubectl top pods -n mindx-test" -ForegroundColor Gray
Write-Host "   kubectl top nodes" -ForegroundColor Gray
Write-Host ""

Write-Host "Testing complete! 🚀" -ForegroundColor $ColorSuccess
Write-Host ""

