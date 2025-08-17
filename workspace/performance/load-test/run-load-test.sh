#!/bin/bash

# 🚀 Load Test Runner for Biz-Dev-Agent3
# Executes k6 load tests with reporting

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
API_KEY=${API_KEY:-"test-api-key"}
REPORT_DIR="./reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to print colored output
print_status() {
    echo -e "${2}[${1}]${NC} ${3}"
}

# Function to check dependencies
check_dependencies() {
    print_status "CHECK" "$BLUE" "Checking dependencies..."
    
    if ! command -v k6 &> /dev/null; then
        print_status "ERROR" "$RED" "k6 is not installed"
        echo "Install k6: brew install k6 (macOS) or https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_status "WARNING" "$YELLOW" "jq is not installed (optional for JSON processing)"
    fi
    
    print_status "OK" "$GREEN" "Dependencies check passed"
}

# Function to prepare test environment
prepare_environment() {
    print_status "PREP" "$BLUE" "Preparing test environment..."
    
    # Create report directory
    mkdir -p "$REPORT_DIR"
    
    # Check if API is accessible
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" | grep -q "200"; then
        print_status "OK" "$GREEN" "API is accessible at $BASE_URL"
    else
        print_status "WARNING" "$YELLOW" "API may not be accessible at $BASE_URL"
    fi
}

# Function to run load test
run_load_test() {
    local test_type=$1
    local vus=${2:-100}
    local duration=${3:-"5m"}
    
    print_status "TEST" "$CYAN" "Running $test_type load test..."
    echo "  Virtual Users: $vus"
    echo "  Duration: $duration"
    echo ""
    
    case $test_type in
        "smoke")
            # Smoke test - minimal load
            k6 run \
                -e BASE_URL="$BASE_URL" \
                -e API_KEY="$API_KEY" \
                --vus 10 \
                --duration 1m \
                --out json="$REPORT_DIR/smoke_${TIMESTAMP}.json" \
                k6-load-test.js
            ;;
            
        "load")
            # Load test - normal expected load
            k6 run \
                -e BASE_URL="$BASE_URL" \
                -e API_KEY="$API_KEY" \
                --vus "$vus" \
                --duration "$duration" \
                --out json="$REPORT_DIR/load_${TIMESTAMP}.json" \
                k6-load-test.js
            ;;
            
        "stress")
            # Stress test - beyond normal capacity
            k6 run \
                -e BASE_URL="$BASE_URL" \
                -e API_KEY="$API_KEY" \
                k6-load-test.js
            ;;
            
        "spike")
            # Spike test - sudden load increase
            k6 run \
                -e BASE_URL="$BASE_URL" \
                -e API_KEY="$API_KEY" \
                --vus 1000 \
                --duration 2m \
                --out json="$REPORT_DIR/spike_${TIMESTAMP}.json" \
                k6-load-test.js
            ;;
            
        "soak")
            # Soak test - extended duration
            k6 run \
                -e BASE_URL="$BASE_URL" \
                -e API_KEY="$API_KEY" \
                --vus 100 \
                --duration 30m \
                --out json="$REPORT_DIR/soak_${TIMESTAMP}.json" \
                k6-load-test.js
            ;;
            
        *)
            print_status "ERROR" "$RED" "Unknown test type: $test_type"
            echo "Available types: smoke, load, stress, spike, soak"
            exit 1
            ;;
    esac
}

# Function to generate HTML report
generate_report() {
    local json_file=$1
    local html_file="${json_file%.json}.html"
    
    print_status "REPORT" "$BLUE" "Generating HTML report..."
    
    # Create basic HTML report
    cat > "$html_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Load Test Report - ${TIMESTAMP}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        h1 { color: #333; }
        .metric { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>🚀 Load Test Report</h1>
    <div class="metric">
        <h2>Test Configuration</h2>
        <table>
            <tr><th>Parameter</th><th>Value</th></tr>
            <tr><td>Base URL</td><td>${BASE_URL}</td></tr>
            <tr><td>Test Type</td><td>${test_type}</td></tr>
            <tr><td>Timestamp</td><td>${TIMESTAMP}</td></tr>
        </table>
    </div>
    <div class="metric">
        <h2>Results Summary</h2>
        <p>Full results available in: ${json_file}</p>
        <p>View with: <code>k6 inspect ${json_file}</code></p>
    </div>
</body>
</html>
EOF
    
    print_status "OK" "$GREEN" "Report generated: $html_file"
}

# Main execution
echo "╔════════════════════════════════════════════╗"
echo "║     Biz-Dev-Agent3 Load Test Runner       ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Parse arguments
TEST_TYPE=${1:-"load"}
VUS=${2:-100}
DURATION=${3:-"5m"}

# Run tests
check_dependencies
prepare_environment
run_load_test "$TEST_TYPE" "$VUS" "$DURATION"

# Generate report
if [ -f "$REPORT_DIR/${TEST_TYPE}_${TIMESTAMP}.json" ]; then
    generate_report "$REPORT_DIR/${TEST_TYPE}_${TIMESTAMP}.json"
fi

print_status "COMPLETE" "$GREEN" "Load test completed successfully!"
echo ""
echo "📊 Results saved to: $REPORT_DIR/"
echo "View detailed metrics with: k6 inspect $REPORT_DIR/${TEST_TYPE}_${TIMESTAMP}.json"