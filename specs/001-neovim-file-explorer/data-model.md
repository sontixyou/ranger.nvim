# Data Model: Neovim File Explorer Tree

**Feature**: 001-neovim-file-explorer
**Date**: 2025-10-06
**Phase**: 1 - Design & Contracts

## Overview
This document defines the core data structures and their relationships for the file explorer tree plugin. All entities represent in-memory state; no persistent storage is required (file system is the source of truth).

---

## Core Entities

### 1. FileNode

Represents a file in the file system.

**Properties**:
```typescript
interface FileNode {
  type: "file";
  name: string;           // File name (e.g., "README.md")
  path: string;           // Absolute path (e.g., "/home/user/project/README.md")
  hidden: boolean;        // Whether file is hidden (starts with ".")
  fileType: string;       // File extension or type (e.g., "md", "ts", "")
  size: number;           // File size in bytes
  mtime: Date;            // Last modified timestamp
}
```

**Validation Rules**:
- `name` MUST NOT be empty
- `path` MUST be absolute
- `hidden` MUST be `true` if `name` starts with "."
- `fileType` is derived from file extension (empty string if no extension)
- `size` MUST be >= 0
- `mtime` MUST be a valid Date

**State Transitions**: None (immutable after creation)

**Derivation**: Created from `Deno.DirEntry` and `Deno.FileInfo`

---

### 2. DirectoryNode

Represents a directory in the file system.

**Properties**:
```typescript
interface DirectoryNode {
  type: "directory";
  name: string;           // Directory name (e.g., "src")
  path: string;           // Absolute path (e.g., "/home/user/project/src")
  hidden: boolean;        // Whether directory is hidden (starts with ".")
  expanded: boolean;      // Whether directory is expanded in tree
  children: TreeNode[];   // Child files and directories
  childCount: number;     // Total number of children (for display)
  mtime: Date;            // Last modified timestamp
}
```

**Validation Rules**:
- `name` MUST NOT be empty (except root "/" which may have empty name)
- `path` MUST be absolute
- `hidden` MUST be `true` if `name` starts with "."
- `expanded` defaults to `false` for new directories
- `children` MUST be sorted (directories first, then files, alphabetically)
- `childCount` MUST equal `children.length`
- `mtime` MUST be a valid Date

**State Transitions**:
```
collapsed (expanded=false) <---> expanded (expanded=true)
   |                                 |
   | user expands                    | user collapses
   |                                 |
   +-> children loaded               +-> children remain loaded
```

**Derivation**: Created from `Deno.DirEntry` and `Deno.FileInfo`

---

### 3. TreeNode

Discriminated union type representing any node in the tree.

**Definition**:
```typescript
type TreeNode = FileNode | DirectoryNode;
```

**Type Discrimination**:
```typescript
function isDirectory(node: TreeNode): node is DirectoryNode {
  return node.type === "directory";
}

function isFile(node: TreeNode): node is FileNode {
  return node.type === "file";
}
```

**Usage**: Enables tree traversal and operations on heterogeneous collections

---

### 4. TreeState

Represents the current state of the file explorer tree UI.

**Properties**:
```typescript
interface TreeState {
  rootPath: string;           // Root directory path
  rootNode: DirectoryNode;    // Root directory node
  cursorLine: number;         // Current cursor line (0-indexed)
  showHidden: boolean;        // Whether hidden files are visible
  searchQuery: string;        // Current search query (empty if no search)
  bufnr: number;              // Neovim buffer number for tree display
}
```

**Validation Rules**:
- `rootPath` MUST be absolute and exist
- `rootNode.path` MUST equal `rootPath`
- `cursorLine` MUST be >= 0 and < total visible lines
- `searchQuery` may be empty (no active search)
- `bufnr` MUST be a valid Neovim buffer number

**State Transitions**:
```
Initial State:
  rootPath = cwd, rootNode loaded, cursorLine = 0,
  showHidden = false, searchQuery = ""

User toggles hidden files:
  showHidden = !showHidden, tree rebuilt

User enters search:
  searchQuery = user input, tree filtered

User clears search:
  searchQuery = "", tree restored

User navigates:
  cursorLine updated
```

---

### 5. FileOperation

Represents a pending or completed file system operation.

**Properties**:
```typescript
interface FileOperation {
  type: "create" | "delete" | "rename" | "copy" | "move";
  source: string;         // Source path (absolute)
  destination?: string;   // Destination path (absolute, required for copy/move/rename)
  isDirectory: boolean;   // Whether operation targets a directory
  timestamp: Date;        // When operation was initiated
}
```

**Validation Rules**:
- `type` MUST be one of the five operation types
- `source` MUST be absolute and exist (except for "create")
- `destination` MUST be absolute for "rename", "copy", "move"
- `destination` MUST NOT equal `source`
- For "delete" on directories: confirmation required if non-empty
- For "create": `source` is the path to create, MUST NOT already exist
- `isDirectory` MUST match whether `source` is a directory
- `timestamp` MUST be a valid Date

**Constraints**:
- **Create**: Fail if `source` already exists (FR-009a)
- **Delete (directory)**: Prompt for confirmation if non-empty, then recursive delete (FR-012a)
- **Rename/Copy/Move**: Fail if `destination` already exists

**State**: Operations are executed immediately (synchronous), no pending state

---

### 6. SearchQuery

Represents a search filter for files and directories.

**Properties**:
```typescript
interface SearchQuery {
  text: string;           // Search text (case-insensitive substring match)
  matchedPaths: Set<string>; // Paths that match the query
  lastUpdate: Date;       // When query was last updated (for debouncing display)
}
```

**Validation Rules**:
- `text` may be empty (matches all)
- `matchedPaths` contains absolute paths
- `lastUpdate` MUST be a valid Date

**Matching Logic**:
```typescript
function matches(query: SearchQuery, node: TreeNode): boolean {
  if (query.text === "") return true;
  return node.name.toLowerCase().includes(query.text.toLowerCase());
}
```

**Performance**: Linear scan of tree nodes, filtered during rendering

---

## Entity Relationships

### Tree Hierarchy
```
TreeState
  └── rootNode: DirectoryNode
       └── children: TreeNode[]
            ├── DirectoryNode
            │    └── children: TreeNode[]
            └── FileNode
```

### Operation Flow
```
User Action
  → FileOperation created
  → Deno.*Sync API called
  → TreeState updated
  → Buffer re-rendered
```

### Search Flow
```
User Input
  → SearchQuery updated
  → matchedPaths computed
  → TreeState filtered
  → Buffer re-rendered (highlighted matches)
```

---

## Data Derivation

### From File System to TreeNode
```typescript
function createTreeNode(entry: Deno.DirEntry, basePath: string): TreeNode {
  const fullPath = `${basePath}/${entry.name}`;
  const stat = Deno.statSync(fullPath);
  const hidden = entry.name.startsWith(".");

  if (entry.isDirectory) {
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
  } else {
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
}
```

### From TreeNode to Buffer Line
```typescript
interface BufferLine {
  text: string;           // Rendered line text
  node: TreeNode;         // Associated tree node
  depth: number;          // Indentation depth
}

function nodeToBufferLine(node: TreeNode, depth: number): BufferLine {
  const indent = "  ".repeat(depth);
  const icon = node.type === "directory" ? "📁" : "📄";
  const text = `${indent}${icon} ${node.name}`;
  return { text, node, depth };
}
```

---

## Sorting and Filtering

### Sort Order
```typescript
function compareNodes(a: TreeNode, b: TreeNode): number {
  // Directories before files
  if (a.type !== b.type) {
    return a.type === "directory" ? -1 : 1;
  }
  // Alphabetical by name (case-insensitive)
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}
```

### Visibility Filter
```typescript
function isVisible(node: TreeNode, showHidden: boolean): boolean {
  return showHidden || !node.hidden;
}
```

### Search Filter
```typescript
function matchesSearch(node: TreeNode, query: SearchQuery): boolean {
  if (query.text === "") return true;
  return node.name.toLowerCase().includes(query.text.toLowerCase());
}
```

---

## Performance Considerations

### Memory Footprint
- Each TreeNode: ~100-200 bytes
- 1,000 files: ~100-200 KB total
- Acceptable for in-memory tree representation

### Lazy Loading Strategy
Not implemented in MVP. All directory children loaded on expansion.

**Future Optimization** (if needed):
- Load only visible nodes (viewport-based rendering)
- Paginate large directories (>1,000 files)

### Search Performance
- Linear scan: O(n) where n = total visible nodes
- For 1,000 nodes: <10ms typical
- Meets <100ms requirement (FR-030)

---

## Validation Summary

| Entity | Required Validations | Constitutional Compliance |
|--------|---------------------|---------------------------|
| FileNode | Non-empty name, absolute path, valid size/mtime | Synchronous creation ✓ |
| DirectoryNode | Non-empty name, absolute path, sorted children | Synchronous loading ✓ |
| TreeNode | Type discrimination | N/A |
| TreeState | Valid buffer, cursor bounds | Synchronous updates ✓ |
| FileOperation | Path validation, existence checks | Synchronous execution ✓ |
| SearchQuery | N/A (text can be empty) | Synchronous filtering ✓ |

All entities support synchronous creation and manipulation as required by constitution.

---

**Phase 1 (Data Model) Status**: ✓ COMPLETE
**Next Step**: Generate contracts/
