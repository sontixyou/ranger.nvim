/**
 * Contract test for ui-api.ts
 * Tests UI rendering and interaction function signatures
 *
 * EXPECTED: These tests will FAIL until src/ui/ modules are implemented (T028-T029)
 */

import { describe, it, expect, vi } from "npm:vitest@^1.0.0";
import type { Denops } from "denops_std/mod.ts";
import type { TreeNode, TreeState, DirectoryNode } from "../../src/models/types.ts";
import {
  createTreeBuffer,
  renderTreeToBuffer,
  formatNodeLine,
  setupKeybindings,
  getNodeAtCursor,
  setCursor,
  notify,
  confirm,
  input,
} from "../../src/ui/tree-renderer.ts";

// Mock Denops instance
const createMockDenops = (): Denops => ({
  name: "ranger",
  call: vi.fn(),
  cmd: vi.fn(),
  eval: vi.fn(),
  dispatch: vi.fn(),
  redraw: vi.fn(),
  dispatcher: {},
} as unknown as Denops);

describe("createTreeBuffer", () => {
  it("should return buffer number", () => {
    const denops = createMockDenops();
    vi.mocked(denops.call).mockResolvedValue(1);
    const bufnr = createTreeBuffer(denops);
    expect(typeof bufnr).toBe("number");
  });
});

describe("renderTreeToBuffer", () => {
  it("should return number of lines rendered", () => {
    const denops = createMockDenops();
    const nodes = [
      {
        node: {
          type: "file" as const,
          name: "test.ts",
          path: "/test.ts",
          hidden: false,
          fileType: "ts",
          size: 100,
          mtime: new Date(),
        },
        depth: 0,
      },
    ];

    const lineCount = renderTreeToBuffer(denops, 1, nodes, 0);
    expect(typeof lineCount).toBe("number");
    expect(lineCount).toBeGreaterThan(0);
  });

  it("should handle empty nodes array", () => {
    const denops = createMockDenops();
    const lineCount = renderTreeToBuffer(denops, 1, [], 0);
    expect(lineCount).toBe(0);
  });
});

describe("formatNodeLine", () => {
  it("should return formatted string", () => {
    const node: TreeNode = {
      type: "file",
      name: "test.ts",
      path: "/test.ts",
      hidden: false,
      fileType: "ts",
      size: 100,
      mtime: new Date(),
    };

    const line = formatNodeLine(node, 0);
    expect(typeof line).toBe("string");
    expect(line).toContain("test.ts");
  });

  it("should include indentation based on depth", () => {
    const node: TreeNode = {
      type: "file",
      name: "test.ts",
      path: "/test.ts",
      hidden: false,
      fileType: "ts",
      size: 100,
      mtime: new Date(),
    };

    const line0 = formatNodeLine(node, 0);
    const line2 = formatNodeLine(node, 2);
    expect(line2.length).toBeGreaterThan(line0.length);
  });

  it("should use directory icon for directories", () => {
    const node: TreeNode = {
      type: "directory",
      name: "src",
      path: "/src",
      hidden: false,
      expanded: false,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const line = formatNodeLine(node, 0);
    expect(line).toContain("📁");
  });

  it("should use file icon for files", () => {
    const node: TreeNode = {
      type: "file",
      name: "test.ts",
      path: "/test.ts",
      hidden: false,
      fileType: "ts",
      size: 100,
      mtime: new Date(),
    };

    const line = formatNodeLine(node, 0);
    expect(line).toContain("📄");
  });
});

describe("setupKeybindings", () => {
  it("should accept mappings object", () => {
    const denops = createMockDenops();
    const mappings = {
      "<CR>": "open",
      "a": "create",
      "d": "delete",
    };

    expect(() => setupKeybindings(denops, 1, mappings)).not.toThrow();
  });
});

describe("getNodeAtCursor", () => {
  it("should return TreeNode or null", () => {
    const denops = createMockDenops();
    const rootNode: DirectoryNode = {
      type: "directory",
      name: "root",
      path: "/root",
      hidden: false,
      expanded: true,
      children: [],
      childCount: 0,
      mtime: new Date(),
    };

    const state: TreeState = {
      rootPath: "/root",
      rootNode: rootNode,
      cursorLine: 0,
      showHidden: false,
      searchQuery: "",
      bufnr: 1,
    };

    const result = getNodeAtCursor(denops, state);
    expect(result === null || typeof result === "object").toBe(true);
  });
});

describe("setCursor", () => {
  it("should accept denops, buffer number, and line number", () => {
    const denops = createMockDenops();
    expect(() => setCursor(denops, 1, 5)).not.toThrow();
  });
});

describe("notify", () => {
  it("should accept message and level", () => {
    const denops = createMockDenops();
    expect(() => notify(denops, "Test message", "info")).not.toThrow();
    expect(() => notify(denops, "Warning", "warn")).not.toThrow();
    expect(() => notify(denops, "Error", "error")).not.toThrow();
  });
});

describe("confirm", () => {
  it("should return boolean", () => {
    const denops = createMockDenops();
    vi.mocked(denops.call).mockResolvedValue(1);
    const result = confirm(denops, "Are you sure?");
    expect(typeof result).toBe("boolean");
  });
});

describe("input", () => {
  it("should return string or null", () => {
    const denops = createMockDenops();
    vi.mocked(denops.call).mockResolvedValue("user input");
    const result = input(denops, "Enter filename:");
    expect(typeof result === "string" || result === null).toBe(true);
  });

  it("should accept optional default value", () => {
    const denops = createMockDenops();
    vi.mocked(denops.call).mockResolvedValue("default");
    const result = input(denops, "Enter name:", "default.txt");
    expect(result).toBeDefined();
  });
});
