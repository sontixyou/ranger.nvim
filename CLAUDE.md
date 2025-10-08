# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ranger** is a Neovim file explorer tree plugin built with TypeScript and Deno, integrated via denops.vim. It provides hierarchical file browsing with real-time search, file operations, and system integration.

## Tech Stack

- **Language**: TypeScript (ES2020+)
- **Runtime**: Deno 1.30+ (NOT Node.js)
- **Framework**: denops.vim (Neovim-Deno bridge)
- **Testing**: vitest
- **Platform**: macOS and Linux only (Windows not supported)

## Development Commands

### Type Checking
```bash
deno check denops/ranger/main.ts
deno check src/**/*.ts
```

### Testing
```bash
# Run all tests
deno task test

# Run specific test file
deno task test tests/integration/search.test.ts

# Run tests with coverage
deno task test:coverage
```

### Code Quality
```bash
# Format code
deno fmt

# Lint code
deno lint
```

### Performance Validation
```bash
deno run --allow-read --allow-write scripts/performance-test.ts
```

## Architecture

### Constitutional Constraints (CRITICAL)

**Synchronous Execution Only (NON-NEGOTIABLE)**:
- All code MUST execute synchronously - NO async/await, promises, callbacks, or event loops
- Use Deno `*Sync` APIs exclusively: `readDirSync()`, `statSync()`, `mkdirSync()`, etc.
- denops dispatcher functions use `async` syntax as required by denops.vim, but internally execute synchronously
- All functions must complete before returning control
- Violation of this constraint breaks the entire plugin architecture

**Neovim Runtime Environment**:
- All functionality operates within Neovim via denops.vim
- No standalone processes or external runtime dependencies
- All UI interactions via Neovim buffer/window APIs
- denops.vim is the only bridge between Deno and Neovim

### Directory Structure

```
denops/ranger/main.ts    # Plugin entry point, command dispatcher
src/
  ├── models/            # Type definitions and state (FileNode, DirectoryNode, TreeState)
  ├── services/          # Business logic (file-system, tree-builder, search, system-app)
  └── ui/                # UI rendering and interaction (tree-renderer, keybindings, buffer-manager)
tests/
  ├── contract/          # API contract tests
  ├── integration/       # Feature integration tests
  └── unit/              # Unit tests
specs/001-neovim-file-explorer/  # Feature specifications and planning
```

### Key Architecture Patterns

**State Management**: Global `TreeState` object holds root path, tree structure, buffer number, cursor position, search query, and hidden file visibility.

**Tree Structure**: Immutable tree built from `DirectoryNode` (with children and expansion state) and `FileNode` (leaf nodes). Tree is rebuilt on state changes.

**Rendering Pipeline**:
1. `buildTree()` - Constructs tree from filesystem (synchronous)
2. `getVisibleNodes()` - Flattens tree based on expansion state
3. `renderTreeToBuffer()` - Renders visible nodes to Neovim buffer

**Command Dispatcher**: denops.vim dispatcher maps keybindings to async wrapper functions that call synchronous core logic.

### Core APIs

**Deno Synchronous APIs** (use these exclusively):
- `Deno.readDirSync()` - Read directory contents
- `Deno.statSync()` - Get file/directory metadata
- `Deno.mkdirSync()` - Create directory
- `Deno.removeSync()` - Delete file/directory
- `Deno.renameSync()` - Rename/move file/directory
- `Deno.copyFileSync()` - Copy file
- `Deno.Command().outputSync()` - Execute system commands synchronously

**denops.vim APIs** (async wrappers, but call synchronously):
- `denops.call()` - Neovim API calls (nvim_* functions)
- `denops.cmd()` - Ex commands
- `denops.eval()` - Expression evaluation
- `denops.dispatcher` - Command registry

**Neovim Buffer APIs** (called via denops):
- `nvim_create_buf()` - Create tree buffer
- `nvim_buf_set_lines()` - Render tree lines
- `nvim_buf_set_keymap()` - Set keybindings
- `nvim_set_current_buf()` - Switch to buffer

## Performance Targets

- Tree building: ~15ms for 1,000 files
- Search: <100ms (actual: <1ms for most queries)
- Rendering: <0.1ms for visible node extraction
- Support: 1,000+ files per directory

## Testing Guidelines

- Write tests BEFORE implementation (TDD workflow)
- Contract tests verify API interfaces match specifications
- Integration tests verify end-to-end feature behavior
- All file system operations must be tested with temporary directories
- Tests must clean up after themselves (no leftover files)

## Common Pitfalls

1. **Using async/await**: Will break synchronous execution model. Use synchronous Deno APIs only.
2. **Using Node.js APIs**: This is a Deno project. Use Deno standard library and APIs.
3. **Modifying tree in place**: Tree structure should be immutable. Rebuild tree on state changes.
4. **Forgetting to refresh**: After file operations, rebuild tree and re-render to reflect changes.
5. **Path separators**: Always use `/` (forward slash), not `\` (backslash), even on Windows-like paths.

## Specification Documents

- Feature spec: `specs/001-neovim-file-explorer/spec.md`
- Data model: `specs/001-neovim-file-explorer/data-model.md`
- Implementation plan: `specs/001-neovim-file-explorer/plan.md`
- Task list: `specs/001-neovim-file-explorer/tasks.md`
- Quickstart guide: `specs/001-neovim-file-explorer/quickstart.md`
