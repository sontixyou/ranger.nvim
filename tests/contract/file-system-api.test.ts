/**
 * Contract test for file-system-api.ts
 * Tests file system operation function signatures and behavior
 *
 * EXPECTED: These tests will FAIL until src/services/file-system.ts is implemented (T024)
 */

import { describe, it, expect, beforeEach, afterEach } from "npm:vitest@^1.0.0";
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

const TEST_DIR = "/tmp/ranger-test-fs";

beforeEach(async () => {
  // Clean up test directory before each test
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore if doesn't exist
  }
  await Deno.mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
  // Clean up after tests
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
});

describe("createFile", () => {
  it("should have correct signature and return type", () => {
    const testPath = `${TEST_DIR}/test.txt`;
    const result = createFile(testPath, "content");
    expect(typeof result).toBe("string");
    expect(result).toBe(testPath);
  });

  it("should create file with default empty content", () => {
    const testPath = `${TEST_DIR}/empty.txt`;
    const result = createFile(testPath);
    expect(result).toBe(testPath);
    expect(exists(testPath)).toBe(true);
  });

  it("should throw error if file already exists", () => {
    const testPath = `${TEST_DIR}/duplicate.txt`;
    createFile(testPath, "initial");
    expect(() => createFile(testPath, "duplicate")).toThrow();
  });
});

describe("createDirectory", () => {
  it("should have correct signature and return type", () => {
    const dirPath = `${TEST_DIR}/newdir`;
    const result = createDirectory(dirPath);
    expect(typeof result).toBe("string");
    expect(result).toBe(dirPath);
  });

  it("should create directory", () => {
    const dirPath = `${TEST_DIR}/testdir`;
    createDirectory(dirPath);
    expect(exists(dirPath)).toBe(true);
    expect(isDirectory(dirPath)).toBe(true);
  });

  it("should support recursive creation", () => {
    const dirPath = `${TEST_DIR}/parent/child/grandchild`;
    const result = createDirectory(dirPath, true);
    expect(result).toBe(dirPath);
    expect(exists(dirPath)).toBe(true);
  });

  it("should throw error if directory already exists", () => {
    const dirPath = `${TEST_DIR}/existing`;
    createDirectory(dirPath);
    expect(() => createDirectory(dirPath)).toThrow();
  });
});

describe("deleteFile", () => {
  it("should have correct signature and return type", () => {
    const testPath = `${TEST_DIR}/to-delete.txt`;
    createFile(testPath, "content");
    const result = deleteFile(testPath);
    expect(typeof result).toBe("string");
    expect(result).toBe(testPath);
  });

  it("should delete existing file", () => {
    const testPath = `${TEST_DIR}/file.txt`;
    createFile(testPath, "content");
    expect(exists(testPath)).toBe(true);
    deleteFile(testPath);
    expect(exists(testPath)).toBe(false);
  });

  it("should throw error if path doesn't exist", () => {
    expect(() => deleteFile(`${TEST_DIR}/nonexistent.txt`)).toThrow();
  });

  it("should throw error if path is a directory", () => {
    const dirPath = `${TEST_DIR}/dir`;
    createDirectory(dirPath);
    expect(() => deleteFile(dirPath)).toThrow();
  });
});

describe("deleteDirectory", () => {
  it("should have correct signature and return type", () => {
    const dirPath = `${TEST_DIR}/to-delete`;
    createDirectory(dirPath);
    const result = deleteDirectory(dirPath);
    expect(typeof result).toBe("string");
    expect(result).toBe(dirPath);
  });

  it("should delete empty directory", () => {
    const dirPath = `${TEST_DIR}/emptydir`;
    createDirectory(dirPath);
    deleteDirectory(dirPath);
    expect(exists(dirPath)).toBe(false);
  });

  it("should delete non-empty directory with recursive flag", () => {
    const dirPath = `${TEST_DIR}/parentdir`;
    createDirectory(dirPath);
    createFile(`${dirPath}/file.txt`, "content");
    deleteDirectory(dirPath, true);
    expect(exists(dirPath)).toBe(false);
  });

  it("should throw error if directory is non-empty without recursive flag", () => {
    const dirPath = `${TEST_DIR}/nonempty`;
    createDirectory(dirPath);
    createFile(`${dirPath}/file.txt`, "content");
    expect(() => deleteDirectory(dirPath, false)).toThrow();
  });

  it("should throw error if path is a file", () => {
    const filePath = `${TEST_DIR}/file.txt`;
    createFile(filePath, "content");
    expect(() => deleteDirectory(filePath)).toThrow();
  });
});

describe("rename", () => {
  it("should have correct signature and return type", () => {
    const oldPath = `${TEST_DIR}/old.txt`;
    const newPath = `${TEST_DIR}/new.txt`;
    createFile(oldPath, "content");
    const result = rename(oldPath, newPath);
    expect(typeof result).toBe("string");
    expect(result).toBe(newPath);
  });

  it("should rename file", () => {
    const oldPath = `${TEST_DIR}/before.txt`;
    const newPath = `${TEST_DIR}/after.txt`;
    createFile(oldPath, "content");
    rename(oldPath, newPath);
    expect(exists(oldPath)).toBe(false);
    expect(exists(newPath)).toBe(true);
  });

  it("should rename directory", () => {
    const oldPath = `${TEST_DIR}/olddir`;
    const newPath = `${TEST_DIR}/newdir`;
    createDirectory(oldPath);
    rename(oldPath, newPath);
    expect(exists(oldPath)).toBe(false);
    expect(exists(newPath)).toBe(true);
  });

  it("should throw error if old path doesn't exist", () => {
    expect(() => rename(`${TEST_DIR}/nonexistent`, `${TEST_DIR}/new`)).toThrow();
  });

  it("should throw error if new path already exists", () => {
    const path1 = `${TEST_DIR}/file1.txt`;
    const path2 = `${TEST_DIR}/file2.txt`;
    createFile(path1, "content1");
    createFile(path2, "content2");
    expect(() => rename(path1, path2)).toThrow();
  });
});

describe("copyFile", () => {
  it("should have correct signature and return type", () => {
    const src = `${TEST_DIR}/source.txt`;
    const dest = `${TEST_DIR}/destination.txt`;
    createFile(src, "content");
    const result = copyFile(src, dest);
    expect(typeof result).toBe("string");
    expect(result).toBe(dest);
  });

  it("should copy file", () => {
    const src = `${TEST_DIR}/original.txt`;
    const dest = `${TEST_DIR}/copy.txt`;
    createFile(src, "test content");
    copyFile(src, dest);
    expect(exists(src)).toBe(true);
    expect(exists(dest)).toBe(true);
  });

  it("should throw error if source doesn't exist", () => {
    expect(() => copyFile(`${TEST_DIR}/missing`, `${TEST_DIR}/dest`)).toThrow();
  });

  it("should throw error if source is a directory", () => {
    const srcDir = `${TEST_DIR}/srcdir`;
    createDirectory(srcDir);
    expect(() => copyFile(srcDir, `${TEST_DIR}/dest`)).toThrow();
  });

  it("should throw error if destination already exists", () => {
    const src = `${TEST_DIR}/src.txt`;
    const dest = `${TEST_DIR}/dest.txt`;
    createFile(src, "content");
    createFile(dest, "existing");
    expect(() => copyFile(src, dest)).toThrow();
  });
});

describe("copyDirectory", () => {
  it("should have correct signature and return type", () => {
    const src = `${TEST_DIR}/srcdir`;
    const dest = `${TEST_DIR}/destdir`;
    createDirectory(src);
    const result = copyDirectory(src, dest);
    expect(typeof result).toBe("string");
    expect(result).toBe(dest);
  });

  it("should copy directory recursively", () => {
    const src = `${TEST_DIR}/original`;
    const dest = `${TEST_DIR}/copied`;
    createDirectory(src);
    createFile(`${src}/file.txt`, "content");
    copyDirectory(src, dest);
    expect(exists(src)).toBe(true);
    expect(exists(dest)).toBe(true);
    expect(exists(`${dest}/file.txt`)).toBe(true);
  });

  it("should throw error if source is a file", () => {
    const srcFile = `${TEST_DIR}/file.txt`;
    createFile(srcFile, "content");
    expect(() => copyDirectory(srcFile, `${TEST_DIR}/dest`)).toThrow();
  });

  it("should throw error if destination already exists", () => {
    const src = `${TEST_DIR}/src`;
    const dest = `${TEST_DIR}/dest`;
    createDirectory(src);
    createDirectory(dest);
    expect(() => copyDirectory(src, dest)).toThrow();
  });
});

describe("moveFile", () => {
  it("should have correct signature and return type", () => {
    const src = `${TEST_DIR}/file.txt`;
    const dest = `${TEST_DIR}/moved.txt`;
    createFile(src, "content");
    const result = moveFile(src, dest);
    expect(typeof result).toBe("string");
    expect(result).toBe(dest);
  });

  it("should move file", () => {
    const src = `${TEST_DIR}/before.txt`;
    const dest = `${TEST_DIR}/after.txt`;
    createFile(src, "content");
    moveFile(src, dest);
    expect(exists(src)).toBe(false);
    expect(exists(dest)).toBe(true);
  });

  it("should throw error if source is a directory", () => {
    const srcDir = `${TEST_DIR}/dir`;
    createDirectory(srcDir);
    expect(() => moveFile(srcDir, `${TEST_DIR}/dest`)).toThrow();
  });
});

describe("moveDirectory", () => {
  it("should have correct signature and return type", () => {
    const src = `${TEST_DIR}/dir`;
    const dest = `${TEST_DIR}/moved`;
    createDirectory(src);
    const result = moveDirectory(src, dest);
    expect(typeof result).toBe("string");
    expect(result).toBe(dest);
  });

  it("should move directory", () => {
    const src = `${TEST_DIR}/original`;
    const dest = `${TEST_DIR}/moved`;
    createDirectory(src);
    createFile(`${src}/file.txt`, "content");
    moveDirectory(src, dest);
    expect(exists(src)).toBe(false);
    expect(exists(dest)).toBe(true);
    expect(exists(`${dest}/file.txt`)).toBe(true);
  });

  it("should throw error if source is a file", () => {
    const srcFile = `${TEST_DIR}/file.txt`;
    createFile(srcFile, "content");
    expect(() => moveDirectory(srcFile, `${TEST_DIR}/dest`)).toThrow();
  });
});

describe("exists", () => {
  it("should have correct signature and return type", () => {
    const result = exists(TEST_DIR);
    expect(typeof result).toBe("boolean");
  });

  it("should return true for existing path", () => {
    const testPath = `${TEST_DIR}/exists.txt`;
    createFile(testPath, "content");
    expect(exists(testPath)).toBe(true);
  });

  it("should return false for non-existing path", () => {
    expect(exists(`${TEST_DIR}/does-not-exist`)).toBe(false);
  });

  it("should work for directories", () => {
    const dirPath = `${TEST_DIR}/existdir`;
    createDirectory(dirPath);
    expect(exists(dirPath)).toBe(true);
  });
});

describe("isDirectory", () => {
  it("should have correct signature and return type", () => {
    const result = isDirectory(TEST_DIR);
    expect(typeof result).toBe("boolean");
  });

  it("should return true for directory", () => {
    const dirPath = `${TEST_DIR}/testdir`;
    createDirectory(dirPath);
    expect(isDirectory(dirPath)).toBe(true);
  });

  it("should return false for file", () => {
    const filePath = `${TEST_DIR}/file.txt`;
    createFile(filePath, "content");
    expect(isDirectory(filePath)).toBe(false);
  });

  it("should throw error if path doesn't exist", () => {
    expect(() => isDirectory(`${TEST_DIR}/nonexistent`)).toThrow();
  });
});
