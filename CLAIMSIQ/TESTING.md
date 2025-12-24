# Testing & Observability Guide

This document outlines the testing strategy, tools, and best practices for the TrueManifest / MyARK application.

## 🛠 Tech Stack

- **Runner**: Vitest (fast, native Vite integration)
- **Environment**: JSDOM (browser simulation)
- **Utilities**: React Testing Library (component testing), ViTest Mocks (mocking dependencies)

## 📂 Directory Structure

Tests are co-located with the code they test (e.g., `__tests__` directories) or adjacent to the file.

- `src/services/__tests__/` - Unit tests for business logic
- `src/components/screens/__tests__/` - Integration tests for screens and feature flows
- `src/test-utils.ts` - Shared test helpers and factories

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 📝 Writing Tests

### Service Unit Test Example
Mock external dependencies like Gemini AI inside `vi.mock`.

```typescript
import { vi, describe, it, expect } from 'vitest';
import { myService } from '../myService';

vi.mock('@google/genai'); // Hoisted automatically

describe('myService', () => {
  it('performs action correctly', async () => {
    // ... setup mocks
    const result = await myService.doSomething();
    expect(result).toBeDefined();
  });
});
```

### React Component Test Example
Use `render` and `screen` from RTL.

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

it('renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## 📊 Observability

### Logging
Use the `logger` utility instead of `console.log` for structured logging. This ensures we can easily pipe logs to a remote service in production.

```typescript
import { logger } from '@/services/logger';

logger.info('User logged in', { userId: '123' }, 'AuthService');
logger.error('API Failed', { error }, 'GeminiService');
```

- **Dev Mode**: Pretty printed to console with colors.
- **Prod Mode**: Suppresses debug/info, preserves warnings/errors.

### Telemetry
For future analytics, wrap the `logger` or create a `telemetryService` that listens to critical user actions (like 'Claim Synced', 'Manifest Generated').
