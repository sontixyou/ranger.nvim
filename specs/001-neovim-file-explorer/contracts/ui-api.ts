/**
 * UI Rendering API Contract
 *
 * Defines Neovim buffer/window operations for tree display.
 * All functions must execute synchronously via denops.
 *
 * Corresponds to Functional Requirements:
 * - FR-001, FR-002, FR-003, FR-004: Tree rendering
 * - FR-026, FR-027, FR-028: User feedback
 */

import { Denops } from "https://deno.land/x/denops_std@v6.0.0/mod.ts";
import { TreeNode, TreeState } from "./types.ts";

/**
 * Create and configure the tree explorer buffer.
 *
 * @param denops - Denops instance
 * @returns Buffer number of created tree buffer
 *
 * Buffer configuration:
 * - buftype=nofile
 * - bufhidden=hide
 * - swapfile=false
 * - modifiable=false
 */
export function createTreeBuffer(denops: Denops): number;

/**
 * Render tree nodes to a buffer.
 *
 * @param denops - Denops instance
 * @param bufnr - Buffer number to render to
 * @param nodes - Array of visible TreeNodes with depth information
 * @param cursorLine - Current cursor line (0-indexed)
 * @returns Number of lines rendered
 */
export function renderTreeToBuffer(
  denops: Denops,
  bufnr: number,
  nodes: Array<{ node: TreeNode; depth: number }>,
  cursorLine: number
): number;

/**
 * Format a tree node as a display line.
 *
 * @param node - TreeNode to format
 * @param depth - Indentation depth (0 = root)
 * @returns Formatted string for display
 *
 * Format: `{indent}{icon} {name}`
 * - indent: 2 spaces per depth level
 * - icon: 📁 for directories, 📄 for files
 */
export function formatNodeLine(node: TreeNode, depth: number): string;

/**
 * Set up buffer-local keybindings for tree navigation.
 *
 * @param denops - Denops instance
 * @param bufnr - Buffer number to set keybindings for
 * @param mappings - Map of key to command name
 *
 * Default mappings:
 * - <CR>: open
 * - <Tab>: expand
 * - a: create
 * - d: delete
 * - r: rename
 * - c: copy
 * - x: cut (move)
 * - p: paste
 * - H: toggle_hidden
 * - /: search
 * - s: system_open
 */
export function setupKeybindings(
  denops: Denops,
  bufnr: number,
  mappings: Record<string, string>
): void;

/**
 * Get the tree node at the current cursor line.
 *
 * @param denops - Denops instance
 * @param state - Current TreeState
 * @returns TreeNode at cursor line, or null if invalid line
 */
export function getNodeAtCursor(denops: Denops, state: TreeState): TreeNode | null;

/**
 * Update cursor position in tree buffer.
 *
 * @param denops - Denops instance
 * @param bufnr - Buffer number
 * @param line - Line number (1-indexed for Neovim)
 */
export function setCursor(denops: Denops, bufnr: number, line: number): void;

/**
 * Display a notification message to the user.
 *
 * @param denops - Denops instance
 * @param message - Message to display
 * @param level - Message level ("info" | "warn" | "error")
 */
export function notify(denops: Denops, message: string, level: "info" | "warn" | "error"): void;

/**
 * Prompt user for confirmation (for delete operations).
 *
 * @param denops - Denops instance
 * @param message - Prompt message
 * @returns true if user confirmed, false otherwise
 */
export function confirm(denops: Denops, message: string): boolean;

/**
 * Prompt user for text input (for create/rename operations).
 *
 * @param denops - Denops instance
 * @param prompt - Prompt message
 * @param defaultValue - Default value (optional)
 * @returns User input, or null if cancelled
 */
export function input(denops: Denops, prompt: string, defaultValue?: string): string | null;
