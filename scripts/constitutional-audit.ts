/**
 * Constitutional Compliance Audit Script
 *
 * Verifies that the codebase strictly adheres to the constitutional principle:
 * "Synchronous Execution Only (NON-NEGOTIABLE)"
 *
 * Checks:
 * 1. NO async/await anywhere in services/models (denops dispatcher is allowed)
 * 2. All Deno APIs use *Sync variants
 * 3. No promises or callbacks in business logic
 *
 * Usage: deno run --allow-read scripts/constitutional-audit.ts
 */

console.log("Constitutional Compliance Audit");
console.log("================================\n");

const violations: string[] = [];
let filesChecked = 0;

/**
 * Check a file for constitutional violations
 */
async function auditFile(path: string): Promise<void> {
  filesChecked++;
  const content = await Deno.readTextFile(path);
  const lines = content.split("\n");

  // Skip denops/ranger/main.ts and src/ui/ - these use async for denops API
  if (
    path.includes("denops/ranger/main.ts") ||
    path.includes("src/ui/")
  ) {
    console.log(`✓ ${path} (denops async allowed)`);
    return;
  }

  // Check for async/await in business logic
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check for async functions
    if (line.match(/async\s+function/) && !line.includes("//")) {
      violations.push(
        `${path}:${lineNum} - async function found (not allowed in business logic)`,
      );
    }

    // Check for await keyword
    if (line.match(/\bawait\b/) && !line.includes("//")) {
      violations.push(
        `${path}:${lineNum} - await keyword found (not allowed in business logic)`,
      );
    }

    // Check for Promise usage
    if (line.match(/:\s*Promise</) && !line.includes("//")) {
      violations.push(
        `${path}:${lineNum} - Promise type found (not allowed in business logic)`,
      );
    }

    // Check for callback patterns
    if (line.match(/callback\s*:/i) && !line.includes("//")) {
      violations.push(
        `${path}:${lineNum} - callback pattern found (not allowed)`,
      );
    }

    // Check for Deno async APIs (should be *Sync)
    if (line.match(/Deno\.(readFile|writeFile|readDir|mkdir|remove|stat|rename|copyFile)\(/) && !line.includes("Sync")) {
      violations.push(
        `${path}:${lineNum} - Async Deno API found (must use *Sync variant)`,
      );
    }
  }

  if (violations.some((v) => v.startsWith(path))) {
    console.log(`✗ ${path} - VIOLATIONS FOUND`);
  } else {
    console.log(`✓ ${path}`);
  }
}

/**
 * Recursively find all TypeScript files
 */
async function* walkFiles(dir: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(dir)) {
    const fullPath = `${dir}/${entry.name}`;

    if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      yield* walkFiles(fullPath);
    } else if (entry.isFile && entry.name.endsWith(".ts")) {
      yield fullPath;
    }
  }
}

// Audit all TypeScript files
console.log("Auditing TypeScript files...\n");

for await (const file of walkFiles("src")) {
  await auditFile(file);
}

for await (const file of walkFiles("denops")) {
  await auditFile(file);
}

// Check for specific constitutional requirements
console.log("\nConstitutional Requirements Check");
console.log("----------------------------------");

// Check that file-system.ts uses *Sync APIs
const fileSystemContent = await Deno.readTextFile("src/services/file-system.ts");
const syncApiChecks = [
  { api: "statSync", found: fileSystemContent.includes("statSync") },
  { api: "writeTextFileSync", found: fileSystemContent.includes("writeTextFileSync") },
  { api: "mkdirSync", found: fileSystemContent.includes("mkdirSync") },
  { api: "removeSync", found: fileSystemContent.includes("removeSync") },
  { api: "renameSync", found: fileSystemContent.includes("renameSync") },
  { api: "copyFileSync", found: fileSystemContent.includes("copyFileSync") },
];

let allSyncApisUsed = true;
for (const check of syncApiChecks) {
  if (check.found) {
    console.log(`✓ Using Deno.${check.api}`);
  } else {
    console.log(`✗ Missing Deno.${check.api}`);
    allSyncApisUsed = false;
  }
}

// Check tree-builder.ts uses readDirSync
const treeBuilderContent = await Deno.readTextFile("src/services/tree-builder.ts");
if (treeBuilderContent.includes("readDirSync")) {
  console.log("✓ Using Deno.readDirSync in tree-builder");
} else {
  console.log("✗ Missing Deno.readDirSync in tree-builder");
  allSyncApisUsed = false;
}

// Check system-app.ts uses outputSync
const systemAppContent = await Deno.readTextFile("src/services/system-app.ts");
if (systemAppContent.includes("outputSync")) {
  console.log("✓ Using Deno.Command().outputSync() in system-app");
} else {
  console.log("✗ Missing Deno.Command().outputSync() in system-app");
  allSyncApisUsed = false;
}

// Summary
console.log("\n" + "=".repeat(50));
console.log("AUDIT SUMMARY");
console.log("=".repeat(50));
console.log(`Files checked: ${filesChecked}`);
console.log(`Violations found: ${violations.length}`);

if (violations.length > 0) {
  console.log("\nVIOLATIONS:");
  for (const violation of violations) {
    console.log(`  ✗ ${violation}`);
  }
}

console.log("\nConstitutional Requirements:");
console.log(`  Sync APIs: ${allSyncApisUsed ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  No async/await in business logic: ${violations.length === 0 ? "✓ PASS" : "✗ FAIL"}`);

// Final verdict
if (violations.length === 0 && allSyncApisUsed) {
  console.log("\n✅ CONSTITUTIONAL COMPLIANCE: PASS");
  console.log("All code adheres to the synchronous-only principle.");
  Deno.exit(0);
} else {
  console.log("\n❌ CONSTITUTIONAL COMPLIANCE: FAIL");
  console.log("Code violates the synchronous-only constitutional requirement.");
  Deno.exit(1);
}
