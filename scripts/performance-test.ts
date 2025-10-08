/**
 * Performance Validation Script
 *
 * Tests the file explorer with 1,000 files to verify:
 * - FR-029: Support up to 1,000 files without performance degradation
 * - FR-030: Search completes within 100ms
 *
 * Usage: deno run --allow-read --allow-write scripts/performance-test.ts
 */

import { buildTree, getVisibleNodes } from "../src/services/tree-builder.ts";
import { createSearchQuery, executeSearch } from "../src/services/search.ts";

// Create a temporary directory with 1,000 files
const testDir = "/tmp/ranger-perf-test";

console.log("Performance Validation Test");
console.log("===========================\n");

// Clean up and create test directory
try {
  Deno.removeSync(testDir, { recursive: true });
} catch {
  // Directory doesn't exist, that's fine
}
Deno.mkdirSync(testDir, { recursive: true });

console.log(`Creating 1,000 test files in ${testDir}...`);
const startCreate = performance.now();

// Create 1,000 files with various extensions
for (let i = 0; i < 1000; i++) {
  const extension = ["txt", "md", "ts", "js", "json", "yaml"][i % 6];
  const filename = `file_${i.toString().padStart(4, "0")}.${extension}`;
  Deno.writeTextFileSync(`${testDir}/${filename}`, `Test file ${i}\n`);
}

const endCreate = performance.now();
console.log(`✓ Created 1,000 files in ${(endCreate - startCreate).toFixed(2)}ms\n`);

// Test 1: Tree building performance
console.log("Test 1: Tree Building Performance");
console.log("----------------------------------");

const startBuild = performance.now();
const tree = buildTree(testDir, false);
const endBuild = performance.now();

const buildTime = endBuild - startBuild;
console.log(`Tree built in ${buildTime.toFixed(2)}ms`);
console.log(`File count: ${tree.childCount}`);

if (buildTime < 500) {
  console.log("✓ PASS: Tree building is fast (<500ms)\n");
} else {
  console.log("✗ FAIL: Tree building is slow (>500ms)\n");
}

// Test 2: Visible nodes extraction
console.log("Test 2: Visible Nodes Extraction");
console.log("---------------------------------");

const startVisible = performance.now();
const visibleNodes = getVisibleNodes(tree, false);
const endVisible = performance.now();

const visibleTime = endVisible - startVisible;
console.log(`Visible nodes extracted in ${visibleTime.toFixed(2)}ms`);
console.log(`Visible node count: ${visibleNodes.length}`);

if (visibleTime < 100) {
  console.log("✓ PASS: Visible nodes extraction is fast (<100ms)\n");
} else {
  console.log("✗ FAIL: Visible nodes extraction is slow (>100ms)\n");
}

// Test 3: Search performance (FR-030: <100ms for 1,000 nodes)
console.log("Test 3: Search Performance (FR-030)");
console.log("------------------------------------");

const searchQueries = [
  "file_0500", // Single result
  "file", // All results
  ".ts", // Specific extension
  "999", // End of list
  "nonexistent", // No results
];

let allSearchesPassed = true;

for (const queryText of searchQueries) {
  const query = createSearchQuery(queryText);

  const startSearch = performance.now();
  const results = executeSearch(query, tree);
  const endSearch = performance.now();

  const searchTime = endSearch - startSearch;
  const passed = searchTime < 100;

  const status = passed ? "✓ PASS" : "✗ FAIL";
  console.log(
    `  "${queryText}": ${searchTime.toFixed(2)}ms (${results.matchedPaths.size} matches) ${status}`,
  );

  if (!passed) {
    allSearchesPassed = false;
  }
}

if (allSearchesPassed) {
  console.log("✓ PASS: All searches complete within 100ms (FR-030)\n");
} else {
  console.log("✗ FAIL: Some searches exceeded 100ms limit\n");
}

// Test 4: Memory usage (informational)
console.log("Test 4: Memory Usage (Informational)");
console.log("-------------------------------------");

const memUsage = Deno.memoryUsage();
console.log(`RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
console.log(`Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB\n`);

// Test 5: Sorting performance
console.log("Test 5: Node Sorting Performance");
console.log("---------------------------------");

const startSort = performance.now();
const sortedNodes = [...tree.children].sort((a, b) => {
  if (a.type !== b.type) {
    return a.type === "directory" ? -1 : 1;
  }
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
});
const endSort = performance.now();

const sortTime = endSort - startSort;
console.log(`1,000 nodes sorted in ${sortTime.toFixed(2)}ms`);

if (sortTime < 50) {
  console.log("✓ PASS: Sorting is fast (<50ms)\n");
} else {
  console.log("✗ FAIL: Sorting is slow (>50ms)\n");
}

// Summary
console.log("\nPerformance Validation Summary");
console.log("==============================");
console.log(`Tree Building: ${buildTime.toFixed(2)}ms ${buildTime < 500 ? "✓" : "✗"}`);
console.log(`Visible Nodes: ${visibleTime.toFixed(2)}ms ${visibleTime < 100 ? "✓" : "✗"}`);
console.log(`Search (FR-030): ${allSearchesPassed ? "✓ All <100ms" : "✗ Some >100ms"}`);
console.log(`Sorting: ${sortTime.toFixed(2)}ms ${sortTime < 50 ? "✓" : "✗"}`);

// Cleanup
console.log(`\nCleaning up test directory: ${testDir}`);
Deno.removeSync(testDir, { recursive: true });
console.log("✓ Cleanup complete");

// Exit with appropriate code
const allTestsPassed = buildTime < 500 && visibleTime < 100 && allSearchesPassed && sortTime < 50;
if (allTestsPassed) {
  console.log("\n✓ ALL PERFORMANCE TESTS PASSED");
  Deno.exit(0);
} else {
  console.log("\n✗ SOME PERFORMANCE TESTS FAILED");
  Deno.exit(1);
}
