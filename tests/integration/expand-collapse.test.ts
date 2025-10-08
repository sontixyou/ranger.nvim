/**
 * Integration test: Expand/collapse directory
 * Corresponds to quickstart steps 2 and 16
 */

import { describe, it, expect, beforeEach, afterEach } from "npm:vitest@^1.0.0";
import type { DirectoryNode } from "../../src/models/types.ts";
import {
  buildTree,
  getVisibleNodes,
  toggleNode,
  updateNodeInTree,
} from "../../src/services/tree-builder.ts";

const TEST_DIR = "/tmp/ranger-test-expand-collapse";

beforeEach(async () => {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore
  }
  await Deno.mkdir(TEST_DIR, { recursive: true });
  await Deno.writeTextFile(`${TEST_DIR}/file1.txt`, "content1");
  await Deno.writeTextFile(`${TEST_DIR}/file2.txt`, "content2");
  await Deno.mkdir(`${TEST_DIR}/subdir`);
  await Deno.writeTextFile(`${TEST_DIR}/subdir/nested1.txt`, "nested1");
  await Deno.writeTextFile(`${TEST_DIR}/subdir/nested2.txt`, "nested2");
  await Deno.mkdir(`${TEST_DIR}/subdir/deep`);
  await Deno.writeTextFile(`${TEST_DIR}/subdir/deep/deep-file.txt`, "deep");
});

afterEach(async () => {
  try {
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch {
    // Ignore
  }
});

describe("Expand/collapse directory", () => {
  it("should expand directory to show children", () => {
    // Build initial tree (collapsed)
    const root = buildTree(TEST_DIR, false);
    const subdirPath = `${TEST_DIR}/subdir`;

    // Find subdir before expansion
    const subdir = root.children.find((c) => c.path === subdirPath) as DirectoryNode;
    expect(subdir).toBeDefined();
    expect(subdir.expanded).toBe(false);

    // Expand the subdirectory
    const expanded = updateNodeInTree(root, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );

    // Verify expansion
    const expandedSubdir = expanded.children.find(
      (c) => c.path === subdirPath,
    ) as DirectoryNode;
    expect(expandedSubdir.expanded).toBe(true);
    expect(expandedSubdir.children.length).toBeGreaterThan(0);

    // Should have nested1.txt, nested2.txt, and deep directory
    expect(expandedSubdir.childCount).toBe(3);
  });

  it("should show children with proper indentation", () => {
    const root = buildTree(TEST_DIR, false);
    const subdirPath = `${TEST_DIR}/subdir`;

    // Expand subdirectory
    const expanded = updateNodeInTree(root, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );

    // Get visible nodes with depth
    const visible = getVisibleNodes(expanded, false);

    // Find subdir and its children
    const subdirIndex = visible.findIndex((v) => v.node.path === subdirPath);
    expect(subdirIndex).toBeGreaterThan(-1);

    const subdirDepth = visible[subdirIndex].depth;

    // Children should have depth = subdirDepth + 1
    const childrenAfterSubdir = visible.slice(subdirIndex + 1);
    const subdirChildren = childrenAfterSubdir.filter(
      (v) => v.node.path.startsWith(`${subdirPath}/`) && v.depth === subdirDepth + 1
    );

    expect(subdirChildren.length).toBeGreaterThan(0);
    subdirChildren.forEach((child) => {
      expect(child.depth).toBe(subdirDepth + 1);
    });
  });

  it("should collapse directory to hide children", () => {
    const root = buildTree(TEST_DIR, false);
    const subdirPath = `${TEST_DIR}/subdir`;

    // First expand
    const expanded = updateNodeInTree(root, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );

    const expandedSubdir = expanded.children.find(
      (c) => c.path === subdirPath,
    ) as DirectoryNode;
    expect(expandedSubdir.expanded).toBe(true);

    // Get visible nodes before collapse
    const visibleExpanded = getVisibleNodes(expanded, false);
    const expandedCount = visibleExpanded.length;

    // Now collapse
    const collapsed = updateNodeInTree(expanded, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );

    const collapsedSubdir = collapsed.children.find(
      (c) => c.path === subdirPath,
    ) as DirectoryNode;
    expect(collapsedSubdir.expanded).toBe(false);

    // Get visible nodes after collapse
    const visibleCollapsed = getVisibleNodes(collapsed, false);
    const collapsedCount = visibleCollapsed.length;

    // Should have fewer visible nodes after collapse
    expect(collapsedCount).toBeLessThan(expandedCount);

    // None of the visible nodes should be children of subdir
    const hasSubdirChildren = visibleCollapsed.some(
      (v) => v.node.path.startsWith(`${subdirPath}/`)
    );
    expect(hasSubdirChildren).toBe(false);
  });

  it("should keep children loaded after collapse", () => {
    const root = buildTree(TEST_DIR, false);
    const subdirPath = `${TEST_DIR}/subdir`;

    // Expand
    const expanded = updateNodeInTree(root, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );

    const expandedSubdir = expanded.children.find(
      (c) => c.path === subdirPath,
    ) as DirectoryNode;
    const childrenCount = expandedSubdir.children.length;
    expect(childrenCount).toBeGreaterThan(0);

    // Collapse
    const collapsed = updateNodeInTree(expanded, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );

    const collapsedSubdir = collapsed.children.find(
      (c) => c.path === subdirPath,
    ) as DirectoryNode;

    // Children should still be loaded
    expect(collapsedSubdir.children.length).toBe(childrenCount);
    expect(collapsedSubdir.childCount).toBe(childrenCount);
  });

  it("should expand nested directories", () => {
    const root = buildTree(TEST_DIR, false);
    const subdirPath = `${TEST_DIR}/subdir`;
    const deepPath = `${TEST_DIR}/subdir/deep`;

    // Expand subdir first
    let tree = updateNodeInTree(root, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );

    // Now expand deep directory
    tree = updateNodeInTree(tree, deepPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );

    // Get visible nodes
    const visible = getVisibleNodes(tree, false);

    // Should see: root, files, subdir, subdir/files, subdir/deep, subdir/deep/files
    const deepFileNode = visible.find(
      (v) => v.node.path === `${deepPath}/deep-file.txt`
    );
    expect(deepFileNode).toBeDefined();

    // Verify depth levels
    const rootDepth = visible.find((v) => v.node.path === TEST_DIR)?.depth;
    const subdirDepth = visible.find((v) => v.node.path === subdirPath)?.depth;
    const deepDepth = visible.find((v) => v.node.path === deepPath)?.depth;
    const deepFileDepth = deepFileNode?.depth;

    expect(rootDepth).toBe(0);
    expect(subdirDepth).toBe(1);
    expect(deepDepth).toBe(2);
    expect(deepFileDepth).toBe(3);
  });

  it("should toggle directory multiple times", () => {
    const root = buildTree(TEST_DIR, false);
    const subdirPath = `${TEST_DIR}/subdir`;

    // First toggle: expand
    let tree = updateNodeInTree(root, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );
    let subdir = tree.children.find((c) => c.path === subdirPath) as DirectoryNode;
    expect(subdir.expanded).toBe(true);

    // Second toggle: collapse
    tree = updateNodeInTree(tree, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );
    subdir = tree.children.find((c) => c.path === subdirPath) as DirectoryNode;
    expect(subdir.expanded).toBe(false);

    // Third toggle: expand again
    tree = updateNodeInTree(tree, subdirPath, (node) =>
      toggleNode(node as DirectoryNode, false)
    );
    subdir = tree.children.find((c) => c.path === subdirPath) as DirectoryNode;
    expect(subdir.expanded).toBe(true);

    // Children should still be there
    expect(subdir.children.length).toBeGreaterThan(0);
  });
});
