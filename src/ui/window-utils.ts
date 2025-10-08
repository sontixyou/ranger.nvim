/**
 * Window and Buffer Utility Functions
 *
 * Utilities for managing Neovim windows and buffers for sidebar functionality.
 * All operations use denops synchronous APIs.
 *
 * Constitutional requirement: All operations must be synchronous.
 */

import type { Denops } from "https://deno.land/x/denops_std@v6.0.0/mod.ts";

// Sidebar width constant - fixed at 30 columns, no customization
const SIDEBAR_WIDTH = 30;

/**
 * Check if a window ID is valid and still exists.
 *
 * @param denops - Denops instance
 * @param winid - Window ID to validate
 * @returns Promise<boolean> true if window is valid
 */
export async function isValidWin(denops: Denops, winid: number): Promise<boolean> {
  try {
    const result = await denops.call("nvim_win_is_valid", winid) as boolean;
    return result;
  } catch {
    return false;
  }
}

/**
 * Check if a buffer can be reused for the tree display.
 *
 * @param denops - Denops instance
 * @param bufnr - Buffer number to check
 * @returns Promise<boolean> true if buffer can be reused
 */
export async function isReusableTreeBuffer(denops: Denops, bufnr: number): Promise<boolean> {
  try {
    const exists = await denops.call("bufexists", bufnr) as number;
    if (!exists) return false;

    const listed = await denops.call("buflisted", bufnr) as number;
    if (listed) return false; // We want unlisted scratch buffers

    const buftype = await denops.call("nvim_buf_get_option", bufnr, "buftype") as string;
    return buftype === "nofile";
  } catch {
    return false;
  }
}

/**
 * Create and configure a new tree buffer.
 *
 * @param denops - Denops instance
 * @returns Promise<number> Buffer number of created tree buffer
 */
export async function createTreeBuffer(denops: Denops): Promise<number> {
  // Create a new unlisted buffer (scratch buffer)
  const bufnr = (await denops.call("nvim_create_buf", false, true)) as number;

  // Configure buffer options
  await denops.call("nvim_buf_set_option", bufnr, "bufhidden", "hide");
  await denops.call("nvim_buf_set_option", bufnr, "buftype", "nofile");
  await denops.call("nvim_buf_set_option", bufnr, "swapfile", false);
  await denops.call("nvim_buf_set_option", bufnr, "modifiable", false);

  return bufnr;
}

/**
 * Open a left sidebar window with fixed width.
 *
 * @param denops - Denops instance
 * @returns Promise<number> Window ID of created sidebar window
 */
export async function openSidebarWindow(denops: Denops): Promise<number> {
  // Create a left sidebar window with fixed width
  await denops.cmd(`topleft vertical ${SIDEBAR_WIDTH} new`);
  const winid = await denops.call("nvim_get_current_win") as number;

  return winid;
}

/**
 * Close the tree sidebar if it's open and restore focus.
 *
 * @param denops - Denops instance
 * @param winid - Window ID to close
 * @param prevWinid - Previous window ID to restore focus to
 */
export async function closeTreeSidebar(
  denops: Denops,
  winid: number,
  prevWinid?: number,
): Promise<void> {
  // Close the sidebar window
  try {
    await denops.call("nvim_win_close", winid, false);
  } catch {
    // Ignore errors if window is already closed
  }

  // Restore focus to previous window if it's still valid
  if (prevWinid && await isValidWin(denops, prevWinid)) {
    try {
      await denops.call("nvim_set_current_win", prevWinid);
    } catch {
      // Fallback to first available window if restore fails
      const windows = await denops.call("nvim_list_wins") as number[];
      if (windows.length > 0) {
        await denops.call("nvim_set_current_win", windows[0]);
      }
    }
  } else {
    // Fallback to first available window
    const windows = await denops.call("nvim_list_wins") as number[];
    if (windows.length > 0) {
      await denops.call("nvim_set_current_win", windows[0]);
    }
  }
}
