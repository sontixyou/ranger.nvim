<!--
Sync Impact Report:
Version: None → 1.0.0 (initial constitution)
Rationale: Initial constitution creation with project-specific principles
Modified principles: N/A (new constitution)
Added sections:
  - Core Principles (2 principles)
  - Runtime Constraints
  - Governance
Removed sections: N/A
Templates requiring updates:
  ✅ plan-template.md - Constitution Check section exists, ready for validation
  ✅ spec-template.md - No changes needed (implementation-agnostic)
  ✅ tasks-template.md - No changes needed (general task structure)
Follow-up TODOs: None
-->

# Neovim File Explorer Tree Constitution

## Core Principles

### I. Synchronous Execution Only (NON-NEGOTIABLE)
All code MUST execute synchronously. Asynchronous operations (promises, async/await,
callbacks, event loops) are strictly prohibited. Every function call MUST complete
before returning control to the caller.

**Rationale**: This ensures predictable execution flow, simplified debugging, and
eliminates race conditions. Neovim's denops.vim operates in a synchronous model, and
this principle ensures compatibility and maintainability.

### II. Neovim Runtime Environment
All functionality MUST operate within the Neovim editor environment. The plugin MUST
use denops.vim as the bridge between TypeScript and Neovim. No standalone processes
or external runtime dependencies beyond Neovim and denops.vim are permitted.

**Rationale**: This ensures the file explorer integrates seamlessly with the user's
Neovim workflow, sharing the same process space and configuration context. It also
minimizes external dependencies as specified in project requirements.

## Runtime Constraints

### Technology Stack
- **Language**: TypeScript
- **Testing Framework**: vitest
- **Required Dependencies**: denops.vim, vite
- **Dependency Policy**: Minimize external library dependencies. Prefer native
  implementations over third-party packages unless the library provides significant
  value and is well-maintained.

### Platform Support
- **Operating Systems**: macOS and Linux
- **Neovim Version**: Compatible with denops.vim requirements (Neovim 0.8+)

### Performance Standards
- **Directory Handling**: MUST support up to 1,000 files per directory without
  performance degradation
- **Search Latency**: Search results MUST appear within 100ms of user input
- **UI Responsiveness**: All tree operations (expand, collapse, navigate) MUST
  complete without blocking the Neovim UI

## Governance

### Amendment Process
This constitution supersedes all other development practices and guidelines.
Amendments require:
1. Clear documentation of the proposed change and rationale
2. Validation that existing code/tests remain compatible or migration plan provided
3. Update of all dependent templates and documentation

### Compliance
- All pull requests MUST verify compliance with constitutional principles
- Any deviation from principles MUST be explicitly justified in code comments
  and approved during review
- Complexity introduced MUST be justified against simpler alternatives

### Version Control
Constitutional changes follow semantic versioning:
- **MAJOR**: Backward-incompatible principle removals or redefinitions
- **MINOR**: New principles added or materially expanded guidance
- **PATCH**: Clarifications, wording improvements, non-semantic refinements

**Version**: 1.0.0 | **Ratified**: 2025-10-06 | **Last Amended**: 2025-10-06
