/**
 * Ranger: Neovim File Explorer Tree
 * Main entry point for denops.vim plugin
 */

import { Denops } from "https://deno.land/x/denops_std@v6.0.0/mod.ts";

export function main(denops: Denops): void {
  // Plugin dispatcher - maps Vim commands to TypeScript functions
  denops.dispatcher = {
    // Placeholder for future commands
    // Will be implemented in later tasks
  };
}
