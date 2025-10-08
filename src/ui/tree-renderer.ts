/**
 * Tree Renderer UI Service
 *
 * Functions for rendering the file tree to Neovim buffers.
 * All operations use denops synchronous APIs.
 *
 * Functional Requirements:
 * - FR-001, FR-002, FR-003, FR-004: Tree rendering
 */

import type { Denops } from "https://deno.land/x/denops_std@v6.0.0/mod.ts";
import type { TreeNode } from "../models/types.ts";

/**
 * Render tree nodes to a buffer.
 *
 * Clears the buffer and writes all visible tree nodes.
 * Updates cursor position after rendering.
 *
 * @param denops - Denops instance
 * @param bufnr - Buffer number to render to
 * @param nodes - Array of visible TreeNodes with depth information
 * @param cursorLine - Current cursor line (0-indexed)
 * @returns Promise<Number of lines rendered>
 *
 * Note: Uses async/await for denops API calls as per standard denops pattern.
 */
export async function renderTreeToBuffer(
  denops: Denops,
  bufnr: number,
  nodes: Array<{ node: TreeNode; depth: number }>,
  cursorLine: number,
): Promise<number> {
  // Format all nodes into display lines
  const lines = nodes.map(({ node, depth }) => formatNodeLine(node, depth));

  // Make buffer modifiable temporarily
  await denops.call("nvim_buf_set_option", bufnr, "modifiable", true);

  // Replace all buffer contents with new lines (0-indexed, replace all lines)
  await denops.call("nvim_buf_set_lines", bufnr, 0, -1, false, lines);

  // Set cursor position (convert 0-indexed to 1-indexed for Neovim)
  const nvimCursorLine = Math.min(cursorLine + 1, lines.length);
  await denops.call("nvim_win_set_cursor", 0, [nvimCursorLine, 0]);

  // Make buffer non-modifiable again
  await denops.call("nvim_buf_set_option", bufnr, "modifiable", false);

  return lines.length;
}

/**
 * Format a tree node as a display line.
 *
 * Creates a human-readable line with indentation, icon, and name.
 *
 * @param node - TreeNode to format
 * @param depth - Indentation depth (0 = root)
 * @returns Formatted string for display
 *
 * Format: `{indent}{icon} {name}`
 * - indent: 2 spaces per depth level
 * - icon: 📁 for expanded dirs, 📂 for collapsed dirs, 📄 for files
 */
export function formatNodeLine(node: TreeNode, depth: number): string {
  // Create indentation (2 spaces per level)
  const indent = "  ".repeat(depth);

  // Select icon based on node type
  let icon: string;
  if (node.type === "directory") {
    icon = node.expanded ? "📁" : "📂";
  } else {
    icon = "📄";
  }

  // Combine parts
  return `${indent}${icon} ${node.name}`;
}
