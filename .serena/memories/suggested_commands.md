# Suggested Commands for Development

## Development Commands
```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Start production server
npm start
```

## Code Quality Commands  
```bash
# Run linter
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

## Testing Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch
```

## Database Commands
```bash
# Generate TypeScript types from Supabase
npm run db:types
```

## System Commands (Darwin/macOS)
```bash
# File operations
ls -la           # List files with permissions
find . -name     # Find files
grep -r          # Recursive search

# Git operations  
git status
git add .
git commit -m "message"
git push
git pull

# Process management
ps aux | grep node
kill -9 [PID]
lsof -i :3000    # Check port usage

# Environment
echo $PATH
which node
node --version
npm --version
```

## Debug Commands
```bash
# View TypeScript compilation errors
npx tsc --noEmit

# Check for unused dependencies
npx depcheck

# Analyze bundle size
npx next-bundle-analyzer
```