/**
 * Tree Navigation API Contract
 *
 * Defines tree building, navigation, and display operations.
 * All functions must execute synchronously.
 *
 * Corresponds to Functional Requirements:
 * - FR-001, FR-002, FR-003, FR-004: Tree display
 * - FR-005, FR-006: Expand/collapse
 * - FR-007: Navigation
 * - FR-008: Open files
 */

import { TreeNode, DirectoryNode, TreeState } from "./types.ts";

/**
 * Build a tree structure from a root directory path.
 *
 * @param rootPath - Absolute path to root directory
 * @param showHidden - Whether to include hidden files/directories
 * @returns Root DirectoryNode with immediate children loaded
 * @throws Error if rootPath doesn't exist
 * @throws Error if rootPath is not a directory
 * @throws Error if insufficient permissions to read directory
 */
export function buildTree(rootPath: string, showHidden: boolean): DirectoryNode;

/**
 * Load children for a directory node.
 *
 * @param node - DirectoryNode to load children for
 * @param showHidden - Whether to include hidden files/directories
 * @returns Updated DirectoryNode with children loaded and sorted
 * @throws Error if node.path doesn't exist
 * @throws Error if insufficient permissions
 */
export function loadChildren(node: DirectoryNode, showHidden: boolean): DirectoryNode;

/**
 * Expand a directory node (load children if not loaded, set expanded=true).
 *
 * @param node - DirectoryNode to expand
 * @param showHidden - Whether to include hidden files/directories
 * @returns Updated DirectoryNode with expanded=true and children loaded
 * @throws Error if node.path doesn't exist
 */
export function expandNode(node: DirectoryNode, showHidden: boolean): DirectoryNode;

/**
 * Collapse a directory node (set expanded=false, keep children).
 *
 * @param node - DirectoryNode to collapse
 * @returns Updated DirectoryNode with expanded=false
 */
export function collapseNode(node: DirectoryNode): DirectoryNode;

/**
 * Toggle expansion state of a directory node.
 *
 * @param node - DirectoryNode to toggle
 * @param showHidden - Whether to include hidden files/directories
 * @returns Updated DirectoryNode with toggled expanded state
 * @throws Error if node.path doesn't exist
 */
export function toggleNode(node: DirectoryNode, showHidden: boolean): DirectoryNode;

/**
 * Find a tree node by path within a tree.
 *
 * @param root - Root DirectoryNode to search from
 * @param path - Absolute path to find
 * @returns TreeNode if found, null otherwise
 */
export function findNodeByPath(root: DirectoryNode, path: string): TreeNode | null;

/**
 * Get all visible tree nodes in depth-first order (for rendering).
 *
 * @param root - Root DirectoryNode
 * @param showHidden - Whether to include hidden files/directories
 * @returns Array of visible TreeNodes with depth information
 */
export function getVisibleNodes(root: DirectoryNode, showHidden: boolean): Array<{
  node: TreeNode;
  depth: number;
}>;

/**
 * Sort tree nodes (directories first, then alphabetically).
 *
 * @param nodes - Array of TreeNodes to sort
 * @returns Sorted array (directories before files, alphabetical)
 */
export function sortNodes(nodes: TreeNode[]): TreeNode[];

/**
 * Refresh a tree node (reload from file system).
 *
 * @param node - TreeNode to refresh
 * @param showHidden - Whether to include hidden files/directories
 * @returns Updated TreeNode with current file system state
 * @throws Error if node.path doesn't exist
 */
export function refreshNode(node: TreeNode, showHidden: boolean): TreeNode;
