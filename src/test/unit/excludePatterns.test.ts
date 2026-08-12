import { describe, expect, it } from "vitest";
import {
  compileExcludePatterns,
  globToRegExp,
  isPathExcluded,
  normalizeExcludePatterns,
} from "../../excludePatterns";

describe("excludePatterns", () => {
  describe("globToRegExp", () => {
    it("returns null for empty or whitespace patterns", () => {
      expect(globToRegExp("")).toBeNull();
      expect(globToRegExp("   ")).toBeNull();
    });

    it("matches basename patterns like .env", () => {
      const regex = globToRegExp(".env");
      expect(regex?.test(".env")).toBe(true);
      expect(regex?.test("env")).toBe(false);
    });
  });

  describe("isPathExcluded", () => {
    const patterns = compileExcludePatterns([
      ".env",
      ".env.*",
      "**/.env",
      "**/secrets/**",
      "*.pem",
    ]);

    it("excludes .env by basename", () => {
      expect(isPathExcluded("C:/project/src/.env", patterns, "src/.env")).toBe(
        true
      );
    });

    it("excludes .env.local via .env.*", () => {
      expect(
        isPathExcluded("/home/user/app/.env.local", patterns, ".env.local")
      ).toBe(true);
    });

    it("excludes nested secrets directories", () => {
      expect(
        isPathExcluded(
          "/home/user/app/config/secrets/token.txt",
          patterns,
          "config/secrets/token.txt"
        )
      ).toBe(true);
    });

    it("excludes pem files", () => {
      expect(isPathExcluded("/keys/id_rsa.pem", patterns, "id_rsa.pem")).toBe(
        true
      );
    });

    it("does not exclude unrelated files", () => {
      expect(
        isPathExcluded("/home/user/app/src/index.ts", patterns, "src/index.ts")
      ).toBe(false);
    });

    it("returns false when no patterns are configured", () => {
      expect(isPathExcluded("/any/.env", [])).toBe(false);
    });

    it("ignores invalid patterns safely", () => {
      const compiled = compileExcludePatterns(["", "   ", ".env"]);
      expect(compiled).toHaveLength(1);
      expect(isPathExcluded("/tmp/.env", compiled, ".env")).toBe(true);
    });
  });

  describe("normalizeExcludePatterns", () => {
    it("filters non-strings and blanks", () => {
      expect(
        normalizeExcludePatterns([".env", "  ", 1, null, "*.pem", "  x  "])
      ).toEqual([".env", "*.pem", "x"]);
    });

    it("returns empty array for non-arrays", () => {
      expect(normalizeExcludePatterns(undefined)).toEqual([]);
      expect(normalizeExcludePatterns("nope")).toEqual([]);
    });
  });
});
