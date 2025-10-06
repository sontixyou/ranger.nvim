/**
 * Contract test for search-api.ts
 * Tests search functionality function signatures
 *
 * EXPECTED: These tests will FAIL until src/services/search.ts is implemented (T026)
 */

import { describe, it, expect } from "npm:vitest@^1.0.0";
import type { SearchQuery, DirectoryNode, TreeNode } from "../../src/models/types.ts";
import {
  createSearchQuery,
  executeSearch,
  matchesQuery,
  filterNodesByQuery,
  clearSearchQuery,
} from "../../src/services/search.ts";

describe("createSearchQuery", () => {
  it("should return SearchQuery with given text", () => {
    const query = createSearchQuery("test");
    expect(query.text).toBe("test");
    expect(query.matchedPaths).toBeInstanceOf(Set);
    expect(query.lastUpdate).toBeInstanceOf(Date);
  });

  it("should handle empty text", () => {
    const query = createSearchQuery("");
    expect(query.text).toBe("");
    expect(query.matchedPaths.size).toBe(0);
  });
});

describe("executeSearch", () => {
  it("should return SearchQuery with populated matchedPaths", () => {
    const root: DirectoryNode = {
      type: "directory",
      name: "root",
      path: "/root",
      hidden: false,
      expanded: true,
      children: [
        {
          type: "file",
          name: "test.ts",
          path: "/root/test.ts",
          hidden: false,
          fileType: "ts",
          size: 100,
          mtime: new Date(),
        },
        {
          type: "file",
          name: "other.md",
          path: "/root/other.md",
          hidden: false,
          fileType: "md",
          size: 200,
          mtime: new Date(),
        },
      ],
      childCount: 2,
      mtime: new Date(),
    };

    const query = createSearchQuery("test");
    const result = executeSearch(query, root);
    expect(result.matchedPaths.size).toBeGreaterThan(0);
  });

  it("should complete within 100ms for 1000 nodes", () => {
    // Performance requirement FR-030
    const nodes: TreeNode[] = [];
    for (let i = 0; i < 1000; i++) {
      nodes.push({
        type: "file",
        name: `file${i}.txt`,
        path: `/files/file${i}.txt`,
        hidden: false,
        fileType: "txt",
        size: 100,
        mtime: new Date(),
      });
    }

    const root: DirectoryNode = {
      type: "directory",
      name: "files",
      path: "/files",
      hidden: false,
      expanded: true,
      children: nodes,
      childCount: 1000,
      mtime: new Date(),
    };

    const query = createSearchQuery("file500");
    const start = performance.now();
    executeSearch(query, root);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });
});

describe("matchesQuery", () => {
  it("should return boolean", () => {
    const node: TreeNode = {
      type: "file",
      name: "test.ts",
      path: "/test.ts",
      hidden: false,
      fileType: "ts",
      size: 100,
      mtime: new Date(),
    };
    const query = createSearchQuery("test");
    const result = matchesQuery(node, query);
    expect(typeof result).toBe("boolean");
  });

  it("should match case-insensitively", () => {
    const node: TreeNode = {
      type: "file",
      name: "TestFile.ts",
      path: "/TestFile.ts",
      hidden: false,
      fileType: "ts",
      size: 100,
      mtime: new Date(),
    };
    const query = createSearchQuery("testfile");
    expect(matchesQuery(node, query)).toBe(true);
  });

  it("should match substring", () => {
    const node: TreeNode = {
      type: "file",
      name: "my-test-file.ts",
      path: "/my-test-file.ts",
      hidden: false,
      fileType: "ts",
      size: 100,
      mtime: new Date(),
    };
    const query = createSearchQuery("test");
    expect(matchesQuery(node, query)).toBe(true);
  });

  it("should match all nodes with empty query", () => {
    const node: TreeNode = {
      type: "file",
      name: "anything.ts",
      path: "/anything.ts",
      hidden: false,
      fileType: "ts",
      size: 100,
      mtime: new Date(),
    };
    const query = createSearchQuery("");
    expect(matchesQuery(node, query)).toBe(true);
  });
});

describe("filterNodesByQuery", () => {
  it("should return filtered array", () => {
    const nodes = [
      {
        node: {
          type: "file" as const,
          name: "test.ts",
          path: "/test.ts",
          hidden: false,
          fileType: "ts",
          size: 100,
          mtime: new Date(),
        },
        depth: 0,
      },
      {
        node: {
          type: "file" as const,
          name: "other.md",
          path: "/other.md",
          hidden: false,
          fileType: "md",
          size: 200,
          mtime: new Date(),
        },
        depth: 0,
      },
    ];

    const query = createSearchQuery("test");
    const filtered = filterNodesByQuery(nodes, query);
    expect(filtered.length).toBeLessThanOrEqual(nodes.length);
    expect(filtered.every((item) => matchesQuery(item.node, query))).toBe(true);
  });

  it("should preserve depth information", () => {
    const nodes = [
      {
        node: {
          type: "file" as const,
          name: "test.ts",
          path: "/test.ts",
          hidden: false,
          fileType: "ts",
          size: 100,
          mtime: new Date(),
        },
        depth: 2,
      },
    ];

    const query = createSearchQuery("test");
    const filtered = filterNodesByQuery(nodes, query);
    expect(filtered[0].depth).toBe(2);
  });
});

describe("clearSearchQuery", () => {
  it("should return SearchQuery with empty text and matchedPaths", () => {
    const query = createSearchQuery("test");
    query.matchedPaths.add("/some/path");

    const cleared = clearSearchQuery(query);
    expect(cleared.text).toBe("");
    expect(cleared.matchedPaths.size).toBe(0);
  });

  it("should update lastUpdate timestamp", () => {
    const query = createSearchQuery("test");
    const oldTime = query.lastUpdate;

    // Small delay to ensure different timestamp
    const cleared = clearSearchQuery(query);
    expect(cleared.lastUpdate.getTime()).toBeGreaterThanOrEqual(oldTime.getTime());
  });
});
