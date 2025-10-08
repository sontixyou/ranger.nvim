/**
 * TreeState Management Functions
 *
 * Functions for creating and updating the tree explorer state.
 * All state updates are immutable - they return new state objects.
 *
 * Constitutional requirement: All operations must be synchronous.
 */

import type { DirectoryNode, TreeState } from "./types.ts";

/**
 * Creates a new TreeState from a root directory node.
 *
 * Initializes state with default values:
 * - cursorLine: 0 (top of tree)
 * - showHidden: false (hidden files not shown initially)
 * - searchQuery: "" (no active search)
 *
 * @param rootPath - Absolute path to root directory
 * @param rootNode - Root directory node
 * @param bufnr - Neovim buffer number
 * @returns New TreeState initialized with defaults
 */
export function createTreeState(
  rootPath: string,
  rootNode: DirectoryNode,
  bufnr: number,
): TreeState {
  return {
    rootPath,
    rootNode,
    cursorLine: 0,
    showHidden: false,
    searchQuery: "",
    bufnr,
  };
}

/**
 * Updates the cursor line in the tree state.
 *
 * Immutable update - returns a new TreeState object.
 *
 * @param state - Current tree state
 * @param cursorLine - New cursor line (0-indexed)
 * @returns New TreeState with updated cursor line
 */
export function updateCursorLine(state: TreeState, cursorLine: number): TreeState {
  return {
    ...state,
    cursorLine,
  };
}

/**
 * Updates the show hidden files setting.
 *
 * Immutable update - returns a new TreeState object.
 *
 * @param state - Current tree state
 * @param showHidden - Whether to show hidden files
 * @returns New TreeState with updated showHidden setting
 */
export function updateShowHidden(state: TreeState, showHidden: boolean): TreeState {
  return {
    ...state,
    showHidden,
  };
}

/**
 * Toggles the show hidden files setting.
 *
 * Convenience function that flips the current showHidden value.
 *
 * @param state - Current tree state
 * @returns New TreeState with toggled showHidden setting
 */
export function toggleShowHidden(state: TreeState): TreeState {
  return updateShowHidden(state, !state.showHidden);
}

/**
 * Updates the search query in the tree state.
 *
 * Immutable update - returns a new TreeState object.
 *
 * @param state - Current tree state
 * @param searchQuery - New search query text
 * @returns New TreeState with updated search query
 */
export function updateSearchQuery(state: TreeState, searchQuery: string): TreeState {
  return {
    ...state,
    searchQuery,
  };
}

/**
 * Clears the search query.
 *
 * Convenience function that sets searchQuery to empty string.
 *
 * @param state - Current tree state
 * @returns New TreeState with cleared search query
 */
export function clearSearch(state: TreeState): TreeState {
  return updateSearchQuery(state, "");
}

/**
 * Updates the root node in the tree state.
 *
 * Used when the tree structure changes (expand, collapse, refresh, etc.).
 * Immutable update - returns a new TreeState object.
 *
 * @param state - Current tree state
 * @param rootNode - New root directory node
 * @returns New TreeState with updated root node
 */
export function updateRootNode(state: TreeState, rootNode: DirectoryNode): TreeState {
  return {
    ...state,
    rootNode,
  };
}

/**
 * Updates multiple state properties at once.
 *
 * Allows efficient batch updates of state.
 * Only updates properties that are provided.
 *
 * @param state - Current tree state
 * @param updates - Partial TreeState with properties to update
 * @returns New TreeState with updated properties
 */
export function updateState(
  state: TreeState,
  updates: Partial<Omit<TreeState, "rootPath" | "bufnr">>,
): TreeState {
  return {
    ...state,
    ...updates,
  };
}

/**
 * Validates that a TreeState is internally consistent.
 *
 * Checks:
 * - rootPath matches rootNode.path
 * - cursorLine is non-negative
 * - bufnr is positive
 *
 * @param state - Tree state to validate
 * @returns true if state is valid
 * @throws Error if state is invalid
 */
export function validateTreeState(state: TreeState): boolean {
  if (state.rootPath !== state.rootNode.path) {
    throw new Error(
      `TreeState validation failed: rootPath (${state.rootPath}) does not match rootNode.path (${state.rootNode.path})`,
    );
  }

  if (state.cursorLine < 0) {
    throw new Error(
      `TreeState validation failed: cursorLine (${state.cursorLine}) must be non-negative`,
    );
  }

  if (state.bufnr <= 0) {
    throw new Error(
      `TreeState validation failed: bufnr (${state.bufnr}) must be positive`,
    );
  }

  return true;
}

/**
 * Creates a deep copy of a TreeState.
 *
 * Note: DirectoryNode children are not deeply copied (shallow copy of children array).
 * This is intentional for performance - tree nodes are treated as immutable.
 *
 * @param state - Tree state to copy
 * @returns New TreeState with same values
 */
export function cloneTreeState(state: TreeState): TreeState {
  return {
    ...state,
    rootNode: { ...state.rootNode },
  };
}
