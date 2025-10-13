# k6 Alert Tests - PowerShell Runner
# Quick script to run k6 tests on Windows

param(
    [string]$ApiUrl = "",
    [string]$Test = "menu",
    [int]$ErrorRate = 10
)

# Colors
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host "================================================" -ForegroundColor Blue
Write-Host "🚀 k6 Alert Testing Suite" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""

# Check k6 installation
Write-Host "Checking k6 installation..." -ForegroundColor Yellow
try {
    $k6Version = k6 version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ k6 found: $k6Version"
    } else {
        throw "k6 not found"
    }
} catch {
    Write-ColorOutput Red "❌ k6 not installed"
    Write-Host ""
    Write-Host "Install k6:" -ForegroundColor Yellow
    Write-Host "  Option 1 (Chocolatey): choco install k6"
    Write-Host "  Option 2 (winget):     winget install k6 --source winget"
    Write-Host "  Option 3 (Download):   https://k6.io/docs/get-started/installation/"
    Write-Host ""
    exit 1
}
Write-Host ""

# Get API URL
if ($ApiUrl -eq "") {
    Write-Host "Enter your API URL:" -ForegroundColor Yellow
    Write-Host "Example: https://your-api.azurewebsites.net" -ForegroundColor Gray
    $ApiUrl = Read-Host "API URL"
}

if ($ApiUrl -eq "") {
    Write-ColorOutput Red "❌ API URL is required"
    exit 1
}

# Set environment variable
$env:API_URL = $ApiUrl
Write-ColorOutput Green "✅ API URL set: $ApiUrl"
Write-Host ""

# Show menu if not specified
if ($Test -eq "menu") {
    Write-Host "Select test to run:" -ForegroundColor Green
    Write-Host ""
    Write-Host "  1) Performance Test (15 min) - P95/P99 latency"
    Write-Host "  2) Error Rate Test (15 min) - Error rate alerts"
    Write-Host "  3) Spike Test (22 min) - Response time spike"
    Write-Host "  4) Run All Tests (~52 min)"
    Write-Host "  0) Exit"
    Write-Host ""
    $choice = Read-Host "Enter choice"
    
    switch ($choice) {
        "1" { $Test = "performance" }
        "2" { $Test = "error" }
        "3" { $Test = "spike" }
        "4" { $Test = "all" }
        "0" { 
            Write-Host "Exiting..."
            exit 0 
        }
        default {
            Write-ColorOutput Red "❌ Invalid choice"
            exit 1
        }
    }
    Write-Host ""
}

# Function to run a test
function Run-Test {
    param($TestName, $TestFile)
    
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "🧪 Running: $TestName" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    $testPath = Join-Path $PSScriptRoot $TestFile
    
    if (Test-Path $testPath) {
        k6 run $testPath
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-ColorOutput Green "✅ $TestName completed successfully!"
        } else {
            Write-Host ""
            Write-ColorOutput Red "❌ $TestName failed!"
        }
    } else {
        Write-ColorOutput Red "❌ Test file not found: $testPath"
    }
    
    Write-Host ""
}

# Run selected test(s)
switch ($Test.ToLower()) {
    "performance" {
        Run-Test "Performance Test" "performance-test.js"
    }
    
    "error" {
        $env:ERROR_RATE = $ErrorRate
        Write-Host "Error rate set to: $ErrorRate%" -ForegroundColor Yellow
        Write-Host ""
        Run-Test "Error Rate Test" "error-rate-test.js"
    }
    
    "spike" {
        Run-Test "Spike Test" "spike-test.js"
    }
    
    "all" {
        Write-ColorOutput Cyan "🚀 Running all tests..."
        Write-Host ""
        Write-Host "This will take approximately 52 minutes" -ForegroundColor Yellow
        Write-Host ""
        $confirm = Read-Host "Continue? (y/n)"
        
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Run-Test "Performance Test" "performance-test.js"
            Start-Sleep -Seconds 5
            
            $env:ERROR_RATE = $ErrorRate
            Run-Test "Error Rate Test" "error-rate-test.js"
            Start-Sleep -Seconds 5
            
            Run-Test "Spike Test" "spike-test.js"
            
            Write-Host ""
            Write-ColorOutput Green "✅ All tests completed!"
        } else {
            Write-Host "Cancelled."
        }
    }
    
    default {
        Write-ColorOutput Red "❌ Unknown test: $Test"
        Write-Host ""
        Write-Host "Available tests:"
        Write-Host "  - performance"
        Write-Host "  - error"
        Write-Host "  - spike"
        Write-Host "  - all"
        exit 1
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Blue
Write-Host "📊 Next Steps" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "1. Wait 10-15 minutes for data to process"
Write-Host "2. Check Azure Portal → Monitor → Alerts"
Write-Host "3. Check Application Insights → Performance/Failures"
Write-Host "4. Verify email notifications received"
Write-Host ""
Write-Host "For detailed verification, see:" -ForegroundColor Yellow
Write-Host "  infrastructure/alerts/k6-tests/README.md"
Write-Host ""

