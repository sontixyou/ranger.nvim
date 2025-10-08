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
import { createTreeState, updateState } from "../../src/models/tree-state.ts";
import { buildTree, getVisibleNodes, toggleNode } from "../../src/services/tree-builder.ts";
import {
  createDirectory,
  createFile,
  deleteDirectory,
  deleteFile,
  rename,
} from "../../src/services/file-system.ts";
import { createSearchQuery, executeSearch } from "../../src/services/search.ts";
import { openWithSystemApp } from "../../src/services/system-app.ts";
import { createTreeBuffer, renderTreeToBuffer } from "../../src/ui/tree-renderer.ts";
import {
  confirm,
  getNodeAtCursor,
  input,
  notify,
  setupKeybindings,
} from "../../src/ui/interaction.ts";

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
     * Open the tree explorer buffer.
     *
     * Creates a new buffer, builds the tree from current directory,
     * and sets up keybindings.
     */
    async openTree(): Promise<void> {
      try {
        // Get current working directory
        const cwd = (await denops.call("getcwd")) as string;

        // Build tree from current directory
        const rootNode = buildTree(cwd, false);

        // Create tree buffer
        const bufnr = await createTreeBuffer(denops);

        // Initialize tree state
        globalState = createTreeState(cwd, rootNode, bufnr);

        // Set up keybindings
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
        const visibleNodes = getVisibleNodes(rootNode, false);
        await renderTreeToBuffer(denops, bufnr, visibleNodes, 0);

        // Open buffer in current window
        await denops.call("nvim_set_current_buf", bufnr);

        await notify(denops, `Opened tree: ${cwd}`, "info");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await notify(denops, `Failed to open tree: ${message}`, "error");
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
          // Open file in Neovim
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

        // Toggle node (this modifies the tree structure)
        toggleNode(node, globalState.showHidden);

        // Rebuild tree to reflect the change (simplified approach)
        const rootNode = buildTree(globalState.rootPath, globalState.showHidden);
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

  await denops.cmd(
    `command! -nargs=0 RangerOpen call denops#notify('${denops.name}', 'openTree', [])`,
  );
}
