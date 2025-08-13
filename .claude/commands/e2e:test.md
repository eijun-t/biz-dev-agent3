---
allowed-tools: Playwright(), Bash(npm:), Bash(git:), Bash(cat:)
description: Analyze implementation content, generate and execute E2E test cases, and verify quality
---

## Context
- Current project status: !`git status`
- Recent changes: !`git show --stat HEAD`
- Package information: !`cat package.json`
- Existing test files: !`git ls-files '**/*.test.*' '**/*.spec.*' | head -10`

## Your task
Analyze the implemented content and execute comprehensive E2E tests to verify quality:

### Execution Steps:

#### 1. Implementation Analysis
- Review recent commits and file changes
- Identify implemented features, components, and API endpoints
- Understand architecture and design patterns

#### 2. Test Case Design
Design comprehensive test cases from the following perspectives:

Functional Aspects:
- Happy path user flows
- Error handling for edge cases
- Edge cases (boundary values, empty strings, null values, etc.)
- Responsive design behavior

Quality Aspects:
- Performance (page load time, response time)
- Accessibility (keyboard navigation, screen reader compatibility)
- Usability (intuitive operations, clear error messages)

Security Aspects:
- Authentication and authorization verification
- XSS attack prevention
- CSRF attack prevention
- Input value validation
- Sensitive information exposure checks

#### 3. Playwright Test Execution
- Implement designed test cases with Playwright MCP
- Browser testing with Chrome
- Generate detailed test reports

#### 4. Result Analysis and Improvement Proposals
- Clearly categorize successful and failed tests
- Detailed analysis of failure reasons
- Prioritize items that require fixes
- Confirm with user whether to execute fixes

### Requirements
1. Comprehensiveness: Cover functionality, quality, and security
2. Practicality: Realistic scenarios that mimic actual user behavior
3. Clarity: Organize and report results clearly
4. Actionability: Provide specific, executable proposals

### Test Execution Guidelines
- Parallel Execution: Run multiple tests concurrently
- Screenshots: Record failures visually
- Video Recording: Record complex interactions
- Performance Measurement: Measure Core Web Vitals
- Accessibility Audit: Automated checks (e.g., Lighthouse)

### Output Format

#### Test Results Summary
- Total tests: X
- Passed: Y (Success rate: Z%)
- Failed: A
- Skipped: B

#### Detailed Report
1. Successful Tests
   - Test name and overview
   - Verified points

2. Failed Tests
   - Test name and failure reason
   - Error messages and screenshots
   - Fix proposals

3. Performance Metrics
   - Page load time
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)

4. Security Check Results
   - Detected vulnerabilities
   - Recommended countermeasures