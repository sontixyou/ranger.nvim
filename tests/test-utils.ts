/**
 * Shared test utilities and assertion helpers for Deno tests
 */

// Simple assertion helpers to replace vitest expect API
export const assertEquals = (actual: unknown, expected: unknown, msg?: string) => {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${expected}, got ${actual}`);
  }
};

export const assertContains = <T>(array: T[], item: T, msg?: string) => {
  if (!array.includes(item)) {
    throw new Error(msg || `Expected array to contain ${item}`);
  }
};

export const assertThrows = (fn: () => void, msg?: string) => {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error(msg || "Expected function to throw");
  }
};

export const assertNotThrows = (fn: () => void, msg?: string) => {
  try {
    fn();
  } catch (error) {
    throw new Error(msg || `Expected function not to throw, but got: ${error}`);
  }
};

export const assertLessThan = (actual: number, expected: number, msg?: string) => {
  if (actual >= expected) {
    throw new Error(msg || `Expected ${actual} to be less than ${expected}`);
  }
};

export const assertGreaterThan = (actual: number, expected: number, msg?: string) => {
  if (actual <= expected) {
    throw new Error(msg || `Expected ${actual} to be greater than ${expected}`);
  }
};

export const assertStringIncludes = (actual: string, expected: string, msg?: string) => {
  if (!actual.includes(expected)) {
    throw new Error(msg || `Expected string "${actual}" to include "${expected}"`);
  }
};

export const assertDefined = (value: unknown, msg?: string) => {
  if (value === undefined || value === null) {
    throw new Error(msg || "Expected value to be defined");
  }
};

export const assertInstanceOf = <T>(value: unknown, constructor: new (...args: unknown[]) => T, msg?: string): asserts value is T => {
  if (!(value instanceof constructor)) {
    throw new Error(msg || `Expected value to be instance of ${constructor.name}`);
  }
};

export const assertTypeOf = (value: unknown, type: string, msg?: string) => {
  if (typeof value !== type) {
    throw new Error(msg || `Expected typeof ${value} to be ${type}, got ${typeof value}`);
  }
};

// Mock function helper
export interface MockFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  mockReturnValue(value: ReturnType<T>): void;
  mockResolvedValue(value: Awaited<ReturnType<T>>): void;
  mockImplementation(fn: T): void;
  calls: Parameters<T>[];
  results: ReturnType<T>[];
}

export const createMockFn = <T extends (...args: any[]) => any>(): MockFunction<T> => {
  const calls: Parameters<T>[] = [];
  const results: ReturnType<T>[] = [];
  let mockReturnValue: ReturnType<T> | undefined;
  let mockImplementation: T | undefined;

  const mockFn = ((...args: Parameters<T>) => {
    calls.push(args);
    
    if (mockImplementation) {
      const result = mockImplementation(...args);
      results.push(result);
      return result;
    }
    
    if (mockReturnValue !== undefined) {
      results.push(mockReturnValue);
      return mockReturnValue;
    }
    
    return undefined;
  }) as MockFunction<T>;

  mockFn.mockReturnValue = (value: ReturnType<T>) => {
    mockReturnValue = value;
  };

  mockFn.mockResolvedValue = (value: Awaited<ReturnType<T>>) => {
    mockReturnValue = Promise.resolve(value) as ReturnType<T>;
  };

  mockFn.mockImplementation = (fn: T) => {
    mockImplementation = fn;
  };

  mockFn.calls = calls;
  mockFn.results = results;

  return mockFn;
};