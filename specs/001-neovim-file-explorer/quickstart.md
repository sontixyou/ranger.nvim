# Quickstart: Neovim File Explorer Tree

**Feature**: 001-neovim-file-explorer
**Date**: 2025-10-06
**Purpose**: Validate primary user story through end-to-end testing

## Overview
This quickstart validates the core file explorer workflow: opening the tree, navigating files and directories, performing file operations, and searching. It corresponds to the Primary User Story from spec.md.

## Prerequisites
- Neovim 0.8+ installed
- denops.vim installed
- Deno runtime installed (for denops.vim)
- Test directory with sample files and directories

## Test Scenario

### Primary User Story Validation

**As a Neovim user, I want to browse and manage my project files in a tree structure within my editor, so that I can navigate the file system and perform file operations without leaving my editing environment.**

### Setup
```bash
# Create test directory structure
mkdir -p /tmp/ranger-test/src/models
mkdir -p /tmp/ranger-test/src/services
mkdir -p /tmp/ranger-test/.git
touch /tmp/ranger-test/README.md
touch /tmp/ranger-test/src/main.ts
touch /tmp/ranger-test/src/models/user.ts
touch /tmp/ranger-test/src/services/api.ts
touch /tmp/ranger-test/.gitignore

cd /tmp/ranger-test
nvim
```

### Test Steps

#### 1. Open File Explorer Tree (FR-001, FR-002)
```vim
:RangerOpen
```

**Expected**:
- Tree buffer opens in current window or split
- Displays directory tree starting from `/tmp/ranger-test`
- Shows directories (📁) and files (📄) with indentation
- Hidden files (.git, .gitignore) are NOT visible initially

**Validation**:
```
📁 src
📄 README.md
```

---

#### 2. Expand Directory (FR-005)
**Action**: Navigate to "src" directory, press `<CR>` or `<Tab>`

**Expected**:
- "src" directory expands
- Shows child directories (models, services) and files (main.ts)
- Maintains tree structure with proper indentation

**Validation**:
```
📁 src (expanded)
  📁 models
  📁 services
  📄 main.ts
📄 README.md
```

---

#### 3. Navigate Tree (FR-007)
**Action**: Use `j`/`k` keys to move cursor up and down the tree

**Expected**:
- Cursor moves between visible tree lines
- Cursor highlights current line
- Navigation is immediate (no lag)

---

#### 4. Open File (FR-008)
**Action**: Navigate to "README.md", press `<CR>`

**Expected**:
- README.md opens in a Neovim buffer
- File content is editable
- Tree buffer remains accessible (via buffer switching or window)

---

#### 5. Toggle Hidden Files (FR-022)
**Action**: In tree buffer, press `H`

**Expected**:
- Hidden files (.git, .gitignore) now visible in tree
- Tree updates to show:
```
📁 .git
📁 src (expanded)
  📁 models
  📁 services
  📄 main.ts
📄 .gitignore
📄 README.md
```

**Action**: Press `H` again

**Expected**:
- Hidden files disappear from tree
- Returns to original view

---

#### 6. Search Files (FR-019, FR-020, FR-021)
**Action**: Press `/`, type "user"

**Expected**:
- Search activates interactively as you type
- Matching files highlighted or filtered
- Tree shows only matching paths:
```
📁 src
  📁 models
    📄 user.ts (highlighted/visible)
```

**Performance**: Results appear within 100ms of typing (FR-030)

**Action**: Clear search (ESC or clear input)

**Expected**:
- Tree returns to full view
- Expansion states preserved

---

#### 7. Create File (FR-009)
**Action**: Navigate to "src" directory, press `a`, enter "config.ts"

**Expected**:
- Prompt appears: "Create file: "
- After entering name, file "config.ts" is created in /tmp/ranger-test/src/
- Tree updates to show new file:
```
📁 src
  📄 config.ts (new)
  📄 main.ts
  📁 models
  📁 services
```

---

#### 8. Create Duplicate File (FR-009a)
**Action**: Press `a` again, try to create "config.ts" again

**Expected**:
- Error message: "File already exists: config.ts"
- No file created
- Tree unchanged

---

#### 9. Rename File (FR-013)
**Action**: Navigate to "config.ts", press `r`, enter "settings.ts"

**Expected**:
- Prompt appears: "Rename to: " (default: "config.ts")
- After entering new name, file renamed to "settings.ts"
- Tree updates:
```
📁 src
  📄 main.ts
  📁 models
  📁 services
  📄 settings.ts
```

---

#### 10. Copy File (FR-015)
**Action**: Navigate to "README.md", press `c`, select destination "src/"

**Expected**:
- Prompt for destination appears
- File copied to /tmp/ranger-test/src/README.md
- Tree updates to show copy in src/

---

#### 11. Delete File (FR-011)
**Action**: Navigate to "src/README.md", press `d`

**Expected**:
- Confirmation prompt appears: "Delete file: src/README.md? (y/n)"
- After confirming (y), file is deleted
- Tree updates, file removed from view

---

#### 12. Create Directory (FR-010)
**Action**: Navigate to "src", press `a`, enter "utils/" (trailing slash indicates directory)

**Expected**:
- Directory "utils" created in /tmp/ranger-test/src/
- Tree updates to show new directory:
```
📁 src
  📁 models
  📁 services
  📁 utils (new)
  📄 main.ts
  📄 settings.ts
```

---

#### 13. Delete Non-Empty Directory (FR-012, FR-012a)
**Action**: Navigate to "src", press `d`

**Expected**:
- Confirmation prompt: "Directory is not empty. Delete recursively? (y/n)"
- If yes: All contents deleted recursively, tree updates
- If no: Operation cancelled, tree unchanged

---

#### 14. Move Directory (FR-018)
**Action**: Navigate to "src/models", press `x` (cut), navigate to "src/utils", press `p` (paste)

**Expected**:
- "models" directory moved to "src/utils/models"
- Tree updates:
```
📁 src
  📁 services
  📁 utils
    📁 models (moved)
  📄 main.ts
  📄 settings.ts
```

---

#### 15. Open File with System App (FR-024, FR-025)
**Action**: Navigate to "README.md", press `s`

**Expected**:
- File opens in system default text editor (e.g., TextEdit on macOS, gedit on Linux)
- Neovim remains responsive (process spawned detached)
- No error if system app launch succeeds

**Platform**: Verify on both macOS and Linux

---

#### 16. Collapse Directory (FR-006)
**Action**: Navigate to expanded "src" directory, press `<CR>` or `za`

**Expected**:
- "src" directory collapses
- Child entries (models, services, etc.) hidden
- Tree shows:
```
📁 src (collapsed)
📄 README.md
```

---

## Success Criteria

All test steps complete without errors:
- ✓ Tree displays correctly with proper icons and indentation
- ✓ Expand/collapse operations work
- ✓ Navigation is responsive
- ✓ File open in Neovim works
- ✓ Hidden file toggle works
- ✓ Search is interactive and fast (<100ms)
- ✓ File/directory creation works
- ✓ Duplicate file creation fails with error
- ✓ Rename operation works
- ✓ Copy operation works
- ✓ Delete operations work (file and directory)
- ✓ Non-empty directory delete prompts for confirmation
- ✓ Move operation works
- ✓ System app launch works (macOS/Linux)
- ✓ All operations update tree view in real-time

## Performance Validation

**Directory with 1,000 files** (FR-029):
```bash
# Create large test directory
mkdir -p /tmp/large-test
for i in {1..1000}; do touch /tmp/large-test/file$i.txt; done

cd /tmp/large-test
nvim
:RangerOpen
```

**Expected**:
- Tree loads without lag
- Expand/collapse operations are immediate
- Navigation remains responsive
- Search completes within 100ms

## Cleanup
```bash
rm -rf /tmp/ranger-test /tmp/large-test
```

---

**Quickstart Status**: ✓ READY FOR TESTING
**Next Phase**: Implementation (/tasks command will generate tasks.md)
