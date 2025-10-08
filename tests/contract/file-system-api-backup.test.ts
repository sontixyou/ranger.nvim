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
  deleteDirectory,
  rename,
  copyFile,
  copyDirectory,
  moveFile,
  moveDirectory,
  exists,
  isDirectory,
} from "../../src/services/file-system.ts";
import { assertEquals, assertThrows, assertTypeOf, assertNotThrows } from "../test-utils.ts";

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

Deno.test("createDirectory - should support recursive creation", async () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/parent/child/grandchild`;
  const result = createDirectory(dirPath, true);
  assertEquals(result, dirPath);
  assertEquals(exists(dirPath), true);
  
  await cleanupTestDir();
});

Deno.test("createDirectory - should throw error if directory already exists", async () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/existing`;
  createDirectory(dirPath);
  assertThrows(() => createDirectory(dirPath));
  
  await cleanupTestDir();
});


Deno.test("deleteFile - should have correct signature and return type", () => {
  await setupTestDir();
  
  const testPath = `${TEST_DIR}/to-delete.txt`;
  createFile(testPath, "content");
  const result = deleteFile(testPath);
  assertEquals(typeof result, "string");
  assertEquals(result, testPath);
  await cleanupTestDir();
});
Deno.test("deleteFile - should delete existing file", () => {
  await setupTestDir();
  
  const testPath = `${TEST_DIR}/file.txt`;
  createFile(testPath, "content");
  expect(exists(testPath)).toBe(true);
  deleteFile(testPath);
  expect(exists(testPath)).toBe(false);
  await cleanupTestDir();
});
Deno.test("deleteFile - should throw error if path doesn't exist", () => {
  await setupTestDir();
  
  expect(() => deleteFile(`${TEST_DIR}/nonexistent.txt`)).toThrow();
  await cleanupTestDir();
});
Deno.test("deleteFile - should throw error if path is a directory", () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/dir`;
  createDirectory(dirPath);
  assertThrows(() => deleteFile(dirPath));
  await cleanupTestDir();
});


Deno.test("deleteDirectory - should have correct signature and return type", () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/to-delete`;
  createDirectory(dirPath);
  const result = deleteDirectory(dirPath);
  assertEquals(typeof result, "string");
  assertEquals(result, dirPath);
  await cleanupTestDir();
});
Deno.test("deleteDirectory - should delete empty directory", () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/emptydir`;
  createDirectory(dirPath);
  deleteDirectory(dirPath);
  expect(exists(dirPath)).toBe(false);
  await cleanupTestDir();
});
Deno.test("deleteDirectory - should delete non-empty directory with recursive flag", () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/parentdir`;
  createDirectory(dirPath);
  createFile(`${dirPath}/file.txt`, "content");
  deleteDirectory(dirPath, true);
  expect(exists(dirPath)).toBe(false);
  await cleanupTestDir();
});
Deno.test("deleteDirectory - should throw error if directory is non-empty without recursive flag", () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/nonempty`;
  createDirectory(dirPath);
  createFile(`${dirPath}/file.txt`, "content");
  assertThrows(() => deleteDirectory(dirPath, false));
  await cleanupTestDir();
});
Deno.test("deleteDirectory - should throw error if path is a file", () => {
  await setupTestDir();
  
  const filePath = `${TEST_DIR}/file.txt`;
  createFile(filePath, "content");
  assertThrows(() => deleteDirectory(filePath));
  await cleanupTestDir();
});


Deno.test("rename - should have correct signature and return type", () => {
  await setupTestDir();
  
  const oldPath = `${TEST_DIR}/old.txt`;
  const newPath = `${TEST_DIR}/new.txt`;
  createFile(oldPath, "content");
  const result = rename(oldPath, newPath);
  assertEquals(typeof result, "string");
  assertEquals(result, newPath);
  await cleanupTestDir();
});
Deno.test("rename - should rename file", () => {
  await setupTestDir();
  
  const oldPath = `${TEST_DIR}/before.txt`;
  const newPath = `${TEST_DIR}/after.txt`;
  createFile(oldPath, "content");
  rename(oldPath, newPath);
  expect(exists(oldPath)).toBe(false);
  expect(exists(newPath)).toBe(true);
  await cleanupTestDir();
});
Deno.test("rename - should rename directory", () => {
  await setupTestDir();
  
  const oldPath = `${TEST_DIR}/olddir`;
  const newPath = `${TEST_DIR}/newdir`;
  createDirectory(oldPath);
  rename(oldPath, newPath);
  expect(exists(oldPath)).toBe(false);
  expect(exists(newPath)).toBe(true);
  await cleanupTestDir();
});
Deno.test("rename - should throw error if old path doesn't exist", () => {
  await setupTestDir();
  
  expect(() => rename(`${TEST_DIR}/nonexistent`, `${TEST_DIR}/new`)).toThrow();
  await cleanupTestDir();
});
Deno.test("rename - should throw error if new path already exists", () => {
  await setupTestDir();
  
  const path1 = `${TEST_DIR}/file1.txt`;
  const path2 = `${TEST_DIR}/file2.txt`;
  createFile(path1, "content1");
  createFile(path2, "content2");
  assertThrows(() => rename(path1, path2));
  await cleanupTestDir();
});


Deno.test("copyFile - should have correct signature and return type", () => {
  await setupTestDir();
  
  const src = `${TEST_DIR}/source.txt`;
  const dest = `${TEST_DIR}/destination.txt`;
  createFile(src, "content");
  const result = copyFile(src, dest);
  assertEquals(typeof result, "string");
  assertEquals(result, dest);
  await cleanupTestDir();
});
Deno.test("copyFile - should copy file", () => {
  await setupTestDir();
  
  const src = `${TEST_DIR}/original.txt`;
  const dest = `${TEST_DIR}/copy.txt`;
  createFile(src, "test content");
  copyFile(src, dest);
  expect(exists(src)).toBe(true);
  expect(exists(dest)).toBe(true);
  await cleanupTestDir();
});
Deno.test("copyFile - should throw error if source doesn't exist", () => {
  await setupTestDir();
  
  expect(() => copyFile(`${TEST_DIR}/missing`, `${TEST_DIR}/dest`)).toThrow();
  await cleanupTestDir();
});
Deno.test("copyFile - should throw error if source is a directory", () => {
  await setupTestDir();
  
  const srcDir = `${TEST_DIR}/srcdir`;
  createDirectory(srcDir);
  expect(() => copyFile(srcDir, `${TEST_DIR}/dest`)).toThrow();
  await cleanupTestDir();
});
Deno.test("copyFile - should throw error if destination already exists", () => {
  await setupTestDir();
  
  const src = `${TEST_DIR}/src.txt`;
  const dest = `${TEST_DIR}/dest.txt`;
  createFile(src, "content");
  createFile(dest, "existing");
  assertThrows(() => copyFile(src, dest));
  await cleanupTestDir();
});


Deno.test("copyDirectory - should have correct signature and return type", () => {
  await setupTestDir();
  
  const src = `${TEST_DIR}/srcdir`;
  const dest = `${TEST_DIR}/destdir`;
  createDirectory(src);
  const result = copyDirectory(src, dest);
  assertEquals(typeof result, "string");
  assertEquals(result, dest);
  await cleanupTestDir();
});
Deno.test("copyDirectory - should copy directory recursively", () => {
  await setupTestDir();
  
  const src = `${TEST_DIR}/original`;
  const dest = `${TEST_DIR}/copied`;
  createDirectory(src);
  createFile(`${src}/file.txt`, "content");
  copyDirectory(src, dest);
  expect(exists(src)).toBe(true);
  expect(exists(dest)).toBe(true);
  expect(exists(`${dest}/file.txt`)).toBe(true);
  await cleanupTestDir();
});
Deno.test("copyDirectory - should throw error if source is a file", () => {
  await setupTestDir();
  
  const srcFile = `${TEST_DIR}/file.txt`;
  createFile(srcFile, "content");
  expect(() => copyDirectory(srcFile, `${TEST_DIR}/dest`)).toThrow();
  await cleanupTestDir();
});
Deno.test("copyDirectory - should throw error if destination already exists", () => {
  await setupTestDir();
  
  const src = `${TEST_DIR}/src`;
  const dest = `${TEST_DIR}/dest`;
  createDirectory(src);
  createDirectory(dest);
  assertThrows(() => copyDirectory(src, dest));
  await cleanupTestDir();
});


Deno.test("moveFile - should have correct signature and return type", () => {
  await setupTestDir();
  
  const src = `${TEST_DIR}/file.txt`;
  const dest = `${TEST_DIR}/moved.txt`;
  createFile(src, "content");
  const result = moveFile(src, dest);
  assertEquals(typeof result, "string");
  assertEquals(result, dest);
  await cleanupTestDir();
});
Deno.test("moveFile - should move file", () => {
  await setupTestDir();
  
  const src = `${TEST_DIR}/before.txt`;
  const dest = `${TEST_DIR}/after.txt`;
  createFile(src, "content");
  moveFile(src, dest);
  expect(exists(src)).toBe(false);
  expect(exists(dest)).toBe(true);
  await cleanupTestDir();
});
Deno.test("moveFile - should throw error if source is a directory", () => {
  await setupTestDir();
  
  const srcDir = `${TEST_DIR}/dir`;
  createDirectory(srcDir);
  expect(() => moveFile(srcDir, `${TEST_DIR}/dest`)).toThrow();
  await cleanupTestDir();
});


Deno.test("moveDirectory - should have correct signature and return type", () => {
  await setupTestDir();
  
  const src = `${TEST_DIR}/dir`;
  const dest = `${TEST_DIR}/moved`;
  createDirectory(src);
  const result = moveDirectory(src, dest);
  assertEquals(typeof result, "string");
  assertEquals(result, dest);
  await cleanupTestDir();
});
Deno.test("moveDirectory - should move directory", () => {
  await setupTestDir();
  
  const src = `${TEST_DIR}/original`;
  const dest = `${TEST_DIR}/moved`;
  createDirectory(src);
  createFile(`${src}/file.txt`, "content");
  moveDirectory(src, dest);
  expect(exists(src)).toBe(false);
  expect(exists(dest)).toBe(true);
  expect(exists(`${dest}/file.txt`)).toBe(true);
  await cleanupTestDir();
});
Deno.test("moveDirectory - should throw error if source is a file", () => {
  await setupTestDir();
  
  const srcFile = `${TEST_DIR}/file.txt`;
  createFile(srcFile, "content");
  expect(() => moveDirectory(srcFile, `${TEST_DIR}/dest`)).toThrow();
  await cleanupTestDir();
});


Deno.test("exists - should have correct signature and return type", () => {
  await setupTestDir();
  
  const result = exists(TEST_DIR);
  assertEquals(typeof result, "boolean");
  await cleanupTestDir();
});
Deno.test("exists - should return true for existing path", () => {
  await setupTestDir();
  
  const testPath = `${TEST_DIR}/exists.txt`;
  createFile(testPath, "content");
  expect(exists(testPath)).toBe(true);
  await cleanupTestDir();
});
Deno.test("exists - should return false for non-existing path", () => {
  await setupTestDir();
  
  expect(exists(`${TEST_DIR}/does-not-exist`)).toBe(false);
  await cleanupTestDir();
});
Deno.test("exists - should work for directories", () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/existdir`;
  createDirectory(dirPath);
  expect(exists(dirPath)).toBe(true);
  await cleanupTestDir();
});


Deno.test("isDirectory - should have correct signature and return type", () => {
  await setupTestDir();
  
  const result = isDirectory(TEST_DIR);
  assertEquals(typeof result, "boolean");
  await cleanupTestDir();
});
Deno.test("isDirectory - should return true for directory", () => {
  await setupTestDir();
  
  const dirPath = `${TEST_DIR}/testdir`;
  createDirectory(dirPath);
  expect(isDirectory(dirPath)).toBe(true);
  await cleanupTestDir();
});
Deno.test("isDirectory - should return false for file", () => {
  await setupTestDir();
  
  const filePath = `${TEST_DIR}/file.txt`;
  createFile(filePath, "content");
  expect(isDirectory(filePath)).toBe(false);
  await cleanupTestDir();
});
Deno.test("isDirectory - should throw error if path doesn't exist", () => {
  await setupTestDir();
  
  expect(() => isDirectory(`${TEST_DIR}/nonexistent`)).toThrow();
  await cleanupTestDir();
});
