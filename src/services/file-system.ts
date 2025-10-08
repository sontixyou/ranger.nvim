/**
 * File System Operations Service
 *
 * Synchronous file system operations for the file explorer.
 * All operations use Deno's *Sync APIs to maintain constitutional compliance.
 *
 * Functional Requirements:
 * - FR-009, FR-009a: File creation with duplicate check
 * - FR-010: Directory creation
 * - FR-011, FR-012, FR-012a: Delete operations
 * - FR-013, FR-014: Rename operations
 * - FR-015, FR-016: Copy operations
 * - FR-017, FR-018: Move operations
 */

/**
 * Create a new file at the specified path.
 *
 * @param path - Absolute path where file should be created
 * @param content - Initial file content (default: empty string)
 * @returns The absolute path of the created file
 * @throws Error if file already exists (FR-009a)
 * @throws Error if parent directory doesn't exist
 * @throws Error if insufficient permissions
 */
export function createFile(path: string, content = ""): string {
  // Check if file already exists (FR-009a)
  try {
    Deno.statSync(path);
    throw new Error(`File already exists: ${path}`);
  } catch (error) {
    // File doesn't exist - this is expected
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  // Create the file
  Deno.writeTextFileSync(path, content);
  return path;
}

/**
 * Create a new directory at the specified path.
 *
 * @param path - Absolute path where directory should be created
 * @param recursive - Whether to create parent directories (default: false)
 * @returns The absolute path of the created directory
 * @throws Error if directory already exists (FR-009a)
 * @throws Error if parent doesn't exist and recursive=false
 * @throws Error if insufficient permissions
 */
export function createDirectory(path: string, recursive = false): string {
  // Check if directory already exists (FR-009a)
  try {
    Deno.statSync(path);
    throw new Error(`Directory already exists: ${path}`);
  } catch (error) {
    // Directory doesn't exist - this is expected
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  // Create the directory
  Deno.mkdirSync(path, { recursive });
  return path;
}

/**
 * Delete a file from the file system.
 *
 * @param path - Absolute path of file to delete
 * @returns The path of the deleted file
 * @throws Error if path doesn't exist
 * @throws Error if path is a directory (use deleteDirectory instead)
 * @throws Error if insufficient permissions
 */
export function deleteFile(path: string): string {
  const stat = Deno.statSync(path);

  if (stat.isDirectory) {
    throw new Error(`Path is a directory, use deleteDirectory instead: ${path}`);
  }

  Deno.removeSync(path);
  return path;
}

/**
 * Delete a directory from the file system.
 *
 * @param path - Absolute path of directory to delete
 * @param recursive - Whether to delete non-empty directories
 * @returns The path of the deleted directory
 * @throws Error if path doesn't exist
 * @throws Error if path is a file (use deleteFile instead)
 * @throws Error if directory is non-empty and recursive=false
 * @throws Error if insufficient permissions
 *
 * Note: For non-empty directories, caller must confirm before setting recursive=true (FR-012a)
 */
export function deleteDirectory(path: string, recursive = false): string {
  const stat = Deno.statSync(path);

  if (stat.isFile) {
    throw new Error(`Path is a file, use deleteFile instead: ${path}`);
  }

  Deno.removeSync(path, { recursive });
  return path;
}

/**
 * Rename a file or directory.
 *
 * @param oldPath - Current absolute path
 * @param newPath - New absolute path
 * @returns The new path
 * @throws Error if oldPath doesn't exist
 * @throws Error if newPath already exists
 * @throws Error if insufficient permissions
 */
export function rename(oldPath: string, newPath: string): string {
  // Check if old path exists
  Deno.statSync(oldPath);

  // Check if new path already exists
  try {
    Deno.statSync(newPath);
    throw new Error(`Destination already exists: ${newPath}`);
  } catch (error) {
    // New path doesn't exist - this is expected
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  Deno.renameSync(oldPath, newPath);
  return newPath;
}

/**
 * Copy a file to a new location.
 *
 * @param source - Absolute path of file to copy
 * @param destination - Absolute path of destination
 * @returns The destination path
 * @throws Error if source doesn't exist
 * @throws Error if source is a directory (use copyDirectory instead)
 * @throws Error if destination already exists
 * @throws Error if insufficient permissions
 */
export function copyFile(source: string, destination: string): string {
  const stat = Deno.statSync(source);

  if (stat.isDirectory) {
    throw new Error(`Source is a directory, use copyDirectory instead: ${source}`);
  }

  // Check if destination already exists
  try {
    Deno.statSync(destination);
    throw new Error(`Destination already exists: ${destination}`);
  } catch (error) {
    // Destination doesn't exist - this is expected
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  Deno.copyFileSync(source, destination);
  return destination;
}

/**
 * Copy a directory to a new location (recursive).
 *
 * @param source - Absolute path of directory to copy
 * @param destination - Absolute path of destination
 * @returns The destination path
 * @throws Error if source doesn't exist
 * @throws Error if source is a file (use copyFile instead)
 * @throws Error if destination already exists
 * @throws Error if insufficient permissions
 */
export function copyDirectory(source: string, destination: string): string {
  const stat = Deno.statSync(source);

  if (stat.isFile) {
    throw new Error(`Source is a file, use copyFile instead: ${source}`);
  }

  // Check if destination already exists
  try {
    Deno.statSync(destination);
    throw new Error(`Destination already exists: ${destination}`);
  } catch (error) {
    // Destination doesn't exist - this is expected
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  // Create destination directory
  Deno.mkdirSync(destination);

  // Copy all children recursively
  for (const entry of Deno.readDirSync(source)) {
    const sourcePath = `${source}/${entry.name}`;
    const destPath = `${destination}/${entry.name}`;

    if (entry.isDirectory) {
      copyDirectory(sourcePath, destPath);
    } else {
      Deno.copyFileSync(sourcePath, destPath);
    }
  }

  return destination;
}

/**
 * Move a file to a new location.
 *
 * @param source - Absolute path of file to move
 * @param destination - Absolute path of destination
 * @returns The destination path
 * @throws Error if source doesn't exist
 * @throws Error if source is a directory (use moveDirectory instead)
 * @throws Error if destination already exists
 * @throws Error if insufficient permissions
 */
export function moveFile(source: string, destination: string): string {
  const stat = Deno.statSync(source);

  if (stat.isDirectory) {
    throw new Error(`Source is a directory, use moveDirectory instead: ${source}`);
  }

  return rename(source, destination);
}

/**
 * Move a directory to a new location.
 *
 * @param source - Absolute path of directory to move
 * @param destination - Absolute path of destination
 * @returns The destination path
 * @throws Error if source doesn't exist
 * @throws Error if source is a file (use moveFile instead)
 * @throws Error if destination already exists
 * @throws Error if insufficient permissions
 */
export function moveDirectory(source: string, destination: string): string {
  const stat = Deno.statSync(source);

  if (stat.isFile) {
    throw new Error(`Source is a file, use moveFile instead: ${source}`);
  }

  return rename(source, destination);
}

/**
 * Check if a path exists in the file system.
 *
 * @param path - Absolute path to check
 * @returns true if path exists, false otherwise
 */
export function exists(path: string): boolean {
  try {
    Deno.statSync(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

/**
 * Check if a path is a directory.
 *
 * @param path - Absolute path to check
 * @returns true if path is a directory, false otherwise
 * @throws Error if path doesn't exist
 */
export function isDirectory(path: string): boolean {
  const stat = Deno.statSync(path);
  return stat.isDirectory;
}
