#!/bin/bash

# Error Rate Alert Testing
# Generates controlled errors to trigger error rate alerts

set -e

# Configuration
API_URL="${API_URL:-https://your-api.azurewebsites.net}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-100}"
ERROR_RATE="${ERROR_RATE:-10}"  # 10% error rate

echo "================================================"
echo "❌ Error Rate Alert Test"
echo "================================================"
echo ""
echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Total requests: $TOTAL_REQUESTS"
echo "  Target error rate: ${ERROR_RATE}%"
echo ""
echo "Expected alerts:"
echo "  ✅ error-rate-above-5pct (if error rate > 5%)"
echo "  ✅ error-rate-5xx-above-1pct (if 5xx errors > 1%)"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo ""

# Calculate number of errors
ERROR_COUNT=$((TOTAL_REQUESTS * ERROR_RATE / 100))
SUCCESS_COUNT=$((TOTAL_REQUESTS - ERROR_COUNT))

echo "📊 Test plan:"
echo "  Successful requests: $SUCCESS_COUNT"
echo "  Failed requests: $ERROR_COUNT"
echo "  Expected error rate: ${ERROR_RATE}%"
echo ""

START_TIME=$(date +%s)

# Send successful requests
echo "✅ Sending successful requests ($SUCCESS_COUNT)..."
for i in $(seq 1 $SUCCESS_COUNT); do
    curl -s "$API_URL/api/health" > /dev/null &
    
    if [ $((i % 20)) -eq 0 ]; then
        echo "  [$i/$SUCCESS_COUNT] Successful requests sent..."
    fi
    
    sleep 0.1
done

wait

# Send error requests
echo ""
echo "❌ Sending error requests ($ERROR_COUNT)..."
for i in $(seq 1 $ERROR_COUNT); do
    # Random error type
    ERROR_CODE=$((500 + RANDOM % 4))  # 500, 501, 502, 503
    
    curl -s -w "Error request $i: HTTP %{http_code}\n" \
         -X GET "$API_URL/api/test-error?code=$ERROR_CODE" \
         > /dev/null 2>&1 &
    
    if [ $((i % 5)) -eq 0 ]; then
        echo "  [$i/$ERROR_COUNT] Error requests sent..."
    fi
    
    sleep 0.1
done

wait

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "✅ Test complete!"
echo ""
echo "Summary:"
echo "  Total requests: $TOTAL_REQUESTS"
echo "  Successful: $SUCCESS_COUNT"
echo "  Failed: $ERROR_COUNT"
echo "  Error rate: ${ERROR_RATE}%"
echo "  Duration: ${DURATION}s"
echo ""
echo "Next steps:"
echo "  1. Wait 5-10 minutes for data to process"
echo "  2. Check Application Insights → Failures"
echo "  3. Check Alerts → Alert history"
echo ""
echo "Verification query (run in App Insights Logs):"
echo "────────────────────────────────────────────"
echo "requests"
echo "| where timestamp > ago(15m)"
echo "| summarize "
echo "    Total = count(),"
echo "    Failed = countif(success == false)"
echo "| extend ErrorRate = (Failed * 100.0) / Total"
echo "────────────────────────────────────────────"
echo ""

