# Tasks: Neovim File Explorer Tree

**Feature**: 001-neovim-file-explorer
**Input**: Design documents from `/specs/001-neovim-file-explorer/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   ✓ Loaded: TypeScript, denops.vim, vitest, single project structure
   ✓ Extract: tech stack (TypeScript/Deno), libraries (denops.vim), structure (src/, tests/)
2. Load optional design documents:
   ✓ data-model.md: 6 entities (FileNode, DirectoryNode, TreeNode, TreeState, FileOperation, SearchQuery)
   ✓ contracts/: 6 files (types.ts, file-system-api.ts, tree-api.ts, search-api.ts, ui-api.ts, system-api.ts)
   ✓ research.md: Technical decisions (Deno *Sync APIs, denops synchronous patterns)
   ✓ quickstart.md: 16 test scenarios
3. Generate tasks by category:
   ✓ Setup: denops plugin structure, dependencies, linting
   ✓ Tests: 6 contract tests, 11 integration tests
   ✓ Core: 6 models, 4 services, denops main entry
   ✓ Integration: UI rendering, keybindings, Vim integration
   ✓ Polish: unit tests, performance validation, docs
4. Apply task rules:
   ✓ Different files = mark [P] for parallel
   ✓ Same file = sequential (no [P])
   ✓ Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   ✓ All contracts have tests
   ✓ All entities have models
   ✓ All APIs implemented
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- Constitutional requirement: All code must be synchronous

## Path Conventions
- **Denops plugin**: `denops/ranger/` for plugin code
- **Source**: `src/` for TypeScript modules
- **Tests**: `tests/` for vitest tests
- **Vim integration**: `plugin/` for Vim scripts

---

## Phase 3.1: Setup

- [x] **T001** Create denops plugin directory structure
  - Create `denops/ranger/` directory
  - Create `denops/ranger/main.ts` (denops entry point)
  - Create `src/models/`, `src/services/`, `src/ui/` directories
  - Create `tests/unit/`, `tests/integration/`, `tests/contract/` directories
  - Create `plugin/ranger.vim` for Vim integration

- [x] **T002** Initialize TypeScript project with Deno and dependencies
  - Create `deno.json` with import map for denops_std
  - Configure TypeScript compiler options (strict mode, ES2020 target)
  - Add denops.vim dependency reference
  - Create `.gitignore` (ignore node_modules, build artifacts)

- [x] **T003** [P] Configure development tools
  - Create `vitest.config.ts` for test runner
  - Configure Deno formatter (deno.json)
  - Set up ESLint/Deno lint configuration
  - Create `.editorconfig` for consistent formatting

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (Parallel - Different Files)

- [ ] **T004** [P] Contract test for types.ts in `tests/contract/types.test.ts`
  - Test FileNode interface compliance (type, name, path, hidden, fileType, size, mtime)
  - Test DirectoryNode interface compliance (type, name, path, hidden, expanded, children, childCount, mtime)
  - Test TreeNode discriminated union (type guards)
  - Test TreeState interface compliance
  - Test FileOperation interface compliance
  - Test SearchQuery interface compliance
  - **Expected**: Tests FAIL (types not yet defined)

- [ ] **T005** [P] Contract test for file-system-api.ts in `tests/contract/file-system-api.test.ts`
  - Test createFile(path, content?) signature and return type
  - Test createDirectory(path, recursive?) signature and return type
  - Test deleteFile(path) signature and error conditions
  - Test deleteDirectory(path, recursive?) signature and error conditions
  - Test rename(oldPath, newPath) signature
  - Test copyFile(source, destination) signature
  - Test copyDirectory(source, destination) signature
  - Test moveFile(source, destination) signature
  - Test moveDirectory(source, destination) signature
  - Test exists(path) signature
  - Test isDirectory(path) signature
  - **Expected**: Tests FAIL (functions not implemented)

- [ ] **T006** [P] Contract test for tree-api.ts in `tests/contract/tree-api.test.ts`
  - Test buildTree(rootPath, showHidden) signature and return type
  - Test loadChildren(node, showHidden) signature
  - Test expandNode(node, showHidden) signature
  - Test collapseNode(node) signature
  - Test toggleNode(node, showHidden) signature
  - Test findNodeByPath(root, path) signature
  - Test getVisibleNodes(root, showHidden) signature
  - Test sortNodes(nodes) signature
  - Test refreshNode(node, showHidden) signature
  - **Expected**: Tests FAIL (functions not implemented)

- [ ] **T007** [P] Contract test for search-api.ts in `tests/contract/search-api.test.ts`
  - Test createSearchQuery(text) signature and return type
  - Test executeSearch(query, root) signature
  - Test matchesQuery(node, query) signature
  - Test filterNodesByQuery(nodes, query) signature
  - Test clearSearchQuery(query) signature
  - **Expected**: Tests FAIL (functions not implemented)

- [ ] **T008** [P] Contract test for ui-api.ts in `tests/contract/ui-api.test.ts`
  - Test createTreeBuffer(denops) signature (mock denops)
  - Test renderTreeToBuffer(denops, bufnr, nodes, cursorLine) signature
  - Test formatNodeLine(node, depth) signature
  - Test setupKeybindings(denops, bufnr, mappings) signature
  - Test getNodeAtCursor(denops, state) signature
  - Test setCursor(denops, bufnr, line) signature
  - Test notify(denops, message, level) signature
  - Test confirm(denops, message) signature
  - Test input(denops, prompt, defaultValue?) signature
  - **Expected**: Tests FAIL (functions not implemented)

- [ ] **T009** [P] Contract test for system-api.ts in `tests/contract/system-api.test.ts`
  - Test openWithSystemApp(path) signature and error conditions
  - Test detectPlatform() signature and return values ("darwin" | "linux")
  - **Expected**: Tests FAIL (functions not implemented)

### Integration Tests (Parallel - Different Files)

- [ ] **T010** [P] Integration test: Open tree and display structure in `tests/integration/open-tree.test.ts`
  - Mock file system with test directory structure
  - Test opening tree buffer (quickstart step 1)
  - Assert directories and files displayed with icons
  - Assert hidden files NOT visible initially
  - **Expected**: Test FAILS (no implementation)

- [ ] **T011** [P] Integration test: Expand/collapse directory in `tests/integration/expand-collapse.test.ts`
  - Mock directory with children
  - Test expand operation (quickstart step 2)
  - Assert children become visible with proper indentation
  - Test collapse operation (quickstart step 16)
  - Assert children hidden
  - **Expected**: Test FAILS (no implementation)

- [ ] **T012** [P] Integration test: Navigate tree with cursor in `tests/integration/navigate.test.ts`
  - Mock tree with multiple nodes
  - Test cursor movement up/down (quickstart step 3)
  - Assert cursor position updates correctly
  - **Expected**: Test FAILS (no implementation)

- [ ] **T013** [P] Integration test: Open file in buffer in `tests/integration/open-file.test.ts`
  - Mock file in tree
  - Test opening file with <CR> (quickstart step 4)
  - Assert file opens in Neovim buffer (mock denops)
  - **Expected**: Test FAILS (no implementation)

- [ ] **T014** [P] Integration test: Toggle hidden files in `tests/integration/toggle-hidden.test.ts`
  - Mock directory with hidden files (.git, .gitignore)
  - Test toggle hidden files (quickstart step 5)
  - Assert hidden files appear/disappear
  - Assert tree updates correctly
  - **Expected**: Test FAILS (no implementation)

- [ ] **T015** [P] Integration test: Search files interactively in `tests/integration/search.test.ts`
  - Mock tree with multiple files
  - Test search activation and filtering (quickstart step 6)
  - Assert matching files highlighted/visible
  - Assert search clears correctly
  - Assert <100ms performance requirement (FR-030)
  - **Expected**: Test FAILS (no implementation)

- [ ] **T016** [P] Integration test: Create file in `tests/integration/create-file.test.ts`
  - Mock directory
  - Test file creation (quickstart step 7)
  - Assert file created in file system (mock)
  - Assert tree updates with new file
  - Test duplicate file creation fails (quickstart step 8, FR-009a)
  - **Expected**: Test FAILS (no implementation)

- [ ] **T017** [P] Integration test: Rename file in `tests/integration/rename.test.ts`
  - Mock existing file
  - Test rename operation (quickstart step 9)
  - Assert file renamed in file system (mock)
  - Assert tree updates with new name
  - **Expected**: Test FAILS (no implementation)

- [ ] **T018** [P] Integration test: Copy and move operations in `tests/integration/copy-move.test.ts`
  - Mock source file and destination directory
  - Test copy file (quickstart step 10)
  - Test move directory (quickstart step 14)
  - Assert file system operations complete (mock)
  - Assert tree updates correctly
  - **Expected**: Test FAILS (no implementation)

- [ ] **T019** [P] Integration test: Delete file and directory in `tests/integration/delete.test.ts`
  - Mock file and non-empty directory
  - Test delete file (quickstart step 11)
  - Test delete non-empty directory with confirmation (quickstart steps 13, FR-012a)
  - Assert confirmation prompt appears
  - Assert recursive delete on confirmation
  - Assert tree updates after deletion
  - **Expected**: Test FAILS (no implementation)

- [ ] **T020** [P] Integration test: Open with system app in `tests/integration/system-app.test.ts`
  - Mock file and system command execution
  - Test open with system app (quickstart step 15)
  - Assert correct command used (open on macOS, xdg-open on Linux)
  - Assert process spawns detached
  - **Expected**: Test FAILS (no implementation)

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Models (Parallel - Different Files)

- [ ] **T021** [P] Implement types in `src/models/types.ts`
  - Define FileNode interface
  - Define DirectoryNode interface
  - Define TreeNode discriminated union type
  - Define TreeState interface
  - Define FileOperation interface
  - Define SearchQuery interface
  - Add type guard functions (isFile, isDirectory)
  - **Verify**: T004 contract test now PASSES

- [ ] **T022** [P] Implement TreeNode utilities in `src/models/tree-node.ts`
  - Implement createFileNode(entry, basePath) helper
  - Implement createDirectoryNode(entry, basePath) helper
  - Implement node comparison/sorting logic
  - Export utility functions
  - **Verify**: Unit tests pass

- [ ] **T023** [P] Implement TreeState manager in `src/models/tree-state.ts`
  - Implement TreeState creation function
  - Implement state update functions (cursor, search, showHidden)
  - Ensure immutable state updates
  - Export state management utilities
  - **Verify**: State operations work correctly

### Services (Sequential - Dependencies on Models)

- [ ] **T024** Implement file system service in `src/services/file-system.ts`
  - Implement createFile(path, content?) using Deno.writeTextFileSync
  - Implement createDirectory(path, recursive?) using Deno.mkdirSync
  - Implement deleteFile(path) using Deno.removeSync
  - Implement deleteDirectory(path, recursive?) using Deno.removeSync
  - Implement rename(oldPath, newPath) using Deno.renameSync
  - Implement copyFile(source, destination) using Deno.copyFileSync
  - Implement copyDirectory(source, destination) with recursive copy
  - Implement moveFile/moveDirectory using rename
  - Implement exists(path) and isDirectory(path) helpers
  - Add error handling for all operations
  - **Constitutional Check**: All functions MUST be synchronous
  - **Verify**: T005 contract test now PASSES

- [ ] **T025** Implement tree builder service in `src/services/tree-builder.ts`
  - Implement buildTree(rootPath, showHidden) using Deno.readDirSync
  - Implement loadChildren(node, showHidden) with Deno.readDirSync
  - Implement expandNode(node, showHidden)
  - Implement collapseNode(node)
  - Implement toggleNode(node, showHidden)
  - Implement findNodeByPath(root, path) with tree traversal
  - Implement getVisibleNodes(root, showHidden) with depth tracking
  - Implement sortNodes(nodes) per data-model.md spec
  - Implement refreshNode(node, showHidden)
  - **Constitutional Check**: All functions MUST be synchronous
  - **Verify**: T006 contract test now PASSES

- [ ] **T026** Implement search service in `src/services/search.ts`
  - Implement createSearchQuery(text)
  - Implement executeSearch(query, root) with linear scan
  - Implement matchesQuery(node, query) with case-insensitive match
  - Implement filterNodesByQuery(nodes, query)
  - Implement clearSearchQuery(query)
  - Optimize for <100ms performance on 1,000 nodes (FR-030)
  - **Constitutional Check**: All functions MUST be synchronous
  - **Verify**: T007 contract test now PASSES

- [ ] **T027** Implement system app service in `src/services/system-app.ts`
  - Implement detectPlatform() using Deno.build.os
  - Implement openWithSystemApp(path) using Deno.Command
  - Use "open" command on macOS (darwin)
  - Use "xdg-open" command on Linux
  - Spawn process with outputSync() for synchronous execution
  - Add error handling for unsupported platforms
  - **Constitutional Check**: MUST use synchronous spawn
  - **Verify**: T009 contract test now PASSES

### UI Implementation (Sequential - Dependencies on Services)

- [ ] **T028** Implement tree renderer in `src/ui/tree-renderer.ts`
  - Implement createTreeBuffer(denops) using nvim_create_buf
  - Set buffer options (buftype=nofile, modifiable=false, etc.)
  - Implement renderTreeToBuffer(denops, bufnr, nodes, cursorLine)
  - Implement formatNodeLine(node, depth) with icons and indentation
  - Implement buffer update logic using nvim_buf_set_lines
  - Add syntax highlighting setup
  - **Constitutional Check**: All denops calls MUST be synchronous
  - **Verify**: T008 contract test (partial) now PASSES

- [ ] **T029** Implement user interaction in `src/ui/interaction.ts`
  - Implement setupKeybindings(denops, bufnr, mappings)
  - Create buffer-local key mappings using nvim_buf_set_keymap
  - Implement getNodeAtCursor(denops, state)
  - Implement setCursor(denops, bufnr, line)
  - Implement notify(denops, message, level) using nvim_notify or echo
  - Implement confirm(denops, message) using input()
  - Implement input(denops, prompt, defaultValue?)
  - **Constitutional Check**: All denops calls MUST be synchronous
  - **Verify**: T008 contract test now FULLY PASSES

### Main Entry Point (Sequential - Dependencies on All Above)

- [ ] **T030** Implement denops main entry in `denops/ranger/main.ts`
  - Import all services and UI modules
  - Export main(denops) function
  - Implement denops.dispatcher with commands:
    - openTree: Create tree buffer and render
    - createFile: Handle file creation workflow
    - deleteFile: Handle file deletion workflow
    - rename: Handle rename workflow
    - copy: Handle copy workflow
    - move: Handle move workflow
    - search: Handle search workflow
    - toggleHidden: Toggle hidden files
    - systemOpen: Open with system app
    - expandCollapse: Handle expand/collapse
  - Wire up all keybindings to dispatcher commands
  - **Constitutional Check**: All dispatcher functions MUST be synchronous
  - **Verify**: Integration tests T010-T020 now PASS

- [ ] **T031** Implement Vim plugin registration in `plugin/ranger.vim`
  - Check g:loaded_ranger to prevent double loading
  - Register denops plugin: `call denops#plugin#register('ranger')`
  - Create user command: `:RangerOpen` → `call denops#notify('ranger', 'openTree', [])`
  - Create user commands for file operations
  - Add default keybinding setup (configurable via g:ranger_mappings)
  - **Verify**: Vim integration works, plugin loads correctly

---

## Phase 3.4: Integration

- [ ] **T032** Connect all components in main workflow
  - Test complete file explorer workflow end-to-end
  - Verify tree building from file system
  - Verify file operations update tree state
  - Verify search filtering works correctly
  - Verify UI updates in response to state changes
  - **Verify**: All integration tests T010-T020 PASS

- [ ] **T033** Add error handling and user feedback
  - Wrap file system operations in try-catch
  - Display user-friendly error messages via notify()
  - Handle permission errors gracefully
  - Handle non-existent paths gracefully
  - Add confirmation for destructive operations
  - **Verify**: Error scenarios handled correctly

- [ ] **T034** Performance validation for large directories
  - Test with 1,000 files in single directory (quickstart)
  - Verify no performance degradation (FR-029)
  - Verify search completes <100ms (FR-030)
  - Profile synchronous operations if needed
  - **Verify**: Performance requirements met

---

## Phase 3.5: Polish

- [ ] **T035** [P] Unit tests for tree node utilities in `tests/unit/tree-node.test.ts`
  - Test createFileNode with various file types
  - Test createDirectoryNode with edge cases
  - Test node sorting logic
  - Test hidden file detection
  - **Verify**: All unit tests PASS

- [ ] **T036** [P] Unit tests for state management in `tests/unit/tree-state.test.ts`
  - Test TreeState creation
  - Test state updates (cursor, search, showHidden)
  - Test state immutability
  - **Verify**: All unit tests PASS

- [ ] **T037** [P] Unit tests for search logic in `tests/unit/search.test.ts`
  - Test case-insensitive matching
  - Test empty query handling
  - Test special characters in search
  - Test performance with large node sets
  - **Verify**: All unit tests PASS

- [ ] **T038** Execute complete quickstart validation
  - Run all 16 quickstart test scenarios manually
  - Verify each acceptance criteria
  - Test on both macOS and Linux
  - Document any issues found
  - **Verify**: All quickstart scenarios PASS

- [ ] **T039** [P] Update documentation
  - Create README.md with installation instructions
  - Document keybindings and configuration
  - Add usage examples
  - Document constitutional constraints (synchronous only)
  - **Verify**: Documentation complete and accurate

- [ ] **T040** Code cleanup and refactoring
  - Remove any dead code
  - Ensure consistent naming conventions
  - Verify TypeScript strict mode compliance
  - Run Deno formatter on all files
  - Remove duplication where possible
  - **Verify**: Code quality checks pass

- [ ] **T041** Final constitutional compliance audit
  - Verify NO async/await anywhere in codebase
  - Verify all Deno APIs use *Sync variants
  - Verify all denops calls are synchronous
  - Verify no promises or callbacks
  - Review against constitution.md
  - **Verify**: 100% constitutional compliance

---

## Dependencies

**Critical Path**:
1. Setup (T001-T003) → Everything
2. Contract Tests (T004-T009) → Core Implementation
3. Integration Tests (T010-T020) → Core Implementation
4. Models (T021-T023) → Services (T024-T027)
5. Services (T024-T027) → UI (T028-T029)
6. UI (T028-T029) → Main Entry (T030-T031)
7. Main Entry (T030-T031) → Integration (T032-T034)
8. Integration (T032-T034) → Polish (T035-T041)

**Blocking Relationships**:
- T021 (types) blocks T022, T023, T024, T025, T026, T027, T028, T029
- T024-T027 (services) block T028-T029 (UI)
- T028-T029 (UI) block T030 (main entry)
- T030 (main entry) blocks T032-T034 (integration)
- All implementation blocks polish (T035-T041)

**Parallel Opportunities**:
- T004-T009: All contract tests (6 parallel)
- T010-T020: All integration tests (11 parallel)
- T021-T023: All model implementations (3 parallel)
- T035-T037, T039: Unit tests and docs (4 parallel)

---

## Parallel Execution Examples

### Contract Tests (Phase 3.2)
```bash
# Launch T004-T009 together (6 parallel tasks):
Task: "Contract test for types.ts in tests/contract/types.test.ts"
Task: "Contract test for file-system-api.ts in tests/contract/file-system-api.test.ts"
Task: "Contract test for tree-api.ts in tests/contract/tree-api.test.ts"
Task: "Contract test for search-api.ts in tests/contract/search-api.test.ts"
Task: "Contract test for ui-api.ts in tests/contract/ui-api.test.ts"
Task: "Contract test for system-api.ts in tests/contract/system-api.test.ts"
```

### Integration Tests (Phase 3.2)
```bash
# Launch T010-T020 together (11 parallel tasks):
Task: "Integration test: Open tree in tests/integration/open-tree.test.ts"
Task: "Integration test: Expand/collapse in tests/integration/expand-collapse.test.ts"
Task: "Integration test: Navigate in tests/integration/navigate.test.ts"
Task: "Integration test: Open file in tests/integration/open-file.test.ts"
Task: "Integration test: Toggle hidden in tests/integration/toggle-hidden.test.ts"
Task: "Integration test: Search in tests/integration/search.test.ts"
Task: "Integration test: Create file in tests/integration/create-file.test.ts"
Task: "Integration test: Rename in tests/integration/rename.test.ts"
Task: "Integration test: Copy/move in tests/integration/copy-move.test.ts"
Task: "Integration test: Delete in tests/integration/delete.test.ts"
Task: "Integration test: System app in tests/integration/system-app.test.ts"
```

### Model Implementation (Phase 3.3)
```bash
# Launch T021-T023 together (3 parallel tasks):
Task: "Implement types in src/models/types.ts"
Task: "Implement TreeNode utilities in src/models/tree-node.ts"
Task: "Implement TreeState manager in src/models/tree-state.ts"
```

### Polish Tasks (Phase 3.5)
```bash
# Launch T035-T037, T039 together (4 parallel tasks):
Task: "Unit tests for tree node in tests/unit/tree-node.test.ts"
Task: "Unit tests for state in tests/unit/tree-state.test.ts"
Task: "Unit tests for search in tests/unit/search.test.ts"
Task: "Update documentation in README.md and docs/"
```

---

## Notes

- **[P] tasks**: Different files, no dependencies, safe to run in parallel
- **Constitutional requirement**: ALL code MUST be synchronous (no async/await)
- **TDD workflow**: Verify tests FAIL before implementing
- **Performance targets**: <100ms search, 1,000 files support
- **Platform support**: macOS and Linux only
- Commit after each task or logical group
- Avoid: async patterns, vague tasks, same-file conflicts

---

## Validation Checklist
*GATE: Checked before marking tasks complete*

- [x] All contracts have corresponding tests (T004-T009)
- [x] All entities have model tasks (T021-T023)
- [x] All tests come before implementation (T004-T020 before T021-T031)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] All tasks support synchronous execution (constitutional requirement)
- [x] Performance requirements addressed (T034, T037)
- [x] Platform requirements covered (macOS/Linux in T020, T027)

---

**Task Generation Complete**: 41 tasks ready for execution
**Estimated Effort**: 3-5 days for experienced TypeScript/Neovim developer
**Next Step**: Begin execution with T001 (Setup)
