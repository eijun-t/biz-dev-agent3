---
description: Update specification documents based on implementation learnings
allowed-tools: Read, Write, Edit, MultiEdit, Glob, Grep, LS
---

# Kiro Spec Update

Update existing specification documents (requirements.md, design.md, tasks.md) based on implementation experience and learnings.

## Usage

```
/kiro:spec-update <feature-name> [--section <section-name>] [--document <doc-type>]
```

### Options
- `--section`: Specific section to update (e.g., "api-integration", "error-handling")
- `--document`: Specific document to update ("requirements", "design", "tasks", or "all")

### Examples
```
/kiro:spec-update researcher-agent
/kiro:spec-update researcher-agent --document design
/kiro:spec-update researcher-agent --section edge-functions --document all
```

## Process

### 1. Analyze Implementation
- Review actual implementation files
- Identify deviations from original spec
- Note new patterns, libraries, or approaches used
- Collect lessons learned

### 2. Determine Updates Needed
Compare implementation with spec to find:
- **New requirements** discovered during implementation
- **Design changes** made for technical reasons
- **Task modifications** or additional tasks needed
- **Performance optimizations** not in original spec
- **Security considerations** added
- **Edge cases** handled

### 3. Update Specification Documents

#### Requirements Updates
- Add newly discovered functional requirements
- Update non-functional requirements (performance, security)
- Note constraints found during implementation
- Add edge cases as requirements

#### Design Updates
- Update architectural decisions
- Add new components or modules
- Update API specifications
- Document integration patterns used
- Add error handling strategies

#### Tasks Updates
- Mark completed tasks
- Add tasks that were needed but not originally planned
- Update task descriptions based on actual work
- Add lessons learned as notes

### 4. Maintain Traceability
- Add "Implementation Notes" sections where appropriate
- Link to actual code files
- Note why changes were made
- Keep original content with [ORIGINAL] tags if significantly changed

## Instructions

1. **Check if feature exists**: Verify `.kiro/specs/<feature-name>/` exists
2. **Read current specs**: Load requirements.md, design.md, and tasks.md
3. **Analyze implementation**: 
   - Find implemented files using Glob
   - Review code for patterns and decisions
   - Note differences from spec
4. **Update documents**:
   - Preserve original intent
   - Add implementation learnings
   - Mark deprecated sections
   - Add timestamps for updates
5. **Add implementation notes**: Include file references and rationale

## Example Update Format

```markdown
### API Integration [UPDATED: 2024-01-06]

**Original Design:**
- Direct fetch calls to external API

**Implementation Update:**
- Created dedicated service class for better abstraction
- Added retry logic with exponential backoff
- Implemented caching layer for performance
- See: `lib/services/serper/serper-search-service.ts`

**Rationale:**
- Better testability with service abstraction
- Improved reliability with retry mechanism
- Reduced API calls with caching
```

## Important Principles

### Preserve Original Intent
- Don't remove original specifications
- Use strikethrough or [DEPRECATED] for outdated content
- Explain why changes were made

### Add Value
- Include specific file references
- Document patterns that worked well
- Note pitfalls to avoid
- Add performance metrics if available

### Maintain Consistency
- Use same formatting as original docs
- Keep section structure intact
- Update table of contents if needed

### Focus on Learnings
- What worked differently than expected?
- What additional considerations emerged?
- What would you do differently next time?

The goal is to create living documentation that reflects both the original vision and the practical implementation, helping future development on the project.