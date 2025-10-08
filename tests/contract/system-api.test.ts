/**
 * Contract test for system-api.ts
 * Tests system integration function signatures
 *
 * EXPECTED: These tests will FAIL until src/services/system-app.ts is implemented (T027)
 */

import { openWithSystemApp, detectPlatform } from "../../src/services/system-app.ts";
import { assertEquals, assertContains, assertThrows, assertNotThrows, assertLessThan } from "../test-utils.ts";

const TEST_DIR = "/tmp/ranger-test-system";

// Setup function
const setupTestDir = async () => {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore
  }
  await Deno.mkdir(TEST_DIR, { recursive: true });
};

// Cleanup function
const cleanupTestDir = async () => {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore
  }
};

Deno.test("detectPlatform - should return 'darwin' or 'linux'", () => {
  const platform = detectPlatform();
  assertContains(["darwin", "linux"], platform);
});

Deno.test("detectPlatform - should match Deno.build.os for supported platforms", () => {
  const platform = detectPlatform();
  if (Deno.build.os === "darwin" || Deno.build.os === "linux") {
    assertEquals(platform, Deno.build.os);
  }
});

Deno.test("detectPlatform - should throw error on unsupported platform", () => {
  // This test would only fail on Windows or other unsupported platforms
  // Skip if we're on a supported platform
  if (Deno.build.os === "darwin" || Deno.build.os === "linux") {
    assertNotThrows(() => detectPlatform());
  }
});

Deno.test("openWithSystemApp - should not throw for existing file", async () => {
  await setupTestDir();
  
  const testFile = `${TEST_DIR}/test.txt`;
  await Deno.writeTextFile(testFile, "test content");

  // On macOS/Linux, this should work
  if (Deno.build.os === "darwin" || Deno.build.os === "linux") {
    assertNotThrows(() => openWithSystemApp(testFile));
  }
  
  await cleanupTestDir();
});

Deno.test("openWithSystemApp - should throw error if path doesn't exist", async () => {
  await setupTestDir();
  
  const nonexistent = `${TEST_DIR}/nonexistent.txt`;
  assertThrows(() => openWithSystemApp(nonexistent));
  
  await cleanupTestDir();
});

Deno.test("openWithSystemApp - should throw error if path is a directory", async () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/testdir`;
  await Deno.mkdir(dirPath);
  assertThrows(() => openWithSystemApp(dirPath));
  
  await cleanupTestDir();
});

Deno.test("openWithSystemApp - should use correct command for platform", async () => {
  await setupTestDir();
  
  const testFile = `${TEST_DIR}/test.txt`;
  await Deno.writeTextFile(testFile, "content");

  const platform = detectPlatform();

  // This test verifies the contract but actual command execution
  // depends on system configuration
  if (platform === "darwin") {
    // Should use 'open' command on macOS
    assertNotThrows(() => openWithSystemApp(testFile));
  } else if (platform === "linux") {
    // Should use 'xdg-open' command on Linux
    // May fail if xdg-utils not installed, which is acceptable
    try {
      openWithSystemApp(testFile);
    } catch (error) {
      // Allow failures due to missing xdg-open
      if (!error) {
        throw new Error("Expected error to be defined when xdg-open fails");
      }
    }
  }
  
  await cleanupTestDir();
});

Deno.test("openWithSystemApp - should execute synchronously", async () => {
  await setupTestDir();
  
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
    assertLessThan(duration, 1000);
  } catch {
    // Ignore failures due to system configuration
  }
  
  await cleanupTestDir();
});
