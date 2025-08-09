#!/bin/bash

# Broad Researcher Agent Deployment Script
# This script validates the environment and prepares for deployment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}[${1}]${NC} ${3}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_status "INFO" "$YELLOW" "Starting Broad Researcher Agent deployment validation..."

# Check Node.js version
if ! command_exists node; then
    print_status "ERROR" "$RED" "Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_status "ERROR" "$RED" "Node.js version must be >= 18.0.0 (current: $NODE_VERSION)"
    exit 1
fi
print_status "OK" "$GREEN" "Node.js version: $NODE_VERSION"

# Check npm
if ! command_exists npm; then
    print_status "ERROR" "$RED" "npm is not installed"
    exit 1
fi
print_status "OK" "$GREEN" "npm is installed"

# Check environment file
if [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
    print_status "WARNING" "$YELLOW" "No environment file found. Creating .env.local template..."
    cat > .env.local << EOF
# Serper API Configuration
SERPER_API_KEY=

# OpenAI Configuration
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4-turbo-preview

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional Configuration
SERPER_API_TIMEOUT=10000
SERPER_CACHE_TTL=300
SERPER_MAX_RETRIES=3
EOF
    print_status "INFO" "$YELLOW" "Please fill in the environment variables in .env.local"
    exit 1
fi

# Validate environment variables
print_status "INFO" "$YELLOW" "Validating environment variables..."

if [ -f ".env.local" ]; then
    source .env.local
elif [ -f ".env.production" ]; then
    source .env.production
fi

MISSING_VARS=()

# Check required variables
[ -z "$SERPER_API_KEY" ] && MISSING_VARS+=("SERPER_API_KEY")
[ -z "$OPENAI_API_KEY" ] && MISSING_VARS+=("OPENAI_API_KEY")
[ -z "$NEXT_PUBLIC_SUPABASE_URL" ] && MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_URL")
[ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
[ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_status "ERROR" "$RED" "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi
print_status "OK" "$GREEN" "All required environment variables are set"

# Install dependencies
print_status "INFO" "$YELLOW" "Installing dependencies..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    print_status "ERROR" "$RED" "Failed to install dependencies"
    exit 1
fi
print_status "OK" "$GREEN" "Dependencies installed successfully"

# Run tests
print_status "INFO" "$YELLOW" "Running tests..."
npm test -- --passWithNoTests __tests__/agents/broad-researcher
if [ $? -ne 0 ]; then
    print_status "ERROR" "$RED" "Tests failed"
    exit 1
fi
print_status "OK" "$GREEN" "All tests passed"

# Type check
print_status "INFO" "$YELLOW" "Running type check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    print_status "ERROR" "$RED" "Type check failed"
    exit 1
fi
print_status "OK" "$GREEN" "Type check passed"

# Build the project
print_status "INFO" "$YELLOW" "Building the project..."
npm run build
if [ $? -ne 0 ]; then
    print_status "ERROR" "$RED" "Build failed"
    exit 1
fi
print_status "OK" "$GREEN" "Build completed successfully"

# Validate API endpoints
print_status "INFO" "$YELLOW" "Validating API endpoints..."

# Start the server in background for testing
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
sleep 5  # Wait for server to start

# Test health check endpoint
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/agents/researcher)
if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    print_status "OK" "$GREEN" "Health check endpoint is working"
else
    print_status "WARNING" "$YELLOW" "Health check endpoint returned status: $HEALTH_RESPONSE"
fi

# Kill the test server
kill $SERVER_PID 2>/dev/null

# Generate deployment report
print_status "INFO" "$YELLOW" "Generating deployment report..."

REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).txt"
cat > "$REPORT_FILE" << EOF
Broad Researcher Agent Deployment Report
========================================
Generated: $(date)

Environment Check:
- Node.js Version: $NODE_VERSION
- npm Version: $(npm -v)
- Next.js Version: $(npm list next | grep next@ | awk '{print $2}')

Dependencies:
- langchain: $(npm list @langchain/openai | grep @langchain/openai@ | awk '{print $2}')
- openai: $(npm list openai | grep openai@ | awk '{print $2}')
- zod: $(npm list zod | grep zod@ | awk '{print $2}')

API Configuration:
- SERPER_API_KEY: ${SERPER_API_KEY:0:10}... (hidden)
- OPENAI_API_KEY: ${OPENAI_API_KEY:0:10}... (hidden)
- OPENAI_MODEL: ${OPENAI_MODEL:-gpt-4-turbo-preview}

Build Output:
- .next directory size: $(du -sh .next | cut -f1)
- Total files: $(find .next -type f | wc -l)

Recommendations:
1. Set up monitoring for API usage and costs
2. Configure rate limiting on production
3. Enable caching for better performance
4. Set up error alerting

Deployment Commands:
- Vercel: vercel --prod
- Custom server: npm start
- Docker: docker build -t broad-researcher . && docker run -p 3000:3000 broad-researcher
EOF

print_status "OK" "$GREEN" "Deployment report saved to: $REPORT_FILE"

# Final summary
echo ""
print_status "SUCCESS" "$GREEN" "=========================================="
print_status "SUCCESS" "$GREEN" "Broad Researcher Agent is ready for deployment!"
print_status "SUCCESS" "$GREEN" "=========================================="
echo ""
echo "Next steps:"
echo "1. Review the deployment report: $REPORT_FILE"
echo "2. Deploy to your hosting platform"
echo "3. Monitor API usage and performance"
echo "4. Set up alerts for errors and limits"
echo ""

# Optional: Show deployment commands
if [ "$1" == "--show-commands" ]; then
    echo "Deployment commands:"
    echo ""
    echo "Vercel:"
    echo "  vercel --prod"
    echo ""
    echo "Docker:"
    echo "  docker build -t broad-researcher ."
    echo "  docker run -p 3000:3000 --env-file .env.production broad-researcher"
    echo ""
    echo "PM2:"
    echo "  pm2 start npm --name 'broad-researcher' -- start"
    echo ""
fi