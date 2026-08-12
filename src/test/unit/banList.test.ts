import { beforeEach, describe, expect, it, vi } from "vitest";
import { BanList } from "../../banList";
import { computeChecksum } from "../../storage/types";

describe("BanList", () => {
  let store: Map<string, string>;
  let secrets: {
    get: ReturnType<typeof vi.fn>;
    store: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = new Map();
    secrets = {
      get: vi.fn(async (key: string) => store.get(key)),
      store: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
    };
  });

  it("stores only checksums and blocks duplicates", async () => {
    const banList = new BanList(secrets as any);
    const checksum = computeChecksum("secret-password");

    expect(await banList.ban(checksum)).toBe(true);
    expect(await banList.ban(checksum)).toBe(false);
    expect(banList.has(checksum)).toBe(true);
    expect(banList.size).toBe(1);

    const persisted = store.get("clipboard-manager.bannedChecksums");
    expect(persisted).toBeTruthy();
    expect(persisted).not.toContain("secret-password");
    expect(JSON.parse(persisted!)).toEqual([checksum]);
  });

  it("unbans the last banned checksum in insertion order", async () => {
    const banList = new BanList(secrets as any);
    const first = computeChecksum("first");
    const second = computeChecksum("second");

    await banList.ban(first);
    await banList.ban(second);

    expect(await banList.unbanLast()).toBe(second);
    expect(banList.has(second)).toBe(false);
    expect(banList.has(first)).toBe(true);
    expect(banList.list()).toEqual([first]);

    expect(await banList.unbanLast()).toBe(first);
    expect(await banList.unbanLast()).toBeUndefined();
  });

  it("clears all bans", async () => {
    const banList = new BanList(secrets as any);
    await banList.ban(computeChecksum("a"));
    await banList.ban(computeChecksum("b"));

    expect(await banList.clear()).toBe(2);
    expect(banList.size).toBe(0);
    expect(JSON.parse(store.get("clipboard-manager.bannedChecksums")!)).toEqual(
      []
    );
  });

  it("reloads from SecretStorage", async () => {
    const checksum = computeChecksum("token");
    store.set("clipboard-manager.bannedChecksums", JSON.stringify([checksum]));

    const banList = new BanList(secrets as any);
    await banList.ensureLoaded();
    expect(banList.has(checksum)).toBe(true);
  });

  it("ignores corrupt secret payloads", async () => {
    store.set("clipboard-manager.bannedChecksums", "{not-json");
    const banList = new BanList(secrets as any);
    await banList.ensureLoaded();
    expect(banList.size).toBe(0);
  });
});
