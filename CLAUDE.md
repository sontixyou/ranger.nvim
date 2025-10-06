# Claude Code Context - Neovim File Explorer Tree

**Project**: ranger - Neovim File Explorer Tree Plugin
**Last Updated**: 2025-10-06
**Current Feature**: 001-neovim-file-explorer

## Tech Stack

**Language**: TypeScript (ES2020+, Deno runtime)
**Framework**: denops.vim (Neovim-Deno bridge)
**Testing**: vitest
**Build Tool**: vite
**Platform**: Neovim 0.8+ on macOS and Linux

## Constitutional Principles

### I. Synchronous Execution Only (NON-NEGOTIABLE)
All code MUST execute synchronously. No async/await, promises, callbacks, or event loops.
- Use Deno *Sync APIs exclusively (readDirSync, statSync, etc.)
- Use denops.call/cmd/eval synchronously (no async/await)
- All functions must complete before returning control

### II. Neovim Runtime Environment
All functionality operates within Neovim via denops.vim.
- No standalone processes or external runtime dependencies
- All UI via Neovim buffer/window APIs
- denops.vim is the only bridge to Neovim

## Current Feature: File Explorer Tree

**Branch**: 001-neovim-file-explorer
**Spec**: specs/001-neovim-file-explorer/spec.md
**Plan**: specs/001-neovim-file-explorer/plan.md

### Core Requirements
- Hierarchical tree display of files and directories
- File operations: create, delete, rename, copy, move
- Tree navigation: expand, collapse, navigate
- Real-time search with <100ms latency
- Hidden file toggle
- System application integration (macOS/Linux)
- Support up to 1,000 files per directory

### Architecture

**Source Structure**:
```
src/
├── models/          # FileNode, DirectoryNode, TreeNode
├── services/        # file-system, tree-builder, search, system-app
├── ui/              # tree-renderer, keybindings, buffer-manager
└── main.ts          # denops.vim entry point
```

**Contracts**: specs/001-neovim-file-explorer/contracts/
- file-system-api.ts - File/directory operations
- tree-api.ts - Tree building and navigation
- search-api.ts - File search functionality
- ui-api.ts - Neovim buffer/window rendering
- system-api.ts - System app integration
- types.ts - Shared data structures

**Data Model**: specs/001-neovim-file-explorer/data-model.md
- FileNode: Represents files
- DirectoryNode: Represents directories with expansion state
- TreeState: UI state (root, cursor, search, buffer)
- FileOperation: File system operations
- SearchQuery: Search filtering

### Key APIs

**Deno (Synchronous)**:
- Deno.readDirSync() - Read directory contents
- Deno.statSync() - Get file/directory info
- Deno.mkdirSync() - Create directory
- Deno.removeSync() - Delete file/directory
- Deno.renameSync() - Rename/move
- Deno.copyFileSync() - Copy file
- Deno.Command().outputSync() - Launch system app

**denops.vim (Synchronous)**:
- denops.call() - Neovim API calls
- denops.cmd() - Ex commands
- denops.eval() - Expression evaluation
- denops.dispatcher - Command registry

**Neovim APIs**:
- nvim_create_buf() - Create tree buffer
- nvim_buf_set_lines() - Render tree
- nvim_buf_set_keymap() - Keybindings
- nvim_create_autocmd() - Event handling

### Development Guidelines

1. **Always synchronous**: Verify no async/await in code
2. **TDD workflow**: Write tests before implementation
3. **Constitutional compliance**: Check each PR against principles
4. **Performance targets**: <100ms search, 1000 files support
5. **Error handling**: Clear user feedback for file operation failures

### Recent Changes

1. Phase 0 complete: Research and technical decisions documented
2. Phase 1 complete: Data model, contracts, and quickstart defined
3. Ready for Phase 2: Task generation (/tasks command)

---

**Next Steps**: Run `/tasks` to generate implementation task list

**Documentation**:
- Constitution: .specify/memory/constitution.md
- Research: specs/001-neovim-file-explorer/research.md
- Quickstart: specs/001-neovim-file-explorer/quickstart.md
