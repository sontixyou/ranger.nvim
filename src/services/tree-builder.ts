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

import type { DirectoryNode, TreeNode } from "../models/types.ts";
import { createTreeNode, filterVisible, sortNodes } from "../models/tree-node.ts";

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

/**
 * Update a node in the tree by path.
 *
 * Creates a new tree with the specified node updated.
 * Maintains immutability by recreating the path from root to target node.
 *
 * @param root - Root DirectoryNode
 * @param targetPath - Path of node to update
 * @param updateFn - Function that transforms the node
 * @returns New tree with updated node, or original tree if path not found
 */
export function updateNodeInTree(
  root: DirectoryNode,
  targetPath: string,
  updateFn: (node: TreeNode) => TreeNode,
): DirectoryNode {
  // If root is the target, update and return
  if (root.path === targetPath) {
    return updateFn(root) as DirectoryNode;
  }

  // Recursively update children
  const updatedChildren = root.children.map((child) => {
    if (child.path === targetPath) {
      return updateFn(child);
    }

    if (child.type === "directory" && child.expanded) {
      return updateNodeInTree(child, targetPath, updateFn);
    }

    return child;
  });

  // Return new root with updated children
  return {
    ...root,
    children: updatedChildren,
  };
}

/**
 * Collect all expanded directory paths from a tree.
 *
 * Recursively traverses the tree and collects paths of all directories
 * that have expanded=true. Used to preserve expansion state when
 * rebuilding the tree.
 *
 * @param root - Root DirectoryNode to collect from
 * @returns Set of absolute paths for all expanded directories
 */
export function collectExpandedPaths(root: DirectoryNode): Set<string> {
  const expandedPaths = new Set<string>();

  function traverse(node: TreeNode) {
    if (node.type === "directory") {
      // Add this directory if it's expanded
      if (node.expanded) {
        expandedPaths.add(node.path);
      }

      // Recursively traverse children
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(root);
  return expandedPaths;
}

/**
 * Restore expansion state to a tree based on a set of expanded paths.
 *
 * Takes a freshly built tree and expands directories whose paths are
 * in the expandedPaths set. This preserves user's expansion state
 * across tree rebuilds (e.g., when toggling sidebar or refreshing).
 *
 * Constitutional requirement: Uses synchronous operations only.
 * Silently skips paths that no longer exist (e.g., deleted directories).
 *
 * @param root - Root DirectoryNode to restore expansion state to
 * @param expandedPaths - Set of paths that should be expanded
 * @param showHidden - Whether to include hidden files/directories
 * @returns New tree with expansion state restored
 */
export function restoreExpandedState(
  root: DirectoryNode,
  expandedPaths: Set<string>,
  showHidden: boolean,
): DirectoryNode {
  // If this directory should be expanded, expand it
  let updatedRoot = root;
  if (expandedPaths.has(root.path)) {
    updatedRoot = expandNode(root, showHidden);
  }

  // Recursively restore expansion state for children
  const updatedChildren = updatedRoot.children.map((child) => {
    if (child.type === "directory" && expandedPaths.has(child.path)) {
      return restoreExpandedState(child, expandedPaths, showHidden);
    }
    return child;
  });

  return {
    ...updatedRoot,
    children: updatedChildren,
  };
}

/**
 * Expand all parent directories from root to target file path.
 *
 * Takes a file path and expands all directories along the path from the root
 * to make the target file visible in the tree. This is useful for automatically
 * revealing a specific file when opening the tree.
 *
 * If the target path doesn't exist or is outside the root path, returns the
 * original tree unchanged.
 *
 * @param root - Root DirectoryNode to expand from
 * @param targetPath - Absolute path to the target file
 * @param showHidden - Whether to include hidden files/directories
 * @returns New tree with path to target expanded, or original tree if path not found
 */
export function expandPathToFile(
  root: DirectoryNode,
  targetPath: string,
  showHidden: boolean,
): DirectoryNode {
  // Check if target path is within root path
  if (!targetPath.startsWith(root.path)) {
    return root;
  }

  // Extract directory path components between root and target
  const relativePath = targetPath.slice(root.path.length + 1);
  const pathComponents = relativePath.split("/");

  // Build list of directory paths to expand (exclude the final file name)
  const dirsToExpand: string[] = [];
  let currentPath = root.path;
  for (let i = 0; i < pathComponents.length - 1; i++) {
    currentPath = `${currentPath}/${pathComponents[i]}`;
    dirsToExpand.push(currentPath);
  }

  // Expand each directory in sequence
  let updatedRoot = root;
  for (const dirPath of dirsToExpand) {
    updatedRoot = updateNodeInTree(
      updatedRoot,
      dirPath,
      (node) => {
        if (node.type === "directory") {
          return expandNode(node, showHidden);
        }
        return node;
      },
    );
  }

  return updatedRoot;
}

/**
 * Find the index of a node in the visible nodes array.
 *
 * Searches through the visible nodes array to find the index of a node
 * with the given path. Returns -1 if not found.
 *
 * @param visibleNodes - Array of visible nodes with depth information
 * @param targetPath - Path of the node to find
 * @returns Index in visible nodes array (0-indexed), or -1 if not found
 */
export function findNodeIndexInVisibleNodes(
  visibleNodes: Array<{ node: TreeNode; depth: number }>,
  targetPath: string,
): number {
  return visibleNodes.findIndex(({ node }) => node.path === targetPath);
}
