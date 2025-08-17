#!/bin/bash

# 🧪 Biz-Dev-Agent3 Integration Test Runner
# Executes all integration tests for the multi-agent system

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Function to print colored output
print_status() {
    echo -e "${2}[${1}]${NC} ${3}"
}

# Function to run test and track results
run_test() {
    local test_name=$1
    local test_command=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${CYAN}Running: ${test_name}${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if eval "$test_command"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_status "PASS" "$GREEN" "$test_name"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_status "FAIL" "$RED" "$test_name"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "CHECK" "$BLUE" "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_status "ERROR" "$RED" "Node.js is not installed"
        exit 1
    fi
    
    # Check if .env exists
    if [ ! -f "../../.env" ]; then
        print_status "WARNING" "$YELLOW" ".env file not found. Some tests may fail"
    fi
    
    # Check if node_modules exists
    if [ ! -d "../../node_modules" ]; then
        print_status "ERROR" "$RED" "Dependencies not installed. Run: npm install"
        exit 1
    fi
    
    print_status "OK" "$GREEN" "Prerequisites check passed"
}

# Banner
echo "╔════════════════════════════════════════════╗"
echo "║   Biz-Dev-Agent3 Integration Test Suite   ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Start time
START_TIME=$(date +%s)

# Check prerequisites
check_prerequisites

# ========== ENVIRONMENT TESTS ==========
echo -e "\n${BLUE}▶ Environment Tests${NC}"
echo "══════════════════════════════════"

run_test "Environment Check" "node ../scripts/check-env.js"
run_test "TypeScript Compilation" "cd ../.. && npm run type-check"

# ========== AGENT TESTS ==========
echo -e "\n${BLUE}▶ Individual Agent Tests${NC}"
echo "══════════════════════════════════"

# Test each agent if test scripts exist
if [ -f "test-researcher.js" ]; then
    run_test "Researcher Agent" "node test-researcher.js"
else
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_status "SKIP" "$YELLOW" "Researcher Agent test not found"
fi

if [ -f "test-ideator.js" ]; then
    run_test "Ideator Agent" "node test-ideator.js"
else
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_status "SKIP" "$YELLOW" "Ideator Agent test not found"
fi

if [ -f "test-critic.js" ]; then
    run_test "Critic Agent" "node test-critic.js"
else
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_status "SKIP" "$YELLOW" "Critic Agent test not found"
fi

if [ -f "test-analyst.js" ]; then
    run_test "Analyst Agent" "node test-analyst.js"
else
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_status "SKIP" "$YELLOW" "Analyst Agent test not found"
fi

if [ -f "test-writer.js" ]; then
    run_test "Writer Agent" "node test-writer.js"
else
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_status "SKIP" "$YELLOW" "Writer Agent test not found"
fi

# ========== INTEGRATION TESTS ==========
echo -e "\n${BLUE}▶ Integration Tests${NC}"
echo "══════════════════════════════════"

if [ -f "test-agent-communication.js" ]; then
    run_test "Agent Communication" "node test-agent-communication.js"
else
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_status "SKIP" "$YELLOW" "Agent Communication test not found"
fi

if [ -f "test-api-integration.js" ]; then
    run_test "API Integration" "node test-api-integration.js"
else
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_status "SKIP" "$YELLOW" "API Integration test not found"
fi

if [ -f "test-langgraph-orchestration.js" ]; then
    run_test "LangGraph Orchestration" "node test-langgraph-orchestration.js"
else
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_status "SKIP" "$YELLOW" "LangGraph Orchestration test not found"
fi

# ========== DATABASE TESTS ==========
echo -e "\n${BLUE}▶ Database Tests${NC}"
echo "══════════════════════════════════"

if [ -f "test-supabase-connection.js" ]; then
    run_test "Supabase Connection" "node test-supabase-connection.js"
else
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_status "SKIP" "$YELLOW" "Supabase Connection test not found"
fi

# ========== PERFORMANCE TESTS ==========
echo -e "\n${BLUE}▶ Performance Tests${NC}"
echo "══════════════════════════════════"

if [ -f "test-performance.js" ]; then
    run_test "Performance Benchmarks" "node test-performance.js"
else
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_status "SKIP" "$YELLOW" "Performance test not found"
fi

# Calculate execution time
END_TIME=$(date +%s)
EXECUTION_TIME=$((END_TIME - START_TIME))

# ========== TEST SUMMARY ==========
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║             Test Summary                   ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "  Total Tests:    $TOTAL_TESTS"
echo -e "  ${GREEN}Passed:${NC}         $PASSED_TESTS"
echo -e "  ${RED}Failed:${NC}         $FAILED_TESTS"
echo -e "  ${YELLOW}Skipped:${NC}        $SKIPPED_TESTS"
echo ""
echo "  Execution Time: ${EXECUTION_TIME}s"
echo ""

# Generate test report
REPORT_FILE="test-report-$(date +%Y%m%d-%H%M%S).json"
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total": $TOTAL_TESTS,
  "passed": $PASSED_TESTS,
  "failed": $FAILED_TESTS,
  "skipped": $SKIPPED_TESTS,
  "executionTime": $EXECUTION_TIME,
  "success": $([ $FAILED_TESTS -eq 0 ] && echo "true" || echo "false")
}
EOF

print_status "REPORT" "$BLUE" "Test report saved to: $REPORT_FILE"

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "\n${RED}✗ Tests failed!${NC}"
    exit 1
else
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
fi