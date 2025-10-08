/**
 * Contract test for file-system-api.ts
 * Tests file system operation function signatures and behavior
 *
 * EXPECTED: These tests will FAIL until src/services/file-system.ts is implemented (T024)
 */

import {
  createFile,
  createDirectory,
  deleteFile,
  exists,
  isDirectory,
} from "../../src/services/file-system.ts";
import { assertEquals, assertThrows, assertTypeOf } from "../test-utils.ts";

const TEST_DIR = "/tmp/ranger-test-fs";

// Setup function
const setupTestDir = async () => {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }
  await Deno.mkdir(TEST_DIR, { recursive: true });
};

// Cleanup function
const cleanupTestDir = async () => {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
};

Deno.test("createFile - should have correct signature and return type", async () => {
  await setupTestDir();
  
  const testPath = `${TEST_DIR}/test.txt`;
  const result = createFile(testPath, "content");
  assertTypeOf(result, "string");
  assertEquals(result, testPath);
  
  await cleanupTestDir();
});

Deno.test("createFile - should create file with default empty content", async () => {
  await setupTestDir();
  
  const testPath = `${TEST_DIR}/empty.txt`;
  const result = createFile(testPath);
  assertEquals(result, testPath);
  assertEquals(exists(testPath), true);
  
  await cleanupTestDir();
});

Deno.test("createFile - should throw error if file already exists", async () => {
  await setupTestDir();
  
  const testPath = `${TEST_DIR}/duplicate.txt`;
  createFile(testPath, "initial");
  assertThrows(() => createFile(testPath, "duplicate"));
  
  await cleanupTestDir();
});

Deno.test("createDirectory - should have correct signature and return type", async () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/newdir`;
  const result = createDirectory(dirPath);
  assertTypeOf(result, "string");
  assertEquals(result, dirPath);
  
  await cleanupTestDir();
});

Deno.test("createDirectory - should create directory", async () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/testdir`;
  createDirectory(dirPath);
  assertEquals(exists(dirPath), true);
  assertEquals(isDirectory(dirPath), true);
  
  await cleanupTestDir();
});

Deno.test("deleteFile - should have correct signature and return type", async () => {
  await setupTestDir();
  
  const testPath = `${TEST_DIR}/to-delete.txt`;
  createFile(testPath, "content");
  const result = deleteFile(testPath);
  assertTypeOf(result, "string");
  assertEquals(result, testPath);
  
  await cleanupTestDir();
});

Deno.test("deleteFile - should delete existing file", async () => {
  await setupTestDir();
  
  const testPath = `${TEST_DIR}/file.txt`;
  createFile(testPath, "content");
  assertEquals(exists(testPath), true);
  deleteFile(testPath);
  assertEquals(exists(testPath), false);
  
  await cleanupTestDir();
});

// More tests would continue following the same pattern...
// Truncating for demonstration purposes as this shows the conversion approach