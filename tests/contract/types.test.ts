/**
 * Contract test for types.ts
 * Tests type definitions and interfaces compliance
 *
 * EXPECTED: These tests will FAIL until src/models/types.ts is implemented (T021)
 */

import type {
  FileNode,
  DirectoryNode,
  TreeNode,
  TreeState,
  FileOperation,
  SearchQuery,
} from "../../src/models/types.ts";
import { assertEquals } from "../test-utils.ts";

Deno.test("FileNode interface - should have required type literal 'file'", () => {
  const fileNode: FileNode = {
    type: "file",
    name: "test.ts",
    path: "/absolute/path/test.ts",
    hidden: false,
    fileType: "ts",
    size: 1024,
    mtime: new Date(),
  };
  assertEquals(fileNode.type, "file");
});

Deno.test("FileNode interface - should enforce all required properties", () => {
  const fileNode: FileNode = {
    type: "file",
    name: "README.md",
    path: "/home/user/README.md",
    hidden: false,
    fileType: "md",
    size: 2048,
    mtime: new Date("2025-01-01"),
  };

  assertEquals(fileNode.name, "README.md");
  assertEquals(fileNode.path, "/home/user/README.md");
  assertEquals(fileNode.hidden, false);
  assertEquals(fileNode.fileType, "md");
  assertEquals(fileNode.size, 2048);
  if (!(fileNode.mtime instanceof Date)) {
    throw new Error("Expected mtime to be instance of Date");
  }
});

Deno.test("FileNode interface - should support hidden files", () => {
  const hiddenFile: FileNode = {
    type: "file",
    name: ".gitignore",
    path: "/project/.gitignore",
    hidden: true,
    fileType: "",
    size: 128,
    mtime: new Date(),
  };

  assertEquals(hiddenFile.hidden, true);
  assertEquals(hiddenFile.name.startsWith("."), true);
});

describe("DirectoryNode interface", () => {
  it("should have required type literal 'directory'", () => {
    const dirNode: DirectoryNode = {
      type: "directory",
      name: "src",
      path: "/project/src",
      hidden: false,
      expanded: false,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };
    expect(dirNode.type).toBe("directory");
  });

  it("should enforce all required properties", () => {
    const dirNode: DirectoryNode = {
      type: "directory",
      name: "models",
      path: "/project/src/models",
      hidden: false,
      expanded: true,
      children: [],
      childCount: 0,
      mtime: new Date("2025-01-01"),
    };

    expect(dirNode.name).toBe("models");
    expect(dirNode.path).toBe("/project/src/models");
    expect(dirNode.hidden).toBe(false);
    expect(dirNode.expanded).toBe(true);
    expect(Array.isArray(dirNode.children)).toBe(true);
    expect(dirNode.childCount).toBe(0);
    expect(dirNode.mtime).toBeInstanceOf(Date);
  });

  it("should support children array", () => {
    const childFile: FileNode = {
      type: "file",
      name: "test.ts",
      path: "/project/src/test.ts",
      hidden: false,
      fileType: "ts",
      size: 512,
      mtime: new Date(),
    };

    const dirNode: DirectoryNode = {
      type: "directory",
      name: "src",
      path: "/project/src",
      hidden: false,
      expanded: true,
      children: [childFile],
      childCount: 1,
      mtime: new Date(),
    };

    expect(dirNode.children.length).toBe(1);
    expect(dirNode.childCount).toBe(1);
  });
});

describe("TreeNode discriminated union", () => {
  it("should accept FileNode", () => {
    const node: TreeNode = {
      type: "file",
      name: "test.ts",
      path: "/test.ts",
      hidden: false,
      fileType: "ts",
      size: 100,
      mtime: new Date(),
    };
    expect(node.type).toBe("file");
  });

  it("should accept DirectoryNode", () => {
    const node: TreeNode = {
      type: "directory",
      name: "src",
      path: "/src",
      hidden: false,
      expanded: false,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };
    expect(node.type).toBe("directory");
  });

  it("should allow type discrimination", () => {
    const fileNode: TreeNode = {
      type: "file",
      name: "test.ts",
      path: "/test.ts",
      hidden: false,
      fileType: "ts",
      size: 100,
      mtime: new Date(),
    };

    const dirNode: TreeNode = {
      type: "directory",
      name: "src",
      path: "/src",
      hidden: false,
      expanded: false,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    // Type guards should work
    expect(fileNode.type === "file").toBe(true);
    expect(dirNode.type === "directory").toBe(true);
  });
});

describe("TreeState interface", () => {
  it("should enforce all required properties", () => {
    const rootNode: DirectoryNode = {
      type: "directory",
      name: "project",
      path: "/home/user/project",
      hidden: false,
      expanded: true,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const state: TreeState = {
      rootPath: "/home/user/project",
      rootNode: rootNode,
      cursorLine: 0,
      showHidden: false,
      searchQuery: "",
      bufnr: 1,
    };

    expect(state.rootPath).toBe("/home/user/project");
    expect(state.rootNode.type).toBe("directory");
    expect(state.cursorLine).toBe(0);
    expect(state.showHidden).toBe(false);
    expect(state.searchQuery).toBe("");
    expect(state.bufnr).toBe(1);
  });

  it("should support search query", () => {
    const rootNode: DirectoryNode = {
      type: "directory",
      name: "root",
      path: "/root",
      hidden: false,
      expanded: false,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const state: TreeState = {
      rootPath: "/root",
      rootNode: rootNode,
      cursorLine: 5,
      showHidden: true,
      searchQuery: "test",
      bufnr: 2,
    };

    expect(state.searchQuery).toBe("test");
    expect(state.showHidden).toBe(true);
  });
});

describe("FileOperation interface", () => {
  it("should support create operation", () => {
    const op: FileOperation = {
      type: "create",
      source: "/path/to/new/file.ts",
      isDirectory: false,
      timestamp: new Date(),
    };

    expect(op.type).toBe("create");
    expect(op.source).toBe("/path/to/new/file.ts");
    expect(op.isDirectory).toBe(false);
  });

  it("should support delete operation", () => {
    const op: FileOperation = {
      type: "delete",
      source: "/path/to/file.ts",
      isDirectory: false,
      timestamp: new Date(),
    };

    expect(op.type).toBe("delete");
  });

  it("should support rename operation with destination", () => {
    const op: FileOperation = {
      type: "rename",
      source: "/old/path.ts",
      destination: "/new/path.ts",
      isDirectory: false,
      timestamp: new Date(),
    };

    expect(op.type).toBe("rename");
    expect(op.destination).toBe("/new/path.ts");
  });

  it("should support copy operation", () => {
    const op: FileOperation = {
      type: "copy",
      source: "/source.ts",
      destination: "/dest.ts",
      isDirectory: false,
      timestamp: new Date(),
    };

    expect(op.type).toBe("copy");
  });

  it("should support move operation", () => {
    const op: FileOperation = {
      type: "move",
      source: "/from/file.ts",
      destination: "/to/file.ts",
      isDirectory: true,
      timestamp: new Date(),
    };

    expect(op.type).toBe("move");
    expect(op.isDirectory).toBe(true);
  });
});

describe("SearchQuery interface", () => {
  it("should enforce all required properties", () => {
    const query: SearchQuery = {
      text: "test",
      matchedPaths: new Set(["/path/test.ts", "/other/test.md"]),
      lastUpdate: new Date(),
    };

    expect(query.text).toBe("test");
    expect(query.matchedPaths).toBeInstanceOf(Set);
    expect(query.matchedPaths.size).toBe(2);
    expect(query.lastUpdate).toBeInstanceOf(Date);
  });

  it("should support empty search", () => {
    const query: SearchQuery = {
      text: "",
      matchedPaths: new Set(),
      lastUpdate: new Date(),
    };

    expect(query.text).toBe("");
    expect(query.matchedPaths.size).toBe(0);
  });

  it("should support Set operations on matchedPaths", () => {
    const query: SearchQuery = {
      text: "search",
      matchedPaths: new Set<string>(),
      lastUpdate: new Date(),
    };

    query.matchedPaths.add("/path1");
    query.matchedPaths.add("/path2");

    expect(query.matchedPaths.has("/path1")).toBe(true);
    expect(query.matchedPaths.has("/path2")).toBe(true);
    expect(query.matchedPaths.size).toBe(2);
  });
});
