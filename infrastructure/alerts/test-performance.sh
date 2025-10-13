#!/bin/bash

# Performance Alert Testing
# Simulates high latency to trigger P95/P99 alerts

set -e

# Configuration
API_URL="${API_URL:-https://your-api.azurewebsites.net}"
NUM_REQUESTS="${NUM_REQUESTS:-200}"
DELAY_MS="${DELAY_MS:-6000}"  # 6 seconds

echo "================================================"
echo "🚀 Performance Alert Test"
echo "================================================"
echo ""
echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Requests: $NUM_REQUESTS"
echo "  Simulated delay: ${DELAY_MS}ms (${DELAY_MS}ms)"
echo ""
echo "Expected alerts:"
echo "  ✅ performance-p99-latency-above-10s (if delay > 10s)"
echo "  ✅ performance-p95-latency-above-5s (if delay > 5s)"
echo "  ✅ performance-avg-spike-300pct (if baseline < 2s)"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo ""
echo "📊 Generating baseline traffic first..."
echo "Sending 50 normal requests..."

for i in {1..50}; do
    curl -s "$API_URL/api/health" > /dev/null &
    
    if [ $((i % 10)) -eq 0 ]; then
        echo "  [$i/50] Baseline requests sent..."
    fi
    
    sleep 0.5
done

wait
echo "✅ Baseline complete"
echo ""

sleep 5

echo "🐌 Generating slow requests..."
echo "Sending $NUM_REQUESTS requests with ${DELAY_MS}ms delay..."
echo ""

START_TIME=$(date +%s)

for i in $(seq 1 $NUM_REQUESTS); do
    # Simulate slow endpoint
    curl -s -w "Request $i: %{time_total}s\n" \
         -X GET "$API_URL/api/test-slow?delay=${DELAY_MS}" \
         > /dev/null 2>&1 &
    
    if [ $((i % 20)) -eq 0 ]; then
        echo "  [$i/$NUM_REQUESTS] Slow requests sent..."
    fi
    
    # Spread requests over time
    sleep 0.3
done

wait

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "✅ Test complete!"
echo ""
echo "Summary:"
echo "  Total requests: $NUM_REQUESTS"
echo "  Duration: ${DURATION}s"
echo "  Average rate: $((NUM_REQUESTS / DURATION)) req/s"
echo ""
echo "Next steps:"
echo "  1. Wait 10-15 minutes for data to process"
echo "  2. Check Application Insights → Performance"
echo "  3. Check Alerts → Alert history"
echo ""
echo "Expected timeline:"
echo "  T+5m:  Data appears in App Insights"
echo "  T+10m: Alerts evaluate and fire"
echo "  T+15m: Email notifications sent"
echo ""

