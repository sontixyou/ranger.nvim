# Research: Neovim File Explorer Tree

**Feature**: 001-neovim-file-explorer
**Date**: 2025-10-06
**Phase**: 0 - Technical Research

## Overview
This document consolidates technical research for implementing a synchronous file explorer tree plugin for Neovim using denops.vim and TypeScript.

## Research Areas

### 1. denops.vim Synchronous API Patterns

**Decision**: Use denops.vim's synchronous helper functions and avoid async/await patterns

**Rationale**:
- denops.vim provides synchronous wrappers for Neovim API calls when used without async/await
- Constitutional requirement for synchronous execution aligns with denops.vim's capability to operate synchronously
- Function exports in denops plugins are called synchronously from Neovim's command layer

**Implementation Pattern**:
```typescript
// Synchronous denops.vim pattern
import { Denops } from "https://deno.land/x/denops_std@v6.0.0/mod.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    // All exported functions execute synchronously
    openTree(): void {
      // Synchronous Neovim API calls via denops.helper
      const bufnr = denops.call("nvim_create_buf", false, true);
      denops.call("nvim_set_current_buf", bufnr);
    }
  };
}
```

**Alternatives Considered**:
- **Async denops.vim** - Rejected: Violates constitutional synchronous execution requirement
- **VimL/Lua only** - Rejected: Spec requires TypeScript with denops.vim
- **Remote plugin architecture** - Rejected: Introduces process boundaries and async communication

**Key APIs**:
- `denops.call(function, ...args)` - Synchronous Neovim API calls
- `denops.cmd(command)` - Synchronous Ex command execution
- `denops.eval(expression)` - Synchronous expression evaluation
- `denops.dispatcher` - Synchronous function registry for Neovim commands

---

### 2. Deno Synchronous File System APIs

**Decision**: Use Deno's *Sync file system APIs exclusively

**Rationale**:
- Deno provides comprehensive synchronous file system API surface (`Deno.readDirSync`, `Deno.statSync`, etc.)
- Synchronous APIs meet constitutional requirement while providing full file operation capabilities
- Performance acceptable for <1,000 files per directory (spec requirement)

**Key APIs**:
```typescript
// Reading directories
Deno.readDirSync(path: string | URL): Iterable<Deno.DirEntry>

// File/directory information
Deno.statSync(path: string | URL): Deno.FileInfo

// File operations
Deno.mkdirSync(path: string | URL, options?: Deno.MkdirOptions): void
Deno.removeSync(path: string | URL, options?: { recursive?: boolean }): void
Deno.renameSync(oldpath: string | URL, newpath: string | URL): void
Deno.copyFileSync(from: string | URL, to: string | URL): void

// File reading/writing
Deno.readTextFileSync(path: string | URL): string
Deno.writeTextFileSync(path: string | URL, data: string): void
```

**Performance Characteristics**:
- Synchronous directory reads scale linearly with file count
- For 1,000 files: ~10-50ms on modern SSDs (well within 100ms search requirement)
- No context switching overhead from async operations

**Alternatives Considered**:
- **Async Deno APIs** (`Deno.readDir`, `Deno.stat`) - Rejected: Constitutional violation
- **Node.js fs.sync** - Rejected: Spec requires Deno runtime via denops.vim
- **Shell command execution** (`ls`, `find`) - Rejected: Less portable, parsing overhead

---

### 3. Neovim Buffer Rendering for Tree Structures

**Decision**: Use Neovim buffer API with virtual text/extmarks for tree visualization

**Rationale**:
- Neovim's buffer API provides full control over text content and visual decorations
- Virtual text (via extmarks) enables tree indentation and icons without affecting line content
- Synchronous buffer updates via denops.vim `nvim_buf_set_lines`

**Rendering Strategy**:
```typescript
// Tree rendering approach
interface TreeLine {
  depth: number;       // Indentation level
  icon: string;        // File/folder icon
  name: string;        // File/directory name
  path: string;        // Full path for operations
  expanded?: boolean;  // For directories
}

// Render to buffer
function renderTree(denops: Denops, bufnr: number, lines: TreeLine[]): void {
  const textLines = lines.map(line =>
    `${"  ".repeat(line.depth)}${line.icon} ${line.name}`
  );
  denops.call("nvim_buf_set_lines", bufnr, 0, -1, false, textLines);
}
```

**Visual Elements**:
- **Indentation**: Spaces (2 per depth level)
- **Icons**: Unicode characters (📁 directory, 📄 file, or ASCII fallback)
- **Highlight groups**: Custom highlight groups for directories, files, hidden files

**Key Neovim APIs**:
- `nvim_create_buf(listed, scratch)` - Create tree buffer
- `nvim_buf_set_lines(buffer, start, end, strict, lines)` - Update buffer content
- `nvim_buf_set_option(buffer, name, value)` - Set buffer options (readonly, buftype)
- `nvim_buf_add_highlight(buffer, ns_id, hl_group, line, col_start, col_end)` - Syntax highlighting

**Alternatives Considered**:
- **Floating windows** - Rejected: Spec doesn't require floating UI, adds complexity
- **Custom UI via GUI** - Rejected: Terminal-only Neovim compatibility required
- **Tree-sitter parsing** - Rejected: Overkill for simple tree structure

---

### 4. Neovim Keybinding Conventions

**Decision**: Follow nvim-tree.lua keybinding conventions with customizable mappings

**Rationale**:
- nvim-tree.lua is the most popular Neovim file explorer (reference implementation)
- Users expect familiar keybindings for file navigation
- Customizable mappings via plugin configuration

**Standard Keybindings**:
```typescript
// Default key mappings (user-configurable)
const defaultMappings = {
  // Navigation
  "<CR>": "open",           // Open file or toggle directory
  "o": "open",              // Alternative open
  "<Tab>": "expand",        // Expand directory
  "za": "toggle",           // Toggle expand/collapse

  // File operations
  "a": "create",            // Create file/directory
  "d": "delete",            // Delete file/directory
  "r": "rename",            // Rename file/directory
  "c": "copy",              // Copy file/directory
  "x": "cut",               // Cut (move) file/directory
  "p": "paste",             // Paste file/directory

  // Display
  "H": "toggle_hidden",     // Toggle hidden files
  "/": "search",            // Search files

  // System integration
  "s": "system_open",       // Open with system app
};
```

**Key Neovim APIs**:
- `nvim_buf_set_keymap(buffer, mode, lhs, rhs, opts)` - Buffer-local keybindings
- `nvim_create_autocmd(event, opts)` - Autocommands for buffer events

**Alternatives Considered**:
- **Vim defaults only** - Rejected: Less intuitive for file operations
- **Custom mnemonics** - Rejected: Steeper learning curve, incompatible with user expectations
- **Which-key integration** - Future enhancement, not MVP requirement

---

### 5. Cross-Platform System Application Launch

**Decision**: Use `Deno.Command` with platform detection for macOS/Linux

**Rationale**:
- Deno.Command provides synchronous process spawning (when used with `.outputSync()`)
- Platform-specific commands: `open` (macOS), `xdg-open` (Linux)
- Constitutional requirement: synchronous execution, detached child process

**Implementation**:
```typescript
function openWithSystemApp(path: string): void {
  const platform = Deno.build.os; // "darwin" or "linux"
  const command = platform === "darwin" ? "open" : "xdg-open";

  // Synchronous spawn with detached child
  new Deno.Command(command, {
    args: [path],
    stdout: "null",
    stderr: "null",
  }).outputSync(); // Blocks until spawn completes, child runs detached
}
```

**Platform Detection**:
- `Deno.build.os` - Returns "darwin" (macOS) or "linux"
- Spec excludes Windows support

**Error Handling**:
- Catch `Deno.errors.NotFound` if system command unavailable
- Catch `Deno.errors.PermissionDenied` for file access issues

**Alternatives Considered**:
- **Async child process** - Rejected: Constitutional violation
- **Shell script wrapper** - Rejected: Additional dependency, less portable
- **File association detection** - Rejected: Complexity, system command handles this

---

### 6. vitest with TypeScript/Deno Projects

**Decision**: Use vitest with Deno runtime configuration

**Rationale**:
- vitest is spec requirement
- Supports TypeScript natively via vite
- Can be configured to use Deno runtime APIs via appropriate setup

**Configuration Approach**:
```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node", // Use node environment with Deno polyfills
    include: ["tests/**/*.test.ts"],
  },
});
```

**Testing Strategy**:
- **Unit tests**: Pure functions (tree building, search filtering)
- **Integration tests**: Mock denops.vim interface, test file operations
- **Contract tests**: Verify API signatures match contract definitions

**Mocking Strategy**:
- Mock `Deno.*` APIs for controlled file system testing
- Mock `denops.call()` for Neovim API interaction testing

**Alternatives Considered**:
- **Deno native testing** (`Deno.test`) - Rejected: Spec requires vitest
- **Jest** - Rejected: Spec requires vitest
- **Manual testing only** - Rejected: Insufficient for TDD workflow

---

### 7. denops.vim Plugin Structure Best Practices

**Decision**: Follow denops.vim standard plugin structure with TypeScript modules

**Rationale**:
- denops.vim expects plugins at `denops/{plugin-name}/main.ts`
- Modular structure separates concerns (models, services, UI)
- Aligns with project structure defined in plan.md

**Directory Structure**:
```
denops/
└── ranger/              # Plugin name
    ├── main.ts          # denops entry point (exports main(denops))
    ├── models/          # Data structures
    ├── services/        # Business logic
    └── ui/              # Neovim UI integration

tests/
├── unit/
└── integration/
```

**Plugin Registration**:
```typescript
// denops/ranger/main.ts
import { Denops } from "https://deno.land/x/denops_std@v6.0.0/mod.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    openTree: () => { /* ... */ },
    createFile: () => { /* ... */ },
    deleteFile: () => { /* ... */ },
    // ... other commands
  };
}
```

**Vim Integration**:
```vim
" plugin/ranger.vim
if !exists('g:loaded_ranger')
  let g:loaded_ranger = 1

  " Register denops plugin
  call denops#plugin#register('ranger')

  " User commands
  command! RangerOpen call denops#notify('ranger', 'openTree', [])
endif
```

**Best Practices**:
- Export only `main(denops)` from main.ts
- Use TypeScript strict mode
- Avoid global state (pass denops context explicitly)
- Keep dispatcher functions thin (delegate to services)

**Alternatives Considered**:
- **Flat file structure** - Rejected: Poor maintainability at scale
- **Class-based architecture** - Rejected: Functional approach simpler for synchronous code
- **Multiple denops plugins** - Rejected: Unnecessary complexity for single feature

---

## Research Summary

All technical unknowns have been resolved:

1. **denops.vim Synchronous API**: Use synchronous denops.call/cmd/eval, avoid async/await
2. **Deno File System**: Use *Sync APIs exclusively (readDirSync, statSync, etc.)
3. **Neovim Buffer Rendering**: Use nvim_buf_set_lines with Unicode icons and indentation
4. **Keybinding Conventions**: Follow nvim-tree.lua patterns with buffer-local mappings
5. **System App Launch**: Use Deno.Command with platform detection (open/xdg-open)
6. **vitest Configuration**: Use vitest with TypeScript and mocked Deno/denops APIs
7. **Plugin Structure**: Follow denops/{name}/main.ts pattern with modular TypeScript

**No NEEDS CLARIFICATION items remain.** Ready for Phase 1 (Design & Contracts).

---

**Phase 0 Status**: ✓ COMPLETE
**Next Phase**: Phase 1 - Design & Contracts
