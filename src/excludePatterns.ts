import * as path from "path";

/**
 * Convert a VS Code-style glob to a RegExp.
 * Supports *, **, ? and literal characters. Invalid patterns return null.
 */
export function globToRegExp(pattern: string): RegExp | null {
  const trimmed = pattern.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/\\/g, "/");
  let source = "";
  let i = 0;

  while (i < normalized.length) {
    const char = normalized[i];

    if (char === "*" && normalized[i + 1] === "*") {
      if (normalized[i + 2] === "/") {
        source += "(?:.*/)?";
        i += 3;
      } else {
        source += ".*";
        i += 2;
      }
      continue;
    }

    if (char === "*") {
      source += "[^/]*";
      i += 1;
      continue;
    }

    if (char === "?") {
      source += "[^/]";
      i += 1;
      continue;
    }

    if ("\\.[]{}()+-^$|".includes(char)) {
      source += `\\${char}`;
      i += 1;
      continue;
    }

    source += char;
    i += 1;
  }

  try {
    return new RegExp(`^${source}$`, "i");
  } catch {
    return null;
  }
}

export function compileExcludePatterns(patterns: readonly string[]): RegExp[] {
  const compiled: RegExp[] = [];
  for (const pattern of patterns) {
    if (typeof pattern !== "string") {
      continue;
    }
    const regex = globToRegExp(pattern);
    if (regex) {
      compiled.push(regex);
    }
  }
  return compiled;
}

/**
 * Returns true when the file path matches any compiled exclude pattern.
 * Matches against POSIX-normalized full path, relative path (if provided), and basename.
 */
export function isPathExcluded(
  filePath: string,
  patterns: readonly RegExp[],
  relativePath?: string
): boolean {
  if (patterns.length === 0) {
    return false;
  }

  const normalized = filePath.replace(/\\/g, "/");
  const baseName = path.posix.basename(normalized);
  const relative = relativePath?.replace(/\\/g, "/");

  for (const pattern of patterns) {
    if (
      pattern.test(normalized) ||
      pattern.test(baseName) ||
      (relative !== undefined && relative.length > 0 && pattern.test(relative))
    ) {
      return true;
    }
  }

  return false;
}

export function normalizeExcludePatterns(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map(item => item.trim())
    .filter(Boolean);
}
