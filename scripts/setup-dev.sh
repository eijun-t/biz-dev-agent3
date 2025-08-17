#!/bin/bash

# 🚀 Biz-Dev-Agent3 Development Environment Setup Script
# This script sets up the complete development environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}[${1}]${NC} ${3}"
}

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🚀 Biz-Dev-Agent3 Development Environment Setup"
echo "================================================"
echo ""

# Step 1: Check Node.js
print_status "CHECK" "$BLUE" "Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "OK" "$GREEN" "Node.js $NODE_VERSION found"
else
    print_status "ERROR" "$RED" "Node.js not found. Please install Node.js 18+ first"
    exit 1
fi

# Step 2: Check npm
print_status "CHECK" "$BLUE" "Checking npm installation..."
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "OK" "$GREEN" "npm $NPM_VERSION found"
else
    print_status "ERROR" "$RED" "npm not found. Please install npm"
    exit 1
fi

# Step 3: Check Git
print_status "CHECK" "$BLUE" "Checking Git installation..."
if command_exists git; then
    GIT_VERSION=$(git --version)
    print_status "OK" "$GREEN" "$GIT_VERSION found"
else
    print_status "WARNING" "$YELLOW" "Git not found. Version control will not be available"
fi

# Step 4: Install dependencies
print_status "INSTALL" "$BLUE" "Installing npm dependencies..."
npm install
print_status "OK" "$GREEN" "Dependencies installed successfully"

# Step 5: Setup environment variables
print_status "SETUP" "$BLUE" "Setting up environment variables..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_status "OK" "$GREEN" ".env file created from .env.example"
        print_status "ACTION" "$YELLOW" "Please edit .env file with your API keys"
    else
        print_status "WARNING" "$YELLOW" ".env.example not found. Creating basic .env file..."
        cat > .env << EOF
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here

# Serper API Configuration  
SERPER_API_KEY=your-serper-api-key-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
        print_status "OK" "$GREEN" "Basic .env file created"
        print_status "ACTION" "$YELLOW" "Please update .env file with your actual API keys"
    fi
else
    print_status "OK" "$GREEN" ".env file already exists"
fi

# Step 6: Create workspace directories if not exist
print_status "SETUP" "$BLUE" "Creating workspace directories..."
mkdir -p workspace/{agents,shared,docs,tests,configs,integration,deployment,monitoring,backups}
print_status "OK" "$GREEN" "Workspace directories created"

# Step 7: Check Supabase CLI (optional)
print_status "CHECK" "$BLUE" "Checking Supabase CLI..."
if command_exists supabase; then
    SUPABASE_VERSION=$(supabase --version)
    print_status "OK" "$GREEN" "$SUPABASE_VERSION found"
else
    print_status "INFO" "$YELLOW" "Supabase CLI not found. Install with: npm install -g supabase"
fi

# Step 8: TypeScript compilation check
print_status "CHECK" "$BLUE" "Checking TypeScript compilation..."
npm run type-check || {
    print_status "WARNING" "$YELLOW" "TypeScript compilation has errors. Please fix them"
}

# Step 9: Display next steps
echo ""
echo "✨ Setup Complete! Next steps:"
echo "================================"
echo "1. Update .env file with your API keys"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "📚 Available commands:"
echo "  npm run dev       - Start development server"
echo "  npm run build     - Build for production"
echo "  npm run lint      - Run linter"
echo "  npm run type-check - Check TypeScript types"
echo "  npm run format    - Format code with Prettier"
echo ""
print_status "SUCCESS" "$GREEN" "Environment setup completed successfully!"