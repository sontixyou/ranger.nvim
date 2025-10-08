/**
 * Shared Type Definitions
 *
 * Core data structures used across all API contracts.
 * Based on data-model.md.
 */

/**
 * Represents a file in the file system.
 */
export interface FileNode {
  type: "file";
  name: string;           // File name (e.g., "README.md")
  path: string;           // Absolute path
  hidden: boolean;        // Whether file is hidden (starts with ".")
  fileType: string;       // File extension or type (e.g., "md", "ts", "")
  size: number;           // File size in bytes
  mtime: Date;            // Last modified timestamp
}

/**
 * Represents a directory in the file system.
 */
export interface DirectoryNode {
  type: "directory";
  name: string;           // Directory name (e.g., "src")
  path: string;           // Absolute path
  hidden: boolean;        // Whether directory is hidden (starts with ".")
  expanded: boolean;      // Whether directory is expanded in tree
  children: TreeNode[];   // Child files and directories
  childCount: number;     // Total number of children
  mtime: Date;            // Last modified timestamp
}

/**
 * Discriminated union type representing any node in the tree.
 */
export type TreeNode = FileNode | DirectoryNode;

/**
 * Represents the current state of the file explorer tree UI.
 */
export interface TreeState {
  rootPath: string;           // Root directory path
  rootNode: DirectoryNode;    // Root directory node
  cursorLine: number;         // Current cursor line (0-indexed)
  showHidden: boolean;        // Whether hidden files are visible
  searchQuery: string;        // Current search query (empty if no search)
  bufnr: number;              // Neovim buffer number for tree display
}

/**
 * Represents a file system operation.
 */
export interface FileOperation {
  type: "create" | "delete" | "rename" | "copy" | "move";
  source: string;         // Source path (absolute)
  destination?: string;   // Destination path (absolute, for copy/move/rename)
  isDirectory: boolean;   // Whether operation targets a directory
  timestamp: Date;        // When operation was initiated
}

/**
 * Represents a search filter for files and directories.
 */
export interface SearchQuery {
  text: string;                  // Search text (case-insensitive substring match)
  matchedPaths: Set<string>;     // Paths that match the query
  lastUpdate: Date;              // When query was last updated
}
