/**
 * File System Operations API Contract
 *
 * Defines synchronous file system operations for the file explorer.
 * All functions must execute synchronously (no async/await).
 *
 * Corresponds to Functional Requirements:
 * - FR-009, FR-009a: File creation
 * - FR-010: Directory creation
 * - FR-011, FR-012, FR-012a: Delete operations
 * - FR-013, FR-014: Rename operations
 * - FR-015, FR-016: Copy operations
 * - FR-017, FR-018: Move operations
 */

import { FileOperation } from "./types.ts";

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
export function createFile(path: string, content?: string): string;

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
export function createDirectory(path: string, recursive?: boolean): string;

/**
 * Delete a file from the file system.
 *
 * @param path - Absolute path of file to delete
 * @returns The path of the deleted file
 * @throws Error if path doesn't exist
 * @throws Error if path is a directory (use deleteDirectory instead)
 * @throws Error if insufficient permissions
 */
export function deleteFile(path: string): string;

/**
 * Delete a directory from the file system.
 *
 * @param path - Absolute path of directory to delete
 * @param recursive - Whether to delete non-empty directories (requires confirmation)
 * @returns The path of the deleted directory
 * @throws Error if path doesn't exist
 * @throws Error if path is a file (use deleteFile instead)
 * @throws Error if directory is non-empty and recursive=false
 * @throws Error if insufficient permissions
 *
 * Note: For non-empty directories, caller must confirm before setting recursive=true (FR-012a)
 */
export function deleteDirectory(path: string, recursive?: boolean): string;

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
export function rename(oldPath: string, newPath: string): string;

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
export function copyFile(source: string, destination: string): string;

/**
 * Copy a directory to a new location.
 *
 * @param source - Absolute path of directory to copy
 * @param destination - Absolute path of destination
 * @returns The destination path
 * @throws Error if source doesn't exist
 * @throws Error if source is a file (use copyFile instead)
 * @throws Error if destination already exists
 * @throws Error if insufficient permissions
 *
 * Note: Recursively copies all children
 */
export function copyDirectory(source: string, destination: string): string;

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
export function moveFile(source: string, destination: string): string;

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
export function moveDirectory(source: string, destination: string): string;

/**
 * Check if a path exists in the file system.
 *
 * @param path - Absolute path to check
 * @returns true if path exists, false otherwise
 */
export function exists(path: string): boolean;

/**
 * Check if a path is a directory.
 *
 * @param path - Absolute path to check
 * @returns true if path is a directory, false otherwise
 * @throws Error if path doesn't exist
 */
export function isDirectory(path: string): boolean;
