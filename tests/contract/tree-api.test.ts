/**
 * Contract test for tree-api.ts
 * Tests tree building and navigation function signatures
 *
 * EXPECTED: These tests will FAIL until src/services/tree-builder.ts is implemented (T025)
 */

import { describe, it, expect, beforeEach, afterEach } from "npm:vitest@^1.0.0";
import type { DirectoryNode, TreeNode } from "../../src/models/types.ts";
import {
  buildTree,
  loadChildren,
  expandNode,
  collapseNode,
  toggleNode,
  findNodeByPath,
  getVisibleNodes,
  sortNodes,
  refreshNode,
  updateNodeInTree,
} from "../../src/services/tree-builder.ts";

const TEST_DIR = "/tmp/ranger-test-tree";

beforeEach(async () => {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore
  }
  await Deno.mkdir(TEST_DIR, { recursive: true });
  await Deno.writeTextFile(`${TEST_DIR}/file.txt`, "content");
  await Deno.mkdir(`${TEST_DIR}/subdir`);
  await Deno.writeTextFile(`${TEST_DIR}/subdir/nested.txt`, "nested");
});

afterEach(async () => {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore
  }
});

describe("buildTree", () => {
  it("should return DirectoryNode", () => {
    const tree = buildTree(TEST_DIR, false);
    expect(tree.type).toBe("directory");
    expect(tree.path).toBe(TEST_DIR);
  });

  it("should respect showHidden parameter", () => {
    const treeHidden = buildTree(TEST_DIR, true);
    const treeNoHidden = buildTree(TEST_DIR, false);
    expect(treeHidden).toBeDefined();
    expect(treeNoHidden).toBeDefined();
  });

  it("should throw error if path doesn't exist", () => {
    expect(() => buildTree("/nonexistent/path", false)).toThrow();
  });

  it("should throw error if path is not a directory", () => {
    expect(() => buildTree(`${TEST_DIR}/file.txt`, false)).toThrow();
  });
});

describe("loadChildren", () => {
  it("should return DirectoryNode with children loaded", () => {
    const node: DirectoryNode = {
      type: "directory",
      name: "test",
      path: TEST_DIR,
      hidden: false,
      expanded: false,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const loaded = loadChildren(node, false);
    expect(loaded.type).toBe("directory");
    expect(loaded.children.length).toBeGreaterThan(0);
    expect(loaded.childCount).toBe(loaded.children.length);
  });

  it("should filter hidden files when showHidden is false", () => {
    const node: DirectoryNode = {
      type: "directory",
      name: "test",
      path: TEST_DIR,
      hidden: false,
      expanded: false,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const loaded = loadChildren(node, false);
    const hasHidden = loaded.children.some((child) => child.hidden);
    // Depends on if TEST_DIR has hidden files
    expect(hasHidden).toBe(false);
  });
});

describe("expandNode", () => {
  it("should return DirectoryNode with expanded=true", () => {
    const node: DirectoryNode = {
      type: "directory",
      name: "test",
      path: TEST_DIR,
      hidden: false,
      expanded: false,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const expanded = expandNode(node, false);
    expect(expanded.expanded).toBe(true);
    expect(expanded.children.length).toBeGreaterThan(0);
  });

  it("should load children if not already loaded", () => {
    const node: DirectoryNode = {
      type: "directory",
      name: "test",
      path: TEST_DIR,
      hidden: false,
      expanded: false,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const expanded = expandNode(node, false);
    expect(expanded.childCount).toBeGreaterThan(0);
  });
});

describe("collapseNode", () => {
  it("should return DirectoryNode with expanded=false", () => {
    const node: DirectoryNode = {
      type: "directory",
      name: "test",
      path: TEST_DIR,
      hidden: false,
      expanded: true,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const collapsed = collapseNode(node);
    expect(collapsed.expanded).toBe(false);
  });

  it("should keep children loaded", () => {
    const child: TreeNode = {
      type: "file",
      name: "test.txt",
      path: `${TEST_DIR}/test.txt`,
      hidden: false,
      fileType: "txt",
      size: 100,
      mtime: new Date(),
    };

    const node: DirectoryNode = {
      type: "directory",
      name: "test",
      path: TEST_DIR,
      hidden: false,
      expanded: true,
      children: [child],
      childCount: 1,
      mtime: new Date(),
    };

    const collapsed = collapseNode(node);
    expect(collapsed.children.length).toBe(1);
  });
});

describe("toggleNode", () => {
  it("should toggle from collapsed to expanded", () => {
    const node: DirectoryNode = {
      type: "directory",
      name: "test",
      path: TEST_DIR,
      hidden: false,
      expanded: false,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const toggled = toggleNode(node, false);
    expect(toggled.expanded).toBe(true);
  });

  it("should toggle from expanded to collapsed", () => {
    const node: DirectoryNode = {
      type: "directory",
      name: "test",
      path: TEST_DIR,
      hidden: false,
      expanded: true,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const toggled = toggleNode(node, false);
    expect(toggled.expanded).toBe(false);
  });
});

describe("findNodeByPath", () => {
  it("should return TreeNode if found", () => {
    const root = buildTree(TEST_DIR, false);
    const found = findNodeByPath(root, TEST_DIR);
    expect(found).not.toBeNull();
    expect(found?.path).toBe(TEST_DIR);
  });

  it("should return null if not found", () => {
    const root = buildTree(TEST_DIR, false);
    const found = findNodeByPath(root, "/nonexistent/path");
    expect(found).toBeNull();
  });
});

describe("getVisibleNodes", () => {
  it("should return array of nodes with depth", () => {
    const root = buildTree(TEST_DIR, false);
    const visible = getVisibleNodes(root, false);
    expect(Array.isArray(visible)).toBe(true);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible[0]).toHaveProperty("node");
    expect(visible[0]).toHaveProperty("depth");
  });

  it("should respect showHidden parameter", () => {
    const root = buildTree(TEST_DIR, false);
    const visibleWithHidden = getVisibleNodes(root, true);
    const visibleWithoutHidden = getVisibleNodes(root, false);
    expect(visibleWithHidden.length).toBeGreaterThanOrEqual(visibleWithoutHidden.length);
  });

  it("should only show children of expanded nodes", () => {
    const root = buildTree(TEST_DIR, false);
    const visible = getVisibleNodes(root, false);
    // If root is not expanded, should only show root
    if (!root.expanded) {
      expect(visible.length).toBe(1);
    }
  });
});

describe("sortNodes", () => {
  it("should return sorted array", () => {
    const nodes: TreeNode[] = [
      {
        type: "file",
        name: "z-file.txt",
        path: "/z-file.txt",
        hidden: false,
        fileType: "txt",
        size: 100,
        mtime: new Date(),
      },
      {
        type: "directory",
        name: "a-dir",
        path: "/a-dir",
        hidden: false,
        expanded: false,
        children: [],
        childCount: 0,
        mtime: new Date(),
      },
      {
        type: "file",
        name: "a-file.txt",
        path: "/a-file.txt",
        hidden: false,
        fileType: "txt",
        size: 100,
        mtime: new Date(),
      },
    ];

    const sorted = sortNodes(nodes);
    expect(sorted[0].type).toBe("directory"); // Directories first
    expect(sorted[0].name).toBe("a-dir");
    expect(sorted[1].name).toBe("a-file.txt"); // Then files alphabetically
    expect(sorted[2].name).toBe("z-file.txt");
  });
});

describe("refreshNode", () => {
  it("should return updated TreeNode", () => {
    const node: TreeNode = {
      type: "file",
      name: "file.txt",
      path: `${TEST_DIR}/file.txt`,
      hidden: false,
      fileType: "txt",
      size: 100,
      mtime: new Date(),
    };

    const refreshed = refreshNode(node, false);
    expect(refreshed.path).toBe(node.path);
    expect(refreshed.type).toBe(node.type);
  });

  it("should throw error if node path doesn't exist", () => {
    const node: TreeNode = {
      type: "file",
      name: "missing.txt",
      path: "/nonexistent/missing.txt",
      hidden: false,
      fileType: "txt",
      size: 100,
      mtime: new Date(),
    };

    expect(() => refreshNode(node, false)).toThrow();
  });
});

describe("updateNodeInTree", () => {
  it("should update root node", () => {
    const root = buildTree(TEST_DIR, false);
    const updated = updateNodeInTree(root, TEST_DIR, (node) => ({
      ...node,
      name: "updated-root",
    }));
    expect(updated.name).toBe("updated-root");
    expect(updated.path).toBe(TEST_DIR);
  });

  it("should update child node", () => {
    const root = buildTree(TEST_DIR, false);
    const childPath = `${TEST_DIR}/file.txt`;
    const updated = updateNodeInTree(root, childPath, (node) => ({
      ...node,
      name: "updated-file.txt",
    }));

    // Find the updated child
    const child = updated.children.find((c) => c.path === childPath);
    expect(child?.name).toBe("updated-file.txt");
  });

  it("should update nested node when parent is expanded", () => {
    // Create a tree with expanded subdirectory
    const root = buildTree(TEST_DIR, false);
    const subdirPath = `${TEST_DIR}/subdir`;

    // First expand the subdirectory
    const expandedRoot = updateNodeInTree(root, subdirPath, (node) =>
      expandNode(node as DirectoryNode, false)
    );

    // Now update a nested file
    const nestedPath = `${TEST_DIR}/subdir/nested.txt`;
    const updated = updateNodeInTree(expandedRoot, nestedPath, (node) => ({
      ...node,
      name: "updated-nested.txt",
    }));

    // Find the subdir and check if nested file is updated
    const subdir = updated.children.find(
      (c) => c.path === subdirPath,
    ) as DirectoryNode;
    expect(subdir).toBeDefined();
    expect(subdir.expanded).toBe(true);

    const nestedFile = subdir.children.find((c) => c.path === nestedPath);
    expect(nestedFile?.name).toBe("updated-nested.txt");
  });

  it("should return original tree if path not found", () => {
    const root = buildTree(TEST_DIR, false);
    const updated = updateNodeInTree(root, "/nonexistent/path", (node) => ({
      ...node,
      name: "should-not-update",
    }));

    // Tree should remain unchanged
    expect(updated).toEqual(root);
  });

  it("should maintain immutability", () => {
    const root = buildTree(TEST_DIR, false);
    const childPath = `${TEST_DIR}/file.txt`;
    const updated = updateNodeInTree(root, childPath, (node) => ({
      ...node,
      name: "updated-file.txt",
    }));

    // Original root should not be modified
    expect(root).not.toBe(updated);
    const originalChild = root.children.find((c) => c.path === childPath);
    expect(originalChild?.name).toBe("file.txt");

    // Updated root should have the change
    const updatedChild = updated.children.find((c) => c.path === childPath);
    expect(updatedChild?.name).toBe("updated-file.txt");
  });

  it("should work with toggleNode to expand/collapse directories", () => {
    const root = buildTree(TEST_DIR, false);
    const subdirPath = `${TEST_DIR}/subdir`;

    // Initially collapsed
    const subdir = root.children.find((c) => c.path === subdirPath) as DirectoryNode;
    expect(subdir?.expanded).toBe(false);

    // Toggle to expand
    const expanded = updateNodeInTree(root, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );
    const expandedSubdir = expanded.children.find(
      (c) => c.path === subdirPath,
    ) as DirectoryNode;
    expect(expandedSubdir.expanded).toBe(true);
    expect(expandedSubdir.children.length).toBeGreaterThan(0);

    // Toggle to collapse
    const collapsed = updateNodeInTree(expanded, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );
    const collapsedSubdir = collapsed.children.find(
      (c) => c.path === subdirPath,
    ) as DirectoryNode;
    expect(collapsedSubdir.expanded).toBe(false);
    expect(collapsedSubdir.children.length).toBeGreaterThan(0); // Children still loaded
  });
});
