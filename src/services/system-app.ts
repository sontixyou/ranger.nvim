/**
 * System Application Integration Service
 *
 * Functions for opening files with system default applications.
 * Supports macOS and Linux only.
 *
 * Functional Requirements:
 * - FR-024: Open with system app
 * - FR-025: macOS and Linux support
 *
 * Constitutional requirement: Synchronous execution using Deno.Command().outputSync()
 */

/**
 * Detect the current operating system platform.
 *
 * @returns "darwin" for macOS, "linux" for Linux
 * @throws Error if platform is not supported (e.g., Windows)
 */
export function detectPlatform(): "darwin" | "linux" {
  const os = Deno.build.os;

  if (os === "darwin" || os === "linux") {
    return os;
  }

  throw new Error(`Unsupported platform: ${os}. Only macOS and Linux are supported.`);
}

/**
 * Open a file with the operating system's default application.
 *
 * Uses platform-specific commands:
 * - macOS: `open` command
 * - Linux: `xdg-open` command
 *
 * The child process is spawned detached so it doesn't block Neovim,
 * but the spawn itself is synchronous (constitutional requirement).
 *
 * @param path - Absolute path to file to open
 * @throws Error if path doesn't exist
 * @throws Error if path is a directory
 * @throws Error if system command fails
 * @throws Error if platform is not macOS or Linux
 */
export function openWithSystemApp(path: string): void {
  // Verify path exists and is a file
  const stat = Deno.statSync(path);

  if (stat.isDirectory) {
    throw new Error(`Cannot open directory with system app: ${path}`);
  }

  // Detect platform and select appropriate command
  const platform = detectPlatform();
  const command = platform === "darwin" ? "open" : "xdg-open";

  // Spawn process synchronously (child runs detached)
  // Using outputSync() makes the spawn synchronous, but the child process
  // continues running independently after the spawn completes
  try {
    new Deno.Command(command, {
      args: [path],
      stdout: "null",
      stderr: "null",
    }).outputSync();
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(
        `System command '${command}' not found. Make sure it is installed and in PATH.`,
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to open file with system app: ${message}`);
  }
}
