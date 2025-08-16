# Task Completion Checklist

## Before Marking Task Complete

### 1. Code Quality Checks
```bash
# MUST run these commands successfully:
npm run lint        # No linting errors
npm run type-check  # No TypeScript errors
npm test           # All tests pass
```

### 2. Testing Requirements
- [ ] Unit tests written for new functions
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows
- [ ] All existing tests still pass

### 3. Documentation
- [ ] JSDoc comments for public APIs
- [ ] README updated if needed
- [ ] Inline comments for complex logic
- [ ] Type definitions complete

### 4. Security Checks
- [ ] No hardcoded secrets/keys
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive info
- [ ] RLS policies updated if DB changes

### 5. Performance
- [ ] No unnecessary re-renders (React)
- [ ] Database queries optimized
- [ ] API calls have error handling
- [ ] Loading states implemented

### 6. Git Hygiene
- [ ] Changes committed with clear message
- [ ] Branch up to date with main
- [ ] No console.log statements
- [ ] No commented-out code

## Post-Implementation
1. Update task status in `.kiro/specs/[feature]/tasks.md`
2. Run full test suite
3. Test in development environment
4. Document any breaking changes