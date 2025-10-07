/**
 * Tree Builder Service
 *
 * Functions for building and manipulating the file tree structure.
 * All operations use Deno's *Sync APIs to maintain constitutional compliance.
 *
 * Functional Requirements:
 * - FR-001, FR-002, FR-003, FR-004: Tree display
 * - FR-005, FR-006: Expand/collapse
 * - FR-007: Navigation
 * - FR-029: Support up to 1,000 files
 */

import type { TreeNode, DirectoryNode } from "../models/types.ts";
import {
  createTreeNode,
  sortNodes,
  filterVisible,
} from "../models/tree-node.ts";

/**
 * Build a tree structure from a root directory path.
 *
 * Loads immediate children only (not recursive).
 * Children are sorted according to data-model.md spec.
 *
 * @param rootPath - Absolute path to root directory
 * @param showHidden - Whether to include hidden files/directories
 * @returns Root DirectoryNode with immediate children loaded
 * @throws Error if rootPath doesn't exist
 * @throws Error if rootPath is not a directory
 */
export function buildTree(rootPath: string, showHidden: boolean): DirectoryNode {
  // Verify path exists and is a directory
  const stat = Deno.statSync(rootPath);
  if (!stat.isDirectory) {
    throw new Error(`Path is not a directory: ${rootPath}`);
  }

  // Extract directory name from path
  const parts = rootPath.split("/");
  const name = parts[parts.length - 1] || rootPath;

  // Create root node
  const rootNode: DirectoryNode = {
    type: "directory",
    name,
    path: rootPath,
    hidden: name.startsWith("."),
    expanded: false,
    children: [],
    childCount: 0,
    mtime: stat.mtime || new Date(),
  };

  // Load children
  return loadChildren(rootNode, showHidden);
}

/**
 * Load children for a directory node.
 *
 * Reads directory contents using Deno.readDirSync and creates TreeNodes.
 * Children are filtered by visibility and sorted.
 *
 * @param node - DirectoryNode to load children for
 * @param showHidden - Whether to include hidden files/directories
 * @returns Updated DirectoryNode with children loaded and sorted
 * @throws Error if node.path doesn't exist
 */
export function loadChildren(
  node: DirectoryNode,
  showHidden: boolean,
): DirectoryNode {
  const children: TreeNode[] = [];

  // Read directory entries
  for (const entry of Deno.readDirSync(node.path)) {
    const childNode = createTreeNode(entry, node.path);
    children.push(childNode);
  }

  // Filter by visibility and sort
  const visibleChildren = filterVisible(children, showHidden);
  const sortedChildren = sortNodes(visibleChildren);

  return {
    ...node,
    children: sortedChildren,
    childCount: sortedChildren.length,
  };
}

/**
 * Expand a directory node.
 *
 * Loads children if not already loaded, then sets expanded=true.
 *
 * @param node - DirectoryNode to expand
 * @param showHidden - Whether to include hidden files/directories
 * @returns Updated DirectoryNode with expanded=true and children loaded
 */
export function expandNode(
  node: DirectoryNode,
  showHidden: boolean,
): DirectoryNode {
  // Load children if empty
  let updatedNode = node;
  if (node.children.length === 0) {
    updatedNode = loadChildren(node, showHidden);
  }

  return {
    ...updatedNode,
    expanded: true,
  };
}

/**
 * Collapse a directory node.
 *
 * Sets expanded=false but keeps children loaded.
 *
 * @param node - DirectoryNode to collapse
 * @returns Updated DirectoryNode with expanded=false
 */
export function collapseNode(node: DirectoryNode): DirectoryNode {
  return {
    ...node,
    expanded: false,
  };
}

/**
 * Toggle expansion state of a directory node.
 *
 * If collapsed, expands (and loads children if needed).
 * If expanded, collapses.
 *
 * @param node - DirectoryNode to toggle
 * @param showHidden - Whether to include hidden files/directories
 * @returns Updated DirectoryNode with toggled state
 */
export function toggleNode(
  node: DirectoryNode,
  showHidden: boolean,
): DirectoryNode {
  if (node.expanded) {
    return collapseNode(node);
  } else {
    return expandNode(node, showHidden);
  }
}

/**
 * Find a tree node by path within a tree.
 *
 * Performs depth-first search through the tree.
 *
 * @param root - Root DirectoryNode to search from
 * @param path - Absolute path to find
 * @returns TreeNode if found, null otherwise
 */
export function findNodeByPath(
  root: DirectoryNode,
  path: string,
): TreeNode | null {
  // Check if root matches
  if (root.path === path) {
    return root;
  }

  // Search children recursively
  for (const child of root.children) {
    if (child.path === path) {
      return child;
    }

    if (child.type === "directory" && child.expanded) {
      const found = findNodeByPath(child, path);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Get all visible tree nodes in depth-first order.
 *
 * Only includes nodes that are visible (parent is expanded).
 * Used for rendering the tree to a buffer.
 *
 * @param root - Root DirectoryNode
 * @param showHidden - Whether to include hidden files/directories
 * @returns Array of visible TreeNodes with depth information
 */
export function getVisibleNodes(
  root: DirectoryNode,
  showHidden: boolean,
): Array<{ node: TreeNode; depth: number }> {
  const result: Array<{ node: TreeNode; depth: number }> = [];

  function traverse(node: TreeNode, depth: number) {
    // Add current node
    result.push({ node, depth });

    // If directory and expanded, traverse children
    if (node.type === "directory" && node.expanded) {
      const visibleChildren = filterVisible(node.children, showHidden);
      for (const child of visibleChildren) {
        traverse(child, depth + 1);
      }
    }
  }

  traverse(root, 0);
  return result;
}

/**
 * Sort tree nodes according to specification.
 *
 * Re-exported from tree-node module for convenience.
 *
 * @param nodes - Array of TreeNodes to sort
 * @returns Sorted array (directories before files, alphabetical)
 */
export { sortNodes };

/**
 * Refresh a tree node by reloading from file system.
 *
 * If the node is a directory, reloads its children.
 * If the node is a file, updates its metadata.
 *
 * @param node - TreeNode to refresh
 * @param showHidden - Whether to include hidden files/directories
 * @returns Updated TreeNode with current file system state
 * @throws Error if node.path doesn't exist
 */
export function refreshNode(node: TreeNode, showHidden: boolean): TreeNode {
  const stat = Deno.statSync(node.path);

  if (node.type === "directory") {
    // Reload children if directory
    const updated: DirectoryNode = {
      ...node,
      mtime: stat.mtime || new Date(),
    };

    if (node.expanded) {
      return loadChildren(updated, showHidden);
    }

    return updated;
  } else {
    // Update file metadata
    return {
      ...node,
      size: stat.size,
      mtime: stat.mtime || new Date(),
    };
  }
}
