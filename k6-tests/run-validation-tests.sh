#!/bin/bash
# k6 Validation Tests Runner for Linux/Mac
# Purpose: Run all validation tests to verify App Insights metrics

set -e

# Colors
COLOR_HEADER='\033[1;36m'    # Cyan
COLOR_SUCCESS='\033[1;32m'   # Green
COLOR_WARNING='\033[1;33m'   # Yellow
COLOR_ERROR='\033[1;31m'     # Red
COLOR_RESET='\033[0m'        # Reset
COLOR_GRAY='\033[0;37m'      # Gray

# Parse arguments
API_URL=""
SKIP_LATENCY=false
SKIP_TRAFFIC=false
SKIP_ERROR_RATE=false
SKIP_CAPACITY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --skip-latency)
            SKIP_LATENCY=true
            shift
            ;;
        --skip-traffic)
            SKIP_TRAFFIC=true
            shift
            ;;
        --skip-error-rate)
            SKIP_ERROR_RATE=true
            shift
            ;;
        --skip-capacity)
            SKIP_CAPACITY=true
            shift
            ;;
        *)
            echo -e "${COLOR_ERROR}Unknown option: $1${COLOR_RESET}"
            exit 1
            ;;
    esac
done

echo ""
echo -e "${COLOR_HEADER}═══════════════════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_HEADER}    k6 Validation Test Suite - Week 2${COLOR_RESET}"
echo -e "${COLOR_HEADER}    Azure Application Insights Metrics Validation${COLOR_RESET}"
echo -e "${COLOR_HEADER}═══════════════════════════════════════════════════${COLOR_RESET}"
echo ""

# Check if k6 is installed
echo -e "${COLOR_WARNING}Checking k6 installation...${COLOR_RESET}"
if command -v k6 &> /dev/null; then
    K6_VERSION=$(k6 version 2>&1 | head -n 1)
    echo -e "${COLOR_SUCCESS}✓ k6 is installed: $K6_VERSION${COLOR_RESET}"
else
    echo -e "${COLOR_ERROR}✗ k6 is not installed!${COLOR_RESET}"
    echo -e "${COLOR_WARNING}Install with:${COLOR_RESET}"
    echo -e "${COLOR_GRAY}  macOS: brew install k6${COLOR_RESET}"
    echo -e "${COLOR_GRAY}  Linux: https://k6.io/docs/getting-started/installation/${COLOR_RESET}"
    exit 1
fi

# Get API URL
if [ -z "$API_URL" ]; then
    if [ -n "$API_URL" ]; then
        echo -e "${COLOR_SUCCESS}Using API_URL from environment: $API_URL${COLOR_RESET}"
    else
        echo ""
        echo -e "${COLOR_ERROR}API URL not provided!${COLOR_RESET}"
        echo -e "${COLOR_WARNING}Usage:${COLOR_RESET}"
        echo -e "${COLOR_GRAY}  ./run-validation-tests.sh --api-url https://your-app.com${COLOR_RESET}"
        echo -e "${COLOR_GRAY}  OR set environment variable:${COLOR_RESET}"
        echo -e "${COLOR_GRAY}  export API_URL=https://your-app.com${COLOR_RESET}"
        exit 1
    fi
fi

# Test API connectivity
echo ""
echo -e "${COLOR_WARNING}Testing API connectivity...${COLOR_RESET}"
if curl -s -f -o /dev/null --max-time 10 "$API_URL/health"; then
    echo -e "${COLOR_SUCCESS}✓ API is reachable${COLOR_RESET}"
else
    echo -e "${COLOR_ERROR}✗ Cannot reach API at $API_URL${COLOR_RESET}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Set environment variable for k6
export API_URL="$API_URL"

# Test configuration
declare -a TESTS=()

if [ "$SKIP_LATENCY" = false ]; then
    TESTS+=("Latency Validation|validate-latency.js|Validates P50, P95, P99 latency metrics|~9 minutes")
fi

if [ "$SKIP_TRAFFIC" = false ]; then
    TESTS+=("Traffic Volume Validation|validate-traffic.js|Validates request counting and throughput|~6 minutes")
fi

if [ "$SKIP_ERROR_RATE" = false ]; then
    TESTS+=("Error Rate Validation|validate-error-rate.js|Validates 4xx, 5xx, and timeout tracking|~3 minutes")
fi

if [ "$SKIP_CAPACITY" = false ]; then
    TESTS+=("Capacity Validation|validate-capacity.js|Validates CPU, Memory, and resource metrics|~10 minutes")
fi

if [ ${#TESTS[@]} -eq 0 ]; then
    echo -e "${COLOR_WARNING}No tests to run (all tests skipped)${COLOR_RESET}"
    exit 0
fi

# Display test plan
echo ""
echo -e "${COLOR_HEADER}═══════════════════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_HEADER}Test Plan:${COLOR_RESET}"
echo -e "${COLOR_HEADER}═══════════════════════════════════════════════════${COLOR_RESET}"

idx=1
for test in "${TESTS[@]}"; do
    IFS='|' read -r name file description duration <<< "$test"
    echo -e "${COLOR_WARNING}[$idx/${#TESTS[@]}] $name${COLOR_RESET}"
    echo -e "${COLOR_GRAY}    File: $file${COLOR_RESET}"
    echo -e "${COLOR_GRAY}    Purpose: $description${COLOR_RESET}"
    echo -e "${COLOR_GRAY}    Duration: $duration${COLOR_RESET}"
    echo ""
    ((idx++))
done

echo -e "${COLOR_SUCCESS}Target API: $API_URL${COLOR_RESET}"
echo ""

# Confirm start
read -p "Start validation tests? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${COLOR_WARNING}Tests cancelled${COLOR_RESET}"
    exit 0
fi

# Run tests
declare -a RESULTS=()
START_TIME=$(date +%s)

idx=1
for test in "${TESTS[@]}"; do
    IFS='|' read -r name file description duration <<< "$test"
    
    echo ""
    echo -e "${COLOR_HEADER}═══════════════════════════════════════════════════${COLOR_RESET}"
    echo -e "${COLOR_HEADER}[$idx/${#TESTS[@]}] Running: $name${COLOR_RESET}"
    echo -e "${COLOR_HEADER}═══════════════════════════════════════════════════${COLOR_RESET}"
    echo ""
    
    TEST_START_TIME=$(date +%s)
    
    if k6 run "$file"; then
        TEST_END_TIME=$(date +%s)
        TEST_DURATION=$((TEST_END_TIME - TEST_START_TIME))
        
        echo ""
        echo -e "${COLOR_SUCCESS}✓ Test completed successfully!${COLOR_RESET}"
        RESULTS+=("PASSED|$name|$TEST_DURATION")
    else
        TEST_END_TIME=$(date +%s)
        TEST_DURATION=$((TEST_END_TIME - TEST_START_TIME))
        
        echo ""
        echo -e "${COLOR_ERROR}✗ Test failed!${COLOR_RESET}"
        RESULTS+=("FAILED|$name|$TEST_DURATION")
    fi
    
    # Wait between tests
    if [ $idx -lt ${#TESTS[@]} ]; then
        echo ""
        echo -e "${COLOR_WARNING}Waiting 10 seconds before next test...${COLOR_RESET}"
        sleep 10
    fi
    
    ((idx++))
done

END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))
TOTAL_MINUTES=$(echo "scale=2; $TOTAL_DURATION / 60" | bc)

# Display summary
echo ""
echo -e "${COLOR_HEADER}═══════════════════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_HEADER}    Test Results Summary${COLOR_RESET}"
echo -e "${COLOR_HEADER}═══════════════════════════════════════════════════${COLOR_RESET}"
echo ""

PASSED_COUNT=0
FAILED_COUNT=0

for result in "${RESULTS[@]}"; do
    IFS='|' read -r status name duration <<< "$result"
    
    if [ "$status" = "PASSED" ]; then
        echo -e "${COLOR_SUCCESS}✓ $name${COLOR_RESET}"
        echo -e "${COLOR_GRAY}   Status: $status | Duration: ${duration}s${COLOR_RESET}"
        ((PASSED_COUNT++))
    else
        echo -e "${COLOR_ERROR}✗ $name${COLOR_RESET}"
        echo -e "${COLOR_GRAY}   Status: $status | Duration: ${duration}s${COLOR_RESET}"
        ((FAILED_COUNT++))
    fi
done

echo ""
echo -e "${COLOR_WARNING}Total Duration: $TOTAL_MINUTES minutes${COLOR_RESET}"

echo ""
if [ $FAILED_COUNT -eq 0 ]; then
    echo -e "${COLOR_SUCCESS}✓ All tests passed! ($PASSED_COUNT/${#RESULTS[@]})${COLOR_RESET}"
else
    echo -e "${COLOR_ERROR}✗ Some tests failed: $PASSED_COUNT passed, $FAILED_COUNT failed${COLOR_RESET}"
fi

echo ""
echo -e "${COLOR_HEADER}═══════════════════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_HEADER}    Next Steps: Verify in Application Insights${COLOR_RESET}"
echo -e "${COLOR_HEADER}═══════════════════════════════════════════════════${COLOR_RESET}"
echo ""
echo -e "${COLOR_WARNING}1. Open Azure Portal → Application Insights${COLOR_RESET}"
echo -e "${COLOR_WARNING}2. Navigate to each blade:${COLOR_RESET}"
echo -e "${COLOR_GRAY}   • Performance (for Latency)${COLOR_RESET}"
echo -e "${COLOR_GRAY}   • Metrics (for Traffic)${COLOR_RESET}"
echo -e "${COLOR_GRAY}   • Failures (for Error Rate)${COLOR_RESET}"
echo -e "${COLOR_GRAY}   • Metrics > Performance Counters (for Capacity)${COLOR_RESET}"
echo ""
echo -e "${COLOR_WARNING}3. Run KQL queries from test output to validate data${COLOR_RESET}"
echo ""
echo -e "${COLOR_WARNING}4. Check Kubernetes pod metrics:${COLOR_RESET}"
echo -e "${COLOR_GRAY}   kubectl top pods -n mindx-test${COLOR_RESET}"
echo -e "${COLOR_GRAY}   kubectl top nodes${COLOR_RESET}"
echo ""

echo -e "${COLOR_SUCCESS}Testing complete! 🚀${COLOR_RESET}"
echo ""

