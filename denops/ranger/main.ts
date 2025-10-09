/**
 * Ranger File Explorer - Denops Main Entry Point
 *
 * This is the main entry point for the denops plugin.
 * It registers all commands and sets up the dispatcher.
 *
 * Functional Requirements: All FRs (FR-001 through FR-030)
 */

import type { Denops } from "https://deno.land/x/denops_std@v6.0.0/mod.ts";
import type { TreeState } from "../../src/models/types.ts";
import { updateState } from "../../src/models/tree-state.ts";
import {
  buildTree,
  getVisibleNodes,
  toggleNode,
  updateNodeInTree,
} from "../../src/services/tree-builder.ts";
import {
  createDirectory,
  createFile,
  deleteDirectory,
  deleteFile,
  rename,
} from "../../src/services/file-system.ts";
import { createSearchQuery, executeSearch } from "../../src/services/search.ts";
import { openWithSystemApp } from "../../src/services/system-app.ts";
import { renderTreeToBuffer } from "../../src/ui/tree-renderer.ts";
import {
  confirm,
  getNodeAtCursor,
  input,
  notify,
  setupKeybindings,
} from "../../src/ui/interaction.ts";
import {
  closeTreeSidebar,
  createTreeBuffer,
  isReusableTreeBuffer,
  isValidWin,
  openSidebarWindow,
} from "../../src/ui/window-utils.ts";

// Global state for the tree explorer
let globalState: TreeState | null = null;

/**
 * Main denops plugin entry point.
 *
 * This function is called when the plugin is loaded.
 * It sets up the dispatcher with all available commands.
 *
 * @param denops - Denops instance
 */
export async function main(denops: Denops): Promise<void> {
  // Register dispatcher commands
  denops.dispatcher = {
    /**
     * Open/toggle the tree explorer sidebar.
     *
     * Constitutional requirement: All operations execute synchronously.
     * This function implements toggle behavior:
     * - If sidebar is open, close it and restore focus
     * - If sidebar is closed, open it in left sidebar with fixed width 30
     * - Preserves existing buffers and does not replace current window
     */
    async openTree(): Promise<void> {
      try {
        // Check if tree sidebar is already open
        if (globalState?.winid && await isValidWin(denops, globalState.winid)) {
          // Close the sidebar and restore focus
          await closeTreeSidebar(denops, globalState.winid, globalState.prevWinid);

          // Clear window tracking but preserve bufnr for reuse
          globalState = {
            ...globalState,
            winid: undefined,
            prevWinid: undefined,
          };

          await notify(denops, "Closed tree sidebar", "info");
          return;
        }

        // Get current working directory
        const cwd = (await denops.call("getcwd")) as string;

        // Save current window for focus restoration
        const prevWinid = await denops.call("nvim_get_current_win") as number;

        // Open sidebar window
        const winid = await openSidebarWindow(denops);

        // Check if we can reuse existing buffer, otherwise create new one
        let bufnr = globalState?.bufnr;
        if (!bufnr || !await isReusableTreeBuffer(denops, bufnr)) {
          bufnr = await createTreeBuffer(denops);
        }

        // Set the buffer in the sidebar window
        await denops.call("nvim_set_current_buf", bufnr);

        // Build tree from current directory
        const rootNode = buildTree(cwd, globalState?.showHidden ?? false);

        // Update global state
        globalState = {
          rootPath: cwd,
          rootNode,
          cursorLine: globalState?.cursorLine ?? 0,
          showHidden: globalState?.showHidden ?? false,
          searchQuery: globalState?.searchQuery ?? "",
          bufnr,
          winid,
          prevWinid,
        };

        // Set up keybindings for the buffer
        await setupKeybindings(denops, bufnr, {
          "<CR>": "open",
          "<Tab>": "expandCollapse",
          "a": "createFile",
          "A": "createDirectory",
          "d": "deleteNode",
          "r": "renameNode",
          "c": "copyNode",
          "x": "cutNode",
          "p": "pasteNode",
          "H": "toggleHidden",
          "/": "search",
          "s": "systemOpen",
          "R": "refresh",
        });

        // Render tree
        const visibleNodes = getVisibleNodes(rootNode, globalState.showHidden);
        await renderTreeToBuffer(denops, bufnr, visibleNodes, globalState.cursorLine);

        await notify(denops, `Opened tree sidebar: ${cwd}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to toggle tree: ${message}`, "error");
      }
    },

    /**
     * Open file or expand/collapse directory at cursor.
     */
    async open(): Promise<void> {
      if (!globalState) return;

      try {
        const node = await getNodeAtCursor(denops, globalState);
        if (!node) return;

        if (node.type === "file") {
          // Open file in right buffer (not in sidebar)
          // First, try to use the previous window (the one active before opening sidebar)
          let targetWinid = globalState.prevWinid;

          // Check if prevWinid is still valid and not the sidebar itself
          if (!targetWinid || !await isValidWin(denops, targetWinid) || targetWinid === globalState.winid) {
            // Find a non-sidebar window to open the file in
            const windows = await denops.call("nvim_list_wins") as number[];
            for (const winid of windows) {
              if (winid !== globalState.winid) {
                targetWinid = winid;
                break;
              }
            }

            // If no other window exists, create one to the right of sidebar
            if (!targetWinid || targetWinid === globalState.winid) {
              // Move to sidebar window first
              await denops.call("nvim_set_current_win", globalState.winid);
              // Create a new window to the right
              await denops.cmd("rightbelow vertical split");
              targetWinid = await denops.call("nvim_get_current_win") as number;
            }
          }

          // Switch to target window and open file
          await denops.call("nvim_set_current_win", targetWinid);
          await denops.cmd(`edit ${node.path}`);
        } else {
          // Expand/collapse directory
          await denops.dispatcher.expandCollapse();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to open: ${message}`, "error");
      }
    },

    /**
     * Expand or collapse directory at cursor.
     */
    async expandCollapse(): Promise<void> {
      if (!globalState) return;

      try {
        const node = await getNodeAtCursor(denops, globalState);
        if (!node || node.type !== "directory") return;

        // Update the tree with toggled node state
        const rootNode = updateNodeInTree(
          globalState.rootNode,
          node.path,
          (n) => toggleNode(n as typeof node, globalState!.showHidden),
        );
        globalState = updateState(globalState, { rootNode });

        // Re-render
        const visibleNodes = getVisibleNodes(
          globalState.rootNode,
          globalState.showHidden,
        );
        await renderTreeToBuffer(
          denops,
          globalState.bufnr,
          visibleNodes,
          globalState.cursorLine,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to toggle: ${message}`, "error");
      }
    },

    /**
     * Create a new file.
     */
    async createFile(): Promise<void> {
      if (!globalState) return;

      try {
        const node = await getNodeAtCursor(denops, globalState);
        if (!node) return;

        // Determine parent directory
        const parentDir = node.type === "directory" ? node.path : globalState.rootPath;

        // Prompt for filename
        const filename = await input(denops, "New file name: ");
        if (!filename) return;

        // Create file
        const newPath = `${parentDir}/${filename}`;
        createFile(newPath);

        // Refresh tree
        const rootNode = buildTree(globalState.rootPath, globalState.showHidden);
        globalState = updateState(globalState, { rootNode });

        // Re-render
        const visibleNodes = getVisibleNodes(rootNode, globalState.showHidden);
        await renderTreeToBuffer(
          denops,
          globalState.bufnr,
          visibleNodes,
          globalState.cursorLine,
        );

        await notify(denops, `Created file: ${filename}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to create file: ${message}`, "error");
      }
    },

    /**
     * Create a new directory.
     */
    async createDirectory(): Promise<void> {
      if (!globalState) return;

      try {
        const node = await getNodeAtCursor(denops, globalState);
        if (!node) return;

        // Determine parent directory
        const parentDir = node.type === "directory" ? node.path : globalState.rootPath;

        // Prompt for directory name
        const dirname = await input(denops, "New directory name: ");
        if (!dirname) return;

        // Create directory
        const newPath = `${parentDir}/${dirname}`;
        createDirectory(newPath);

        // Refresh tree
        const rootNode = buildTree(globalState.rootPath, globalState.showHidden);
        globalState = updateState(globalState, { rootNode });

        // Re-render
        const visibleNodes = getVisibleNodes(rootNode, globalState.showHidden);
        await renderTreeToBuffer(
          denops,
          globalState.bufnr,
          visibleNodes,
          globalState.cursorLine,
        );

        await notify(denops, `Created directory: ${dirname}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to create directory: ${message}`, "error");
      }
    },

    /**
     * Delete file or directory at cursor.
     */
    async deleteNode(): Promise<void> {
      if (!globalState) return;

      try {
        const node = await getNodeAtCursor(denops, globalState);
        if (!node) return;

        // Confirm deletion
        const confirmed = await confirm(
          denops,
          `Delete ${node.type} "${node.name}"?`,
        );
        if (!confirmed) return;

        // Delete based on type
        if (node.type === "file") {
          deleteFile(node.path);
        } else {
          // Check if directory has children
          const hasChildren = node.children.length > 0;
          if (hasChildren) {
            const confirmRecursive = await confirm(
              denops,
              `Directory is not empty. Delete recursively?`,
            );
            if (!confirmRecursive) return;
          }
          deleteDirectory(node.path, hasChildren);
        }

        // Refresh tree
        const rootNode = buildTree(globalState.rootPath, globalState.showHidden);
        globalState = updateState(globalState, { rootNode });

        // Re-render
        const visibleNodes = getVisibleNodes(rootNode, globalState.showHidden);
        await renderTreeToBuffer(
          denops,
          globalState.bufnr,
          visibleNodes,
          globalState.cursorLine,
        );

        await notify(denops, `Deleted: ${node.name}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to delete: ${message}`, "error");
      }
    },

    /**
     * Rename file or directory at cursor.
     */
    async renameNode(): Promise<void> {
      if (!globalState) return;

      try {
        const node = await getNodeAtCursor(denops, globalState);
        if (!node) return;

        // Prompt for new name
        const newName = await input(denops, "New name: ", node.name);
        if (!newName || newName === node.name) return;

        // Calculate new path (same parent directory)
        const parentPath = node.path.substring(0, node.path.lastIndexOf("/"));
        const newPath = `${parentPath}/${newName}`;

        // Rename
        rename(node.path, newPath);

        // Refresh tree
        const rootNode = buildTree(globalState.rootPath, globalState.showHidden);
        globalState = updateState(globalState, { rootNode });

        // Re-render
        const visibleNodes = getVisibleNodes(rootNode, globalState.showHidden);
        await renderTreeToBuffer(
          denops,
          globalState.bufnr,
          visibleNodes,
          globalState.cursorLine,
        );

        await notify(denops, `Renamed to: ${newName}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to rename: ${message}`, "error");
      }
    },

    /**
     * Copy file or directory at cursor (not yet implemented - placeholder).
     */
    async copyNode(): Promise<void> {
      if (!globalState) return;

      try {
        const node = await getNodeAtCursor(denops, globalState);
        if (!node) return;

        // TODO: Implement clipboard functionality
        await notify(
          denops,
          `Copy not yet implemented. Use 'c' to mark, 'p' to paste.`,
          "warn",
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to copy: ${message}`, "error");
      }
    },

    /**
     * Cut (mark for move) file or directory at cursor (not yet implemented - placeholder).
     */
    async cutNode(): Promise<void> {
      if (!globalState) return;

      try {
        const node = await getNodeAtCursor(denops, globalState);
        if (!node) return;

        // TODO: Implement clipboard functionality
        await notify(
          denops,
          `Cut not yet implemented. Use 'x' to mark, 'p' to paste.`,
          "warn",
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to cut: ${message}`, "error");
      }
    },

    /**
     * Paste copied/cut file or directory (not yet implemented - placeholder).
     */
    async pasteNode(): Promise<void> {
      if (!globalState) return;

      try {
        // TODO: Implement clipboard functionality
        await notify(denops, `Paste not yet implemented.`, "warn");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to paste: ${message}`, "error");
      }
    },

    /**
     * Toggle hidden files visibility.
     */
    async toggleHidden(): Promise<void> {
      if (!globalState) return;

      try {
        // Toggle showHidden flag
        const showHidden = !globalState.showHidden;

        // Refresh tree with new visibility
        const rootNode = buildTree(globalState.rootPath, showHidden);
        globalState = updateState(globalState, { showHidden, rootNode });

        // Re-render
        const visibleNodes = getVisibleNodes(rootNode, showHidden);
        await renderTreeToBuffer(
          denops,
          globalState.bufnr,
          visibleNodes,
          globalState.cursorLine,
        );

        const status = globalState.showHidden ? "shown" : "hidden";
        await notify(denops, `Hidden files ${status}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to toggle hidden: ${message}`, "error");
      }
    },

    /**
     * Search for files/directories by name.
     */
    async search(): Promise<void> {
      if (!globalState) return;

      try {
        // Prompt for search query
        const searchText = await input(denops, "Search: ");
        if (searchText === null) return;

        if (searchText === "") {
          // Clear search
          globalState = { ...globalState, searchQuery: "" };
        } else {
          // Execute search
          const query = createSearchQuery(searchText);
          const results = executeSearch(query, globalState.rootNode);

          globalState = { ...globalState, searchQuery: searchText };

          await notify(
            denops,
            `Found ${results.matchedPaths.size} matches`,
            "info",
          );
        }

        // Re-render with search results
        const visibleNodes = getVisibleNodes(
          globalState.rootNode,
          globalState.showHidden,
        );
        await renderTreeToBuffer(
          denops,
          globalState.bufnr,
          visibleNodes,
          globalState.cursorLine,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to search: ${message}`, "error");
      }
    },

    /**
     * Open file at cursor with system default application.
     */
    async systemOpen(): Promise<void> {
      if (!globalState) return;

      try {
        const node = await getNodeAtCursor(denops, globalState);
        if (!node) return;

        if (node.type === "directory") {
          await notify(denops, "Cannot open directory with system app", "warn");
          return;
        }

        // Open with system app
        openWithSystemApp(node.path);

        await notify(denops, `Opened ${node.name} with system app`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to open with system app: ${message}`, "error");
      }
    },

    /**
     * Refresh the tree from file system.
     */
    async refresh(): Promise<void> {
      if (!globalState) return;

      try {
        // Rebuild tree from scratch
        const rootNode = buildTree(globalState.rootPath, globalState.showHidden);
        globalState = { ...globalState, rootNode };

        // Re-render
        const visibleNodes = getVisibleNodes(rootNode, globalState.showHidden);
        await renderTreeToBuffer(
          denops,
          globalState.bufnr,
          visibleNodes,
          globalState.cursorLine,
        );

        await notify(denops, "Tree refreshed", "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to refresh: ${message}`, "error");
      }
    },
  };

  // Register user commands
  await denops.cmd(
    `command! -nargs=0 RangerOpen call denops#notify('${denops.name}', 'openTree', [])`,
  );
  await denops.cmd(
    `command! -nargs=0 RangerCreateFile call denops#notify('${denops.name}', 'createFile', [])`,
  );
  await denops.cmd(
    `command! -nargs=0 RangerCreateDirectory call denops#notify('${denops.name}', 'createDirectory', [])`,
  );
  await denops.cmd(
    `command! -nargs=0 RangerDelete call denops#notify('${denops.name}', 'deleteNode', [])`,
  );
  await denops.cmd(
    `command! -nargs=0 RangerRename call denops#notify('${denops.name}', 'renameNode', [])`,
  );
  await denops.cmd(
    `command! -nargs=0 RangerToggleHidden call denops#notify('${denops.name}', 'toggleHidden', [])`,
  );
  await denops.cmd(
    `command! -nargs=0 RangerSearch call denops#notify('${denops.name}', 'search', [])`,
  );
  await denops.cmd(
    `command! -nargs=0 RangerSystemOpen call denops#notify('${denops.name}', 'systemOpen', [])`,
  );
  await denops.cmd(
    `command! -nargs=0 RangerRefresh call denops#notify('${denops.name}', 'refresh', [])`,
  );
}
