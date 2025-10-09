/**
 * Core Type Definitions for Ranger File Explorer
 *
 * All data structures used across the file explorer plugin.
 * Based on data-model.md and contracts/types.ts.
 *
 * Constitutional requirement: All operations on these types must be synchronous.
 */

/**
 * Represents a file in the file system.
 *
 * Validation rules:
 * - name MUST NOT be empty
 * - path MUST be absolute
 * - hidden MUST be true if name starts with "."
 * - fileType is derived from file extension (empty string if no extension)
 * - size MUST be >= 0
 * - mtime MUST be a valid Date
 */
export interface FileNode {
  type: "file";
  name: string; // File name (e.g., "README.md")
  path: string; // Absolute path
  hidden: boolean; // Whether file is hidden (starts with ".")
  fileType: string; // File extension or type (e.g., "md", "ts", "")
  size: number; // File size in bytes
  mtime: Date; // Last modified timestamp
}

/**
 * Represents a directory in the file system.
 *
 * Validation rules:
 * - name MUST NOT be empty (except root "/" which may have empty name)
 * - path MUST be absolute
 * - hidden MUST be true if name starts with "."
 * - expanded defaults to false for new directories
 * - children MUST be sorted (directories first, then files, alphabetically)
 * - childCount MUST equal children.length
 * - mtime MUST be a valid Date
 */
export interface DirectoryNode {
  type: "directory";
  name: string; // Directory name (e.g., "src")
  path: string; // Absolute path
  hidden: boolean; // Whether directory is hidden (starts with ".")
  expanded: boolean; // Whether directory is expanded in tree
  children: TreeNode[]; // Child files and directories
  childCount: number; // Total number of children
  mtime: Date; // Last modified timestamp
}

/**
 * Discriminated union type representing any node in the tree.
 *
 * This allows type-safe handling of both files and directories
 * using TypeScript's discriminated union feature.
 */
export type TreeNode = FileNode | DirectoryNode;

/**
 * Represents the current state of the file explorer tree UI.
 *
 * This is the main state object that tracks the entire tree view state,
 * including the current tree, cursor position, search state, and display options.
 *
 * Validation rules:
 * - rootPath and rootNode.path must match
 * - cursorLine must be >= 0 and < total visible lines
 * - bufnr must be a valid Neovim buffer number
 */
export interface TreeState {
  rootPath: string; // Root directory path
  rootNode: DirectoryNode; // Root directory node
  cursorLine: number; // Current cursor line (0-indexed)
  showHidden: boolean; // Whether hidden files are visible
  searchQuery: string; // Current search query (empty if no search)
  bufnr: number; // Neovim buffer number for tree display
  winid?: number; // Window ID for sidebar (if open)
  prevWinid?: number; // Previous window ID for focus restoration
}

/**
 * Represents a file system operation.
 *
 * This tracks operations like create, delete, rename, copy, and move
 * for potential undo/redo or logging functionality.
 *
 * Validation rules:
 * - source MUST be absolute
 * - destination MUST be absolute for rename/copy/move
 * - destination MUST NOT equal source
 * - For delete on directories: confirmation required if non-empty (FR-012a)
 * - For create: source MUST NOT already exist (FR-009a)
 * - isDirectory MUST match whether source is a directory
 */
export interface FileOperation {
  type: "create" | "delete" | "rename" | "copy" | "move";
  source: string; // Source path (absolute)
  destination?: string; // Destination path (absolute, for copy/move/rename)
  isDirectory: boolean; // Whether operation targets a directory
  timestamp: Date; // When operation was initiated
}

/**
 * Represents a search filter for files and directories.
 *
 * Used for real-time, interactive search functionality.
 *
 * Performance requirement: Search must complete within 100ms for 1,000 nodes (FR-030)
 */
export interface SearchQuery {
  text: string; // Search text (case-insensitive substring match)
  matchedPaths: Set<string>; // Paths that match the query
  lastUpdate: Date; // When query was last updated
}

/**
 * Type guard to check if a TreeNode is a DirectoryNode.
 *
 * This enables type-safe narrowing in TypeScript:
 * ```typescript
 * if (isDirectory(node)) {
 *   // TypeScript knows node is DirectoryNode here
 *   console.log(node.children);
 * }
 * ```
 */
export function isDirectory(node: TreeNode): node is DirectoryNode {
  return node.type === "directory";
}

/**
 * Type guard to check if a TreeNode is a FileNode.
 *
 * This enables type-safe narrowing in TypeScript:
 * ```typescript
 * if (isFile(node)) {
 *   // TypeScript knows node is FileNode here
 *   console.log(node.size);
 * }
 * ```
 */
export function isFile(node: TreeNode): node is FileNode {
  return node.type === "file";
}
