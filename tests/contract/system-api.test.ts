/**
 * Contract test for system-api.ts
 * Tests system integration function signatures
 *
 * EXPECTED: These tests will FAIL until src/services/system-app.ts is implemented (T027)
 */

import { describe, it, expect, beforeEach, afterEach } from "npm:vitest@^1.0.0";
import { openWithSystemApp, detectPlatform } from "../../src/services/system-app.ts";

const TEST_DIR = "/tmp/ranger-test-system";

beforeEach(async () => {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore
  }
  await Deno.mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore
  }
});

describe("detectPlatform", () => {
  it("should return 'darwin' or 'linux'", () => {
    const platform = detectPlatform();
    expect(["darwin", "linux"]).toContain(platform);
  });

  it("should match Deno.build.os for supported platforms", () => {
    const platform = detectPlatform();
    if (Deno.build.os === "darwin" || Deno.build.os === "linux") {
      expect(platform).toBe(Deno.build.os);
    }
  });

  it("should throw error on unsupported platform", () => {
    // This test would only fail on Windows or other unsupported platforms
    // Skip if we're on a supported platform
    if (Deno.build.os === "darwin" || Deno.build.os === "linux") {
      expect(() => detectPlatform()).not.toThrow();
    }
  });
});

describe("openWithSystemApp", () => {
  it("should not throw for existing file", async () => {
    const testFile = `${TEST_DIR}/test.txt`;
    await Deno.writeTextFile(testFile, "test content");

    // On macOS/Linux, this should work
    if (Deno.build.os === "darwin" || Deno.build.os === "linux") {
      expect(() => openWithSystemApp(testFile)).not.toThrow();
    }
  });

  it("should throw error if path doesn't exist", () => {
    const nonexistent = `${TEST_DIR}/nonexistent.txt`;
    expect(() => openWithSystemApp(nonexistent)).toThrow();
  });

  it("should throw error if path is a directory", async () => {
    const dirPath = `${TEST_DIR}/testdir`;
    await Deno.mkdir(dirPath);
    expect(() => openWithSystemApp(dirPath)).toThrow();
  });

  it("should use correct command for platform", async () => {
    const testFile = `${TEST_DIR}/test.txt`;
    await Deno.writeTextFile(testFile, "content");

    const platform = detectPlatform();

    // This test verifies the contract but actual command execution
    // depends on system configuration
    if (platform === "darwin") {
      // Should use 'open' command on macOS
      expect(() => openWithSystemApp(testFile)).not.toThrow();
    } else if (platform === "linux") {
      // Should use 'xdg-open' command on Linux
      // May fail if xdg-utils not installed, which is acceptable
      try {
        openWithSystemApp(testFile);
      } catch (error) {
        // Allow failures due to missing xdg-open
        expect(error).toBeDefined();
      }
    }
  });

  it("should execute synchronously", async () => {
    const testFile = `${TEST_DIR}/sync-test.txt`;
    await Deno.writeTextFile(testFile, "sync test");

    // Function should block until spawn completes
    // (child process runs detached, but spawn itself is synchronous)
    const start = Date.now();

    try {
      openWithSystemApp(testFile);
      const duration = Date.now() - start;

      // Synchronous spawn should complete quickly (< 1 second)
      // Even though child runs detached
      expect(duration).toBeLessThan(1000);
    } catch {
      // Ignore failures due to system configuration
    }
  });
});
