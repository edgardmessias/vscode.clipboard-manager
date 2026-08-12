import * as vscode from "vscode";

const SECRET_KEY = "clipboard-manager.bannedChecksums";

/**
 * Stores SHA-256 checksums of banned clip contents in SecretStorage.
 * Never stores plaintext clip values.
 * Order is insertion order (last banned is last in the list).
 */
export class BanList {
  private readonly _checksums: string[] = [];
  private _loaded = false;
  private _loadPromise?: Promise<void>;

  constructor(private readonly _secrets: vscode.SecretStorage) {}

  get size(): number {
    return this._checksums.length;
  }

  has(checksum: string): boolean {
    return this._checksums.includes(checksum);
  }

  async ensureLoaded(): Promise<void> {
    if (this._loaded) {
      return;
    }
    if (!this._loadPromise) {
      this._loadPromise = this.reload();
    }
    await this._loadPromise;
  }

  async reload(): Promise<void> {
    const raw = await this._secrets.get(SECRET_KEY);
    this._checksums.length = 0;

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          for (const item of parsed) {
            if (
              typeof item === "string" &&
              item.length > 0 &&
              !seen.has(item)
            ) {
              seen.add(item);
              this._checksums.push(item);
            }
          }
        }
      } catch {
        // Corrupt secret — start fresh rather than crash the extension.
        this._checksums.length = 0;
      }
    }

    this._loaded = true;
  }

  async ban(checksum: string): Promise<boolean> {
    await this.ensureLoaded();
    if (!checksum || this.has(checksum)) {
      return false;
    }
    this._checksums.push(checksum);
    await this.persist();
    return true;
  }

  async unban(checksum: string): Promise<boolean> {
    await this.ensureLoaded();
    const index = this._checksums.indexOf(checksum);
    if (index < 0) {
      return false;
    }
    this._checksums.splice(index, 1);
    await this.persist();
    return true;
  }

  /**
   * Removes the most recently banned checksum.
   * @returns the removed checksum, or undefined if the list was empty
   */
  async unbanLast(): Promise<string | undefined> {
    await this.ensureLoaded();
    if (this._checksums.length === 0) {
      return undefined;
    }
    const removed = this._checksums.pop();
    await this.persist();
    return removed;
  }

  async clear(): Promise<number> {
    await this.ensureLoaded();
    const removed = this._checksums.length;
    this._checksums.length = 0;
    await this.persist();
    return removed;
  }

  /** Insertion order (oldest → newest). */
  list(): string[] {
    return [...this._checksums];
  }

  private async persist(): Promise<void> {
    const payload = JSON.stringify(this.list());
    await this._secrets.store(SECRET_KEY, payload);
  }
}
