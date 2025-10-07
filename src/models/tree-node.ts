/**
 * TreeNode Utility Functions
 *
 * Helper functions for creating and manipulating tree nodes from file system entries.
 * Based on data-model.md specifications.
 *
 * Constitutional requirement: All operations must be synchronous.
 */

import type { TreeNode, FileNode, DirectoryNode } from "./types.ts";

/**
 * Creates a FileNode from a Deno.DirEntry and base path.
 *
 * Uses Deno.statSync to get file metadata synchronously.
 *
 * @param entry - Deno directory entry
 * @param basePath - Base directory path (absolute)
 * @returns FileNode with all properties populated
 */
export function createFileNode(entry: Deno.DirEntry, basePath: string): FileNode {
  const fullPath = `${basePath}/${entry.name}`;
  const stat = Deno.statSync(fullPath);
  const hidden = entry.name.startsWith(".");

  // Extract file extension
  const fileType = entry.name.includes(".")
    ? entry.name.split(".").pop() || ""
    : "";

  return {
    type: "file",
    name: entry.name,
    path: fullPath,
    hidden,
    fileType,
    size: stat.size,
    mtime: stat.mtime || new Date(),
  };
}

/**
 * Creates a DirectoryNode from a Deno.DirEntry and base path.
 *
 * Directory is created with expanded=false and empty children array.
 * Children must be loaded separately using tree-builder service.
 *
 * @param entry - Deno directory entry
 * @param basePath - Base directory path (absolute)
 * @returns DirectoryNode with empty children
 */
export function createDirectoryNode(
  entry: Deno.DirEntry,
  basePath: string,
): DirectoryNode {
  const fullPath = `${basePath}/${entry.name}`;
  const stat = Deno.statSync(fullPath);
  const hidden = entry.name.startsWith(".");

  return {
    type: "directory",
    name: entry.name,
    path: fullPath,
    hidden,
    expanded: false,
    children: [],
    childCount: 0,
    mtime: stat.mtime || new Date(),
  };
}

/**
 * Creates a TreeNode (FileNode or DirectoryNode) from a Deno.DirEntry.
 *
 * Automatically detects whether the entry is a file or directory
 * and creates the appropriate node type.
 *
 * @param entry - Deno directory entry
 * @param basePath - Base directory path (absolute)
 * @returns FileNode if entry is a file, DirectoryNode if entry is a directory
 */
export function createTreeNode(entry: Deno.DirEntry, basePath: string): TreeNode {
  if (entry.isDirectory) {
    return createDirectoryNode(entry, basePath);
  } else {
    return createFileNode(entry, basePath);
  }
}

/**
 * Compares two TreeNodes for sorting.
 *
 * Sort order (as per data-model.md):
 * 1. Directories come before files
 * 2. Within each type, sort alphabetically by name (case-insensitive)
 *
 * @param a - First tree node
 * @param b - Second tree node
 * @returns Negative if a < b, positive if a > b, 0 if equal
 */
export function compareNodes(a: TreeNode, b: TreeNode): number {
  // Directories before files
  if (a.type !== b.type) {
    return a.type === "directory" ? -1 : 1;
  }

  // Alphabetical by name (case-insensitive)
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}

/**
 * Sorts an array of TreeNodes in place.
 *
 * Uses compareNodes to determine sort order:
 * - Directories first
 * - Then alphabetically by name
 *
 * @param nodes - Array of tree nodes to sort
 * @returns The same array, sorted in place
 */
export function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.sort(compareNodes);
}

/**
 * Checks if a node should be visible based on hidden file settings.
 *
 * @param node - Tree node to check
 * @param showHidden - Whether to show hidden files
 * @returns true if node should be visible
 */
export function isVisible(node: TreeNode, showHidden: boolean): boolean {
  return showHidden || !node.hidden;
}

/**
 * Filters an array of nodes based on visibility settings.
 *
 * @param nodes - Array of nodes to filter
 * @param showHidden - Whether to show hidden files
 * @returns New array containing only visible nodes
 */
export function filterVisible(nodes: TreeNode[], showHidden: boolean): TreeNode[] {
  return nodes.filter((node) => isVisible(node, showHidden));
}
