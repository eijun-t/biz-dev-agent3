# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled (`strict: true`)
- **Target**: ES2017
- **Module**: ESNext with bundler resolution
- **Path Alias**: `@/*` maps to project root

## Naming Conventions
- **Files**: kebab-case (e.g., `agent-graph.ts`, `job-queue.ts`)
- **Components**: PascalCase (e.g., `OrchestrationDashboard.tsx`)
- **Interfaces/Types**: PascalCase with descriptive names
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE

## Code Organization
- **Single Responsibility**: Each file/module has one clear purpose
- **Barrel Exports**: Use `index.ts` for clean imports
- **Type-First**: Define interfaces before implementation
- **Async/Await**: Preferred over promises chains

## Documentation
- JSDoc comments for public APIs
- Japanese comments for complex business logic
- Type definitions self-document parameters

## Error Handling
- Try-catch with specific error types
- Graceful degradation with fallbacks
- Logging errors with context

## Testing
- Test files adjacent to source: `__tests__/`
- Descriptive test names in Japanese
- Mock external dependencies
- Focus on integration tests

## Component Structure (React)
```tsx
// Imports
import { FC } from 'react';

// Types
interface Props {}

// Component
export const Component: FC<Props> = () => {
  return <div></div>;
};
```

## Agent Structure
```typescript
// Base interface implementation
export class ConcreteAgent implements BaseAgent {
  async execute(input: AgentInput): Promise<AgentOutput> {
    // Implementation
  }
}
```