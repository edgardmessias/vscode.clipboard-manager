import { describe, expect, it } from "vitest";
import {
  clipToMetadata,
  createClipItem,
  metadataToClip,
  normalizeNote,
} from "../../storage/types";

describe("clip metadata pin and note", () => {
  it("should round-trip pinned and note through metadata helpers", () => {
    const clip = createClipItem("secret-token", {
      id: "clip-1",
      pinned: true,
      note: "  API key  ",
    });

    const metadata = clipToMetadata(clip);
    expect(metadata.pinned).toBe(true);
    expect(metadata.note).toBe("API key");

    const restored = metadataToClip(metadata, clip.value);
    expect(restored.pinned).toBe(true);
    expect(restored.note).toBe("API key");
  });

  it("should treat whitespace-only notes as unset", () => {
    expect(normalizeNote("   ")).toBeUndefined();
    expect(normalizeNote(undefined)).toBeUndefined();
  });
});
