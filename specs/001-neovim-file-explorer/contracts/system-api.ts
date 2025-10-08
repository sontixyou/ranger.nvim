/**
 * System Integration API Contract
 *
 * Defines system application launch functionality.
 * All functions must execute synchronously.
 *
 * Corresponds to Functional Requirements:
 * - FR-024: Open with system app
 * - FR-025: macOS and Linux support
 */

/**
 * Open a file with the operating system's default application.
 *
 * @param path - Absolute path to file to open
 * @throws Error if path doesn't exist
 * @throws Error if path is a directory
 * @throws Error if system command fails (e.g., no default app)
 * @throws Error if platform is not macOS or Linux
 *
 * Implementation:
 * - macOS: Uses `open` command
 * - Linux: Uses `xdg-open` command
 * - Child process spawned detached (doesn't block Neovim)
 */
export function openWithSystemApp(path: string): void;

/**
 * Detect current operating system platform.
 *
 * @returns "darwin" for macOS, "linux" for Linux
 * @throws Error if platform is not supported (e.g., Windows)
 */
export function detectPlatform(): "darwin" | "linux";
