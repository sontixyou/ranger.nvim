/**
 * Search Service
 *
 * Real-time, interactive file/directory search functionality.
 * All operations are synchronous and optimized for <100ms performance.
 *
 * Functional Requirements:
 * - FR-019: Search by name
 * - FR-020: Real-time search
 * - FR-021: Highlight/filter results
 * - FR-030: <100ms search latency for 1,000 nodes
 */

import type { SearchQuery, TreeNode, DirectoryNode } from "../models/types.ts";

/**
 * Create a search query from user input.
 *
 * Initializes with empty matchedPaths set.
 * Call executeSearch() to populate matches.
 *
 * @param text - Search text (case-insensitive substring match)
 * @returns SearchQuery with empty matchedPaths
 */
export function createSearchQuery(text: string): SearchQuery {
  return {
    text,
    matchedPaths: new Set<string>(),
    lastUpdate: new Date(),
  };
}

/**
 * Execute a search query against a tree.
 *
 * Performs linear scan of all nodes in the tree.
 * Optimized for performance (<100ms for 1,000 nodes).
 *
 * @param query - SearchQuery to execute
 * @param root - Root DirectoryNode to search within
 * @returns Updated SearchQuery with matchedPaths populated
 */
export function executeSearch(
  query: SearchQuery,
  root: DirectoryNode,
): SearchQuery {
  const matchedPaths = new Set<string>();

  // Helper function to recursively search tree
  function searchNode(node: TreeNode) {
    // Check if this node matches
    if (matchesQuery(node, query)) {
      matchedPaths.add(node.path);
    }

    // Recursively search children if directory
    if (node.type === "directory") {
      for (const child of node.children) {
        searchNode(child);
      }
    }
  }

  // Search from root
  searchNode(root);

  return {
    ...query,
    matchedPaths,
    lastUpdate: new Date(),
  };
}

/**
 * Check if a tree node matches a search query.
 *
 * Performs case-insensitive substring match on node name.
 * Empty query matches all nodes.
 *
 * @param node - TreeNode to check
 * @param query - SearchQuery to match against
 * @returns true if node name contains query text (case-insensitive)
 */
export function matchesQuery(node: TreeNode, query: SearchQuery): boolean {
  // Empty query matches everything
  if (query.text === "") {
    return true;
  }

  // Case-insensitive substring match
  return node.name.toLowerCase().includes(query.text.toLowerCase());
}

/**
 * Filter visible nodes by search query.
 *
 * Returns only nodes that match the search query.
 * Preserves depth information for rendering.
 *
 * @param nodes - Array of visible TreeNodes with depth
 * @param query - SearchQuery to filter by
 * @returns Filtered array containing only matching nodes
 */
export function filterNodesByQuery(
  nodes: Array<{ node: TreeNode; depth: number }>,
  query: SearchQuery,
): Array<{ node: TreeNode; depth: number }> {
  // Empty query returns all nodes
  if (query.text === "") {
    return nodes;
  }

  // Filter to only matching nodes
  return nodes.filter((item) => matchesQuery(item.node, query));
}

/**
 * Clear a search query.
 *
 * Resets text to empty string and clears matched paths.
 *
 * @param _query - SearchQuery to clear (unused, kept for API consistency)
 * @returns New SearchQuery with empty text and matchedPaths
 */
export function clearSearchQuery(_query: SearchQuery): SearchQuery {
  return {
    text: "",
    matchedPaths: new Set<string>(),
    lastUpdate: new Date(),
  };
}
