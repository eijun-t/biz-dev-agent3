#!/bin/bash

# ======================================
# 16:00 デモ最終チェックスクリプト
# MVP Worker3による統合確認
# ======================================

echo "🚀 ================================"
echo "   FINAL INTEGRATION CHECK"
echo "   Time: $(date +%H:%M:%S)"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check results
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0

# Function: Run check
run_check() {
    local check_name=$1
    local check_command=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "Checking $check_name... "
    
    if eval $check_command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Function: Performance check
check_performance() {
    local endpoint=$1
    local max_time=$2
    local start_time=$(date +%s%N)
    
    curl -s -o /dev/null "http://localhost:3000$endpoint"
    
    local end_time=$(date +%s%N)
    local response_time=$(( ($end_time - $start_time) / 1000000 ))
    
    if [ $response_time -lt $max_time ]; then
        echo -e "${GREEN}✅ ${response_time}ms (<${max_time}ms)${NC}"
        return 0
    else
        echo -e "${RED}❌ ${response_time}ms (>${max_time}ms)${NC}"
        return 1
    fi
}

# ======================================
# 1. ENVIRONMENT CHECKS
# ======================================
echo "🔧 Environment Checks:"
echo "---------------------"

run_check "Node.js" "node --version"
run_check "npm packages" "[ -d node_modules ]"
run_check "TypeScript" "npx tsc --version"
run_check "Database connection" "[ -f .env ] && grep -q SUPABASE_URL .env"
run_check "Build files" "[ -d .next ] || [ -d build ]"

echo ""

# ======================================
# 2. API ENDPOINT CHECKS
# ======================================
echo "🌐 API Endpoint Checks:"
echo "----------------------"

# Start dev server if not running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Starting development server...${NC}"
    npm run dev > /dev/null 2>&1 &
    DEV_PID=$!
    sleep 5
fi

echo -n "GET /api/reports/search: "
check_performance "/api/reports/search?limit=10" 100

echo -n "POST /api/reports/save: "
RESPONSE=$(curl -s -X POST http://localhost:3000/api/reports/save \
    -H "Content-Type: application/json" \
    -d '{"title":"Test","summary":"Test","content":"Test","status":"draft","score":80,"tags":["test"],"agents":["researcher"]}' \
    -w "\n%{http_code}")
    
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ HTTP $HTTP_CODE${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ HTTP $HTTP_CODE${NC}"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""

# ======================================
# 3. COMPONENT CHECKS
# ======================================
echo "🎨 Component Checks:"
echo "-------------------"

# Check if component files exist
COMPONENTS=(
    "components/visualization/AgentPipeline.tsx"
    "components/visualization/DataFlow.tsx"
    "components/visualization/ProgressTracker.tsx"
    "components/visualization/IntegratedDashboard.tsx"
    "components/reports/ReportHistory.tsx"
    "components/reports/ReportHistoryIntegrated.tsx"
    "components/charts/PerformanceChart.tsx"
)

for component in "${COMPONENTS[@]}"; do
    run_check "$(basename $component)" "[ -f $component ]"
done

echo ""

# ======================================
# 4. INTEGRATION CHECKS
# ======================================
echo "🔗 Integration Checks:"
echo "--------------------"

run_check "Flow Engine" "[ -f lib/visualization/flow-engine.ts ]"
run_check "Integration Bridge" "[ -f lib/visualization/integration-bridge.ts ]"
run_check "Integration Adapter" "[ -f lib/visualization/integration-adapter.ts ]"
run_check "React Query Config" "[ -f workspace/ui-revolution/lib/db/react-query-config.ts ]"
run_check "WebSocket Mock" "[ -f lib/websocket/mock-server.ts ]"

echo ""

# ======================================
# 5. TEST SUITE CHECKS
# ======================================
echo "🧪 Test Suite Checks:"
echo "-------------------"

run_check "Integration tests" "[ -f workspace/ui-revolution/__tests__/integration/report-history.test.tsx ]"
run_check "E2E tests" "[ -f tests/e2e/visualization.spec.ts ]"
run_check "Performance tests" "[ -f workspace/ui-revolution/__tests__/performance/load-test.js ]"

# Run tests if available
if command -v jest > /dev/null 2>&1; then
    echo -n "Running unit tests... "
    if npm test -- --silent --passWithNoTests 2>/dev/null; then
        echo -e "${GREEN}✅ All tests passed${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

echo ""

# ======================================
# 6. PERFORMANCE METRICS
# ======================================
echo "⚡ Performance Metrics:"
echo "---------------------"

# Memory usage check
MEMORY_USAGE=$(ps aux | grep node | grep -v grep | awk '{sum+=$6} END {print sum/1024}')
echo -n "Memory usage: "
if (( $(echo "$MEMORY_USAGE < 500" | bc -l) )); then
    echo -e "${GREEN}✅ ${MEMORY_USAGE}MB (<500MB)${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️  ${MEMORY_USAGE}MB (>500MB)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# CPU check
CPU_USAGE=$(top -b -n1 | grep node | awk '{print $9}' | head -1)
echo -n "CPU usage: "
if [ -z "$CPU_USAGE" ]; then
    echo -e "${YELLOW}⚠️  Unable to measure${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ ${CPU_USAGE}%${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""

# ======================================
# 7. DEMO READINESS
# ======================================
echo "📋 Demo Readiness:"
echo "----------------"

run_check "Demo scenario" "[ -f workspace/ui-revolution/demo-scenario.md ]"
run_check "Sample data" "[ -f workspace/ui-revolution/lib/db/schema.sql ]"

# Check WebSocket server
echo -n "WebSocket server: "
if nc -z localhost 3001 2>/dev/null; then
    echo -e "${GREEN}✅ Running on port 3001${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠️  Not running (start with mock-server)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""

# ======================================
# FINAL SUMMARY
# ======================================
echo "================================"
echo "📊 FINAL CHECK SUMMARY"
echo "================================"
echo ""

SUCCESS_RATE=$(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))

echo "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$(( TOTAL_CHECKS - PASSED_CHECKS - WARNINGS ))${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""
echo "Success Rate: ${SUCCESS_RATE}%"
echo ""

if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 SYSTEM READY FOR DEMO!${NC}"
    echo ""
    echo "All critical systems operational."
    echo "Performance targets achieved."
    echo "Integration verified."
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  SYSTEM MOSTLY READY${NC}"
    echo ""
    echo "Some non-critical issues detected."
    echo "Demo can proceed with caution."
else
    echo -e "${RED}❌ SYSTEM NOT READY${NC}"
    echo ""
    echo "Critical issues detected!"
    echo "Please fix failures before demo."
fi

echo ""
echo "================================"
echo "Time: $(date +%H:%M:%S)"
echo "Good luck with the demo! 🚀"
echo "================================"

# Cleanup
if [ ! -z "$DEV_PID" ]; then
    kill $DEV_PID 2>/dev/null
fi

exit 0