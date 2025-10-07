/**
 * User Interaction UI Service
 *
 * Functions for user input, keybindings, and feedback in Neovim.
 * All operations use denops async APIs (standard denops pattern).
 *
 * Functional Requirements:
 * - FR-026, FR-027, FR-028: User feedback and input
 */

import type { Denops } from "https://deno.land/x/denops_std@v6.0.0/mod.ts";
import type { TreeState, TreeNode } from "../models/types.ts";
import { getVisibleNodes } from "../services/tree-builder.ts";

/**
 * Set up buffer-local keybindings for tree navigation.
 *
 * Creates buffer-local key mappings that call denops dispatcher commands.
 *
 * @param denops - Denops instance
 * @param bufnr - Buffer number to set keybindings for
 * @param mappings - Map of key to command name
 */
export async function setupKeybindings(
  denops: Denops,
  bufnr: number,
  mappings: Record<string, string>,
): Promise<void> {
  // Set up each keybinding as a buffer-local mapping
  for (const [key, command] of Object.entries(mappings)) {
    const rhs = `<Cmd>call denops#notify('ranger', '${command}', [])<CR>`;
    await denops.call("nvim_buf_set_keymap", bufnr, "n", key, rhs, {
      noremap: true,
      silent: true,
      nowait: true,
    });
  }
}

/**
 * Get the tree node at the current cursor line.
 *
 * Calculates which node corresponds to the current cursor position.
 *
 * @param denops - Denops instance
 * @param state - Current TreeState
 * @returns TreeNode at cursor line, or null if invalid line
 */
export async function getNodeAtCursor(
  denops: Denops,
  state: TreeState,
): Promise<TreeNode | null> {
  // Get current cursor position (1-indexed line number)
  const cursor = (await denops.call("nvim_win_get_cursor", 0)) as [
    number,
    number,
  ];
  const cursorLine = cursor[0] - 1; // Convert to 0-indexed

  // Get visible nodes
  const visibleNodes = getVisibleNodes(state.rootNode, state.showHidden);

  // Check if cursor line is within bounds
  if (cursorLine < 0 || cursorLine >= visibleNodes.length) {
    return null;
  }

  return visibleNodes[cursorLine].node;
}

/**
 * Update cursor position in tree buffer.
 *
 * Moves the cursor to a specific line in the buffer.
 *
 * @param denops - Denops instance
 * @param bufnr - Buffer number
 * @param line - Line number (1-indexed for Neovim)
 */
export async function setCursor(
  denops: Denops,
  bufnr: number,
  line: number,
): Promise<void> {
  // Get window ID for buffer
  const windows = (await denops.call(
    "nvim_list_wins",
  )) as number[];

  for (const winid of windows) {
    const winBufnr = (await denops.call("nvim_win_get_buf", winid)) as number;
    if (winBufnr === bufnr) {
      // Set cursor in this window
      await denops.call("nvim_win_set_cursor", winid, [line, 0]);
      break;
    }
  }
}

/**
 * Display a notification message to the user.
 *
 * Shows a message in Neovim's command line with appropriate highlighting.
 *
 * @param denops - Denops instance
 * @param message - Message to display
 * @param level - Message level ("info" | "warn" | "error")
 */
export async function notify(
  denops: Denops,
  message: string,
  level: "info" | "warn" | "error",
): Promise<void> {
  // Map level to Neovim highlight group
  const hlgroup = level === "error"
    ? "ErrorMsg"
    : level === "warn"
    ? "WarningMsg"
    : "None";

  // Display message with appropriate highlighting
  if (hlgroup === "None") {
    await denops.cmd(`echo '${message.replace(/'/g, "''")}'`);
  } else {
    await denops.cmd(`echohl ${hlgroup} | echo '${message.replace(/'/g, "''")}' | echohl None`);
  }
}

/**
 * Prompt user for confirmation (for delete operations).
 *
 * Displays a yes/no prompt and waits for user response.
 *
 * @param denops - Denops instance
 * @param message - Prompt message
 * @returns true if user confirmed, false otherwise
 */
export async function confirm(
  denops: Denops,
  message: string,
): Promise<boolean> {
  // Use Neovim's confirm() function
  const result = (await denops.call(
    "confirm",
    message,
    "&Yes\n&No",
    2, // Default to No
  )) as number;

  // Result is 1 for Yes, 2 for No
  return result === 1;
}

/**
 * Prompt user for text input (for create/rename operations).
 *
 * Displays an input prompt and waits for user to enter text.
 *
 * @param denops - Denops instance
 * @param prompt - Prompt message
 * @param defaultValue - Default value (optional)
 * @returns User input, or null if cancelled
 */
export async function input(
  denops: Denops,
  prompt: string,
  defaultValue?: string,
): Promise<string | null> {
  try {
    // Use Neovim's input() function
    const result = (await denops.call(
      "input",
      prompt,
      defaultValue || "",
    )) as string;

    // Empty string or cancelled (Ctrl-C)
    if (result === "") {
      return null;
    }

    return result;
  } catch (_error) {
    // User cancelled (Ctrl-C)
    return null;
  }
}
