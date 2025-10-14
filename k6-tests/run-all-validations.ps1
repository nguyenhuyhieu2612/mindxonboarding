# Week 2 - Step 6.1: Generate Test Load
# Script to run all validation tests and verify Golden Signals

$API_URL = "https://hieunh01.mindx.edu.vn"
$env:API_URL = $API_URL

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Week 2 - Step 6: Validate Production Metrics" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API URL: $API_URL" -ForegroundColor Green
Write-Host "Current Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Green
Write-Host ""

# Function to check API health before tests
function Test-ApiHealth {
    Write-Host "Checking API health..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ API is healthy and ready for testing" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ API health check failed: $_" -ForegroundColor Red
        return $false
    }
}

# Check API before running tests
if (-not (Test-ApiHealth)) {
    Write-Host "`n⚠️  Warning: API may not be accessible. Continue anyway? (Y/N)" -ForegroundColor Yellow
    $continue = Read-Host
    if ($continue -ne "Y") {
        Write-Host "Tests cancelled." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "Starting validation tests..." -ForegroundColor Cyan
Write-Host "="*50 + "`n" -ForegroundColor Cyan

# Test 1: Latency Validation (Golden Signal #1)
Write-Host "`n[1/4] 📊 LATENCY VALIDATION TEST" -ForegroundColor Yellow
Write-Host "Duration: ~9 minutes" -ForegroundColor Gray
Write-Host "Purpose: Validate P50, P95, P99 latency metrics" -ForegroundColor Gray
Write-Host "-" * 50
$startTime = Get-Date
k6 run validate-latency.js
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "✅ Latency test completed in $([math]::Round($duration, 2))s" -ForegroundColor Green
Write-Host "Waiting 30 seconds for data to reach App Insights..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Test 2: Traffic Volume Validation (Golden Signal #2)
Write-Host "`n[2/4] 📈 TRAFFIC VOLUME VALIDATION TEST" -ForegroundColor Yellow
Write-Host "Duration: ~6 minutes" -ForegroundColor Gray
Write-Host "Purpose: Validate request counting and throughput" -ForegroundColor Gray
Write-Host "-" * 50
$startTime = Get-Date
k6 run validate-traffic.js
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "✅ Traffic test completed in $([math]::Round($duration, 2))s" -ForegroundColor Green
Write-Host "Waiting 30 seconds for data to reach App Insights..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Test 3: Error Rate Validation (Golden Signal #3)
Write-Host "`n[3/4] ⚠️  ERROR RATE VALIDATION TEST" -ForegroundColor Yellow
Write-Host "Duration: ~3 minutes" -ForegroundColor Gray
Write-Host "Purpose: Validate error tracking (4xx, 5xx, timeouts)" -ForegroundColor Gray
Write-Host "-" * 50
$startTime = Get-Date
k6 run validate-error-rate.js
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "✅ Error rate test completed in $([math]::Round($duration, 2))s" -ForegroundColor Green
Write-Host "Waiting 30 seconds for data to reach App Insights..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Test 4: Capacity Validation (Golden Signal #4)
Write-Host "`n[4/4] 💪 CAPACITY VALIDATION TEST" -ForegroundColor Yellow
Write-Host "Duration: ~10 minutes" -ForegroundColor Gray
Write-Host "Purpose: Validate CPU, Memory, and resource metrics" -ForegroundColor Gray
Write-Host "-" * 50
$startTime = Get-Date
k6 run validate-capacity.js
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "✅ Capacity test completed in $([math]::Round($duration, 2))s" -ForegroundColor Green

# Summary
Write-Host "`n" + "="*50 -ForegroundColor Green
Write-Host "  ✅ ALL VALIDATION TESTS COMPLETED!" -ForegroundColor Green
Write-Host "="*50 -ForegroundColor Green

Write-Host "`n📋 NEXT STEPS - Step 6.2: Verify All Golden Signals`n" -ForegroundColor Cyan

Write-Host "1. Go to Azure Portal > Application Insights" -ForegroundColor White
Write-Host "   URL: https://portal.azure.com" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Navigate to your App Insights resource and check:" -ForegroundColor White
Write-Host "   - Performance (for Latency metrics)" -ForegroundColor Gray
Write-Host "   - Metrics (for Traffic volume)" -ForegroundColor Gray
Write-Host "   - Failures (for Error Rate)" -ForegroundColor Gray
Write-Host "   - Live Metrics (for Capacity)" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Run the KQL queries mentioned in each test output" -ForegroundColor White
Write-Host ""

Write-Host "4. Compare k6 results with App Insights data" -ForegroundColor White
Write-Host "   (Expect ±10% tolerance)" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 Data should be visible in App Insights within 2-5 minutes" -ForegroundColor Yellow
Write-Host ""

# Save test completion timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "validation-test-log-$timestamp.txt"
@"
Validation Tests Completed
==========================
Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
API URL: $API_URL
Tests Run: Latency, Traffic, Error Rate, Capacity

Next: Check Application Insights for metrics validation
"@ | Out-File -FilePath $logFile -Encoding UTF8

Write-Host "📝 Test log saved to: $logFile" -ForegroundColor Green
Write-Host ""

