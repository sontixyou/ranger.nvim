# Vitest to Deno Test Migration Guide

This document describes the completed migration from vitest to Deno's native testing functionality.

## Migration Status

### ✅ Completed
- **Core Infrastructure**: Updated `deno.json` with test tasks and configuration
- **Test Utilities**: Created `tests/test-utils.ts` with assertion helpers and mock functions
- **Key Test Files Converted**:
  - `tests/contract/system-api.test.ts` (8 tests passing)
  - `tests/contract/file-system-api.test.ts` (7 tests passing)
  - `tests/integration/open-tree.test.ts` (4 tests passing)
- **Configuration**: Removed `vitest.config.ts`

### 📋 Remaining Files to Convert (14 files)
- `tests/contract/search-api.test.ts`
- `tests/contract/tree-api.test.ts`
- `tests/contract/types.test.ts` (partially converted)
- `tests/contract/ui-api.test.ts`
- `tests/integration/copy-move.test.ts`
- `tests/integration/create-file.test.ts`
- `tests/integration/delete.test.ts`
- `tests/integration/expand-collapse.test.ts`
- `tests/integration/navigate.test.ts`
- `tests/integration/open-file.test.ts`
- `tests/integration/rename.test.ts`
- `tests/integration/search.test.ts`
- `tests/integration/system-app.test.ts`
- `tests/integration/toggle-hidden.test.ts`

## Conversion Patterns

### 1. Import Changes
```typescript
// Before (vitest)
import { describe, it, expect, beforeEach, afterEach, vi } from "npm:vitest@^1.0.0";

// After (Deno)
import { assertEquals, assertThrows, createMockFn } from "../test-utils.ts";
```

### 2. Test Structure Changes
```typescript
// Before (vitest)
describe("Feature name", () => {
  it("should do something", () => {
    expect(result).toBe(expected);
  });
});

// After (Deno)
Deno.test("Feature name - should do something", () => {
  assertEquals(result, expected);
});
```

### 3. Setup/Teardown Changes
```typescript
// Before (vitest)
beforeEach(async () => {
  // setup code
});

afterEach(async () => {
  // cleanup code
});

// After (Deno)
const setupTest = async () => {
  // setup code
};

const cleanupTest = async () => {
  // cleanup code
};

Deno.test("test name", async () => {
  await setupTest();
  // test code
  await cleanupTest();
});
```

### 4. Assertion Changes
```typescript
// Before (vitest)
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(typeof value).toBe("string");
expect(array).toContain(item);
expect(() => fn()).toThrow();
expect(() => fn()).not.toThrow();

// After (Deno)
assertEquals(value, expected);
assertEquals(value, expected);
assertTypeOf(value, "string");
assertContains(array, item);
assertThrows(() => fn());
assertNotThrows(() => fn());
```

### 5. Mocking Changes
```typescript
// Before (vitest)
const mockFn = vi.fn();
mockFn.mockReturnValue("result");

// After (Deno)
const mockFn = createMockFn();
mockFn.mockReturnValue("result");
```

## Running Tests

### New Deno Commands
```bash
# Run all tests
deno task test

# Run with coverage
deno task test:coverage

# Run in watch mode
deno task test:watch

# Run specific test files
deno test --allow-read --allow-write --allow-run tests/contract/system-api.test.ts
```

### Test Permissions
All tests require these Deno permissions:
- `--allow-read` - for reading test files and fixtures
- `--allow-write` - for creating temporary test directories
- `--allow-run` - for system command testing (platform detection, file opening)

## Available Assertion Helpers (tests/test-utils.ts)

- `assertEquals(actual, expected, msg?)` - Basic equality assertion
- `assertThrows(fn, msg?)` - Assert function throws
- `assertNotThrows(fn, msg?)` - Assert function doesn't throw
- `assertTypeOf(value, type, msg?)` - Assert typeof value
- `assertContains(array, item, msg?)` - Assert array contains item
- `assertLessThan(actual, expected, msg?)` - Assert numeric comparison
- `assertGreaterThan(actual, expected, msg?)` - Assert numeric comparison
- `assertStringIncludes(actual, expected, msg?)` - Assert string contains substring
- `assertDefined(value, msg?)` - Assert value is not null/undefined
- `createMockFn<T>()` - Create mock function with vitest-like API

## Benefits of Migration

1. **Native Deno Integration**: No external dependencies for testing
2. **Better TypeScript Support**: Native Deno TypeScript support
3. **Consistent Runtime**: Same runtime for development and testing
4. **Simplified Configuration**: No separate test runner configuration
5. **Performance**: Faster startup without npm dependency resolution
6. **Security**: Explicit permissions for test operations

## Next Steps

To complete the migration, systematically convert each remaining test file following the established patterns above. The migration approach is proven and working - it's primarily a mechanical conversion process.