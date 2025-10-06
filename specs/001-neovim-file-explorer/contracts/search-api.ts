/**
 * Search API Contract
 *
 * Defines file/directory search functionality.
 * All functions must execute synchronously.
 *
 * Corresponds to Functional Requirements:
 * - FR-019: Search by name
 * - FR-020: Real-time search
 * - FR-021: Highlight/filter results
 * - FR-030: <100ms search latency
 */

import { TreeNode, DirectoryNode, SearchQuery } from "./types.ts";

/**
 * Create a search query from user input.
 *
 * @param text - Search text (case-insensitive substring match)
 * @returns SearchQuery with empty matchedPaths (call executeSearch to populate)
 */
export function createSearchQuery(text: string): SearchQuery;

/**
 * Execute a search query against a tree.
 *
 * @param query - SearchQuery to execute
 * @param root - Root DirectoryNode to search within
 * @returns Updated SearchQuery with matchedPaths populated
 *
 * Performance: MUST complete within 100ms for 1,000 nodes (FR-030)
 */
export function executeSearch(query: SearchQuery, root: DirectoryNode): SearchQuery;

/**
 * Check if a tree node matches a search query.
 *
 * @param node - TreeNode to check
 * @param query - SearchQuery to match against
 * @returns true if node name contains query text (case-insensitive)
 */
export function matchesQuery(node: TreeNode, query: SearchQuery): boolean;

/**
 * Filter visible nodes by search query.
 *
 * @param nodes - Array of visible TreeNodes with depth
 * @param query - SearchQuery to filter by
 * @returns Filtered array containing only matching nodes
 */
export function filterNodesByQuery(
  nodes: Array<{ node: TreeNode; depth: number }>,
  query: SearchQuery
): Array<{ node: TreeNode; depth: number }>;

/**
 * Clear a search query.
 *
 * @param query - SearchQuery to clear
 * @returns New SearchQuery with empty text and matchedPaths
 */
export function clearSearchQuery(query: SearchQuery): SearchQuery;
