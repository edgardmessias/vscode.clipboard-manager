import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";
import { AppendLogStorage } from "../../storage/appendLogStorage";
import {
  legacyClipToPartial,
  normalizeLegacyStore,
  parseLegacyJson,
} from "../../storage/jsonMonolithStorage";
import { migrateLegacyToV3 } from "../../storage/migrate";
import {
  buildTitle,
  computeChecksum,
  createClipItem,
  INDEX_FILENAME,
  VALUES_FILENAME,
} from "../../storage/types";

describe("Clip metadata helpers", () => {
  describe("buildTitle", () => {
    it("should collapse whitespace and trim surrounding space", () => {
      const value = "  hello\n\nworld  ";
      expect(buildTitle(value)).toBe("hello world");
    });

    it("should truncate titles longer than 120 characters", () => {
      expect(buildTitle("a".repeat(200))).toHaveLength(120);
    });
  });

  describe("computeChecksum", () => {
    it("should return a stable SHA-256 hex digest for the same input", () => {
      const first = computeChecksum("same value");
      const second = computeChecksum("same value");
      const other = computeChecksum("other value");

      expect(first).toBe(second);
      expect(first).not.toBe(other);
      expect(first).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

describe("Legacy JSON migration", () => {
  describe("normalizeLegacyStore", () => {
    it("should map version 1 clip fields to the current schema", () => {
      const store = normalizeLegacyStore({
        version: 1,
        clips: [
          {
            value: "legacy",
            timestamp: 100,
            location: {
              uri: "file:///tmp/a.ts",
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 1 },
              },
            },
          },
        ],
      });

      expect(store.clips[0].createdAt).toBe(100);
      expect(store.clips[0].copyCount).toBe(1);
      expect(store.clips[0].useCount).toBe(0);
      expect(store.clips[0].createdLocation?.uri).toBe("file:///tmp/a.ts");
    });
  });

  describe("migrateLegacyToV3", () => {
    it("should convert legacy store clips into v3 clip items", async () => {
      const clips = await migrateLegacyToV3({
        version: 2,
        clips: [
          {
            value: "alpha",
            createdAt: 10,
            copyCount: 2,
            useCount: 3,
          },
        ],
      });

      expect(clips).toHaveLength(1);
      expect(clips[0].value).toBe("alpha");
      expect(clips[0].title).toBe("alpha");
      expect(clips[0].checksum).toBe(computeChecksum("alpha"));
      expect(clips[0].useCount).toBe(3);
    });
  });

  describe("parseLegacyJson", () => {
    it("should return null for malformed or incomplete legacy payloads", () => {
      expect(parseLegacyJson("{invalid")).toBeNull();
      expect(parseLegacyJson({ version: 2 })).toBeNull();
    });
  });
});

describe("AppendLogStorage", () => {
  let tempRoot = "";
  let storage: AppendLogStorage;
  let globalStateValue: unknown;

  const createStorage = () =>
    new AppendLogStorage({
      context: {
        storagePath: path.join(tempRoot, "workspaceStorage", "session"),
        globalState: {
          get: vi.fn((key: string) =>
            key === "clips" ? globalStateValue : undefined
          ),
          update: vi.fn(),
        },
      } as unknown as vscode.ExtensionContext,
      getSaveTo: () => null,
      getStorageRoot: () => tempRoot,
    });

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "clipboard-storage-"));
    globalStateValue = undefined;
    storage = createStorage();
  });

  afterEach(async () => {
    await storage.dispose();
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  describe("save and load", () => {
    it("should persist clips and restore them with byte offsets", async () => {
      const clips = [
        createClipItem("first clip"),
        createClipItem("second clip"),
      ];

      await storage.save(clips, true);

      const loaded = await storage.load();
      expect(loaded).toHaveLength(2);
      expect(loaded[0].value).toBe("first clip");
      expect(loaded[1].value).toBe("second clip");
      expect(loaded[0].offset).toBeTypeOf("number");
      expect(loaded[0].length).toBeGreaterThan(0);
    });

    it("should reuse value offsets for duplicate checksums", async () => {
      const first = createClipItem("duplicate");
      await storage.save([first], true);

      const loaded = await storage.load();
      const duplicate = {
        ...loaded[0],
        copyCount: loaded[0].copyCount + 1,
      };

      const paths = storage.resolvePaths();
      expect(paths).not.toBe(false);
      if (!paths) {
        return;
      }

      const valuesBefore = await fs.readFile(paths.valuesPath);

      await storage.save([duplicate], true);

      const valuesAfter = await fs.readFile(paths.valuesPath);
      expect(valuesAfter.length).toBe(valuesBefore.length);
    });
  });

  describe("migration from legacy files", () => {
    it("should import clipboard.history.json into v3 index and values files", async () => {
      const legacyPath = path.join(tempRoot, "clipboard.history.json");
      await fs.writeFile(
        legacyPath,
        JSON.stringify({
          version: 2,
          clips: [
            {
              value: "from-json",
              createdAt: 42,
              copyCount: 1,
              useCount: 2,
            },
          ],
        })
      );

      const loaded = await storage.load();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].value).toBe("from-json");
      expect(loaded[0].useCount).toBe(2);

      const paths = storage.resolvePaths();
      expect(paths).not.toBe(false);
      if (!paths) {
        return;
      }

      await expect(fs.access(paths.indexPath)).resolves.toBeUndefined();
      await expect(fs.access(paths.valuesPath)).resolves.toBeUndefined();
      await expect(fs.access(legacyPath)).rejects.toThrow();
    });
  });

  describe("prune", () => {
    it("should remove orphaned values while keeping active clip metadata", async () => {
      const first = createClipItem("keep me");
      const second = createClipItem("remove me");

      await storage.save([first, second], true);
      await storage.save([first], true);

      const paths = storage.resolvePaths();
      expect(paths).not.toBe(false);
      if (!paths) {
        return;
      }

      const valuesBefore = await fs.readFile(paths.valuesPath);

      await storage.prune(true);

      const valuesAfter = await fs.readFile(paths.valuesPath);
      expect(valuesAfter.length).toBeLessThan(valuesBefore.length);

      const loaded = await storage.load();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].value).toBe("keep me");
      expect(loaded[0].checksum).toBe(first.checksum);
      expect(loaded[0].title).toBe(first.title);
    });
  });

  describe("custom storage path", () => {
    it("should write index and values files to saveTo when configured", async () => {
      const customDir = path.join(tempRoot, "custom-storage");
      storage = new AppendLogStorage({
        context: {
          storagePath: path.join(tempRoot, "workspaceStorage", "session"),
          globalState: { get: vi.fn(), update: vi.fn() },
        } as unknown as vscode.ExtensionContext,
        getSaveTo: () => customDir,
        getStorageRoot: () => tempRoot,
      });

      await storage.save([createClipItem("custom path")], true);

      await expect(
        fs.access(path.join(customDir, INDEX_FILENAME))
      ).resolves.toBeUndefined();
      await expect(
        fs.access(path.join(customDir, VALUES_FILENAME))
      ).resolves.toBeUndefined();
    });
  });
});

describe("legacyClipToPartial", () => {
  it("should preserve copyCount and useCount from legacy clip records", () => {
    const partial = legacyClipToPartial({
      value: "x",
      createdAt: 1,
      copyCount: 4,
      useCount: 7,
    });

    expect(partial.useCount).toBe(7);
    expect(partial.copyCount).toBe(4);
  });
});
