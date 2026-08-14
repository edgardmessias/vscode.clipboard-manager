import { describe, expect, it } from "vitest";
import {
  applyMaxClips,
  isPinnedClip,
  moveClipToTop,
  placeAfterPinChange,
  sortClips,
} from "../../clipList";
import { createClipItem } from "../../storage/types";

function clip(value: string, partial: { id?: string; pinned?: boolean } = {}) {
  return createClipItem(value, {
    id: partial.id ?? value,
    pinned: partial.pinned,
  });
}

describe("clipList", () => {
  describe("sortClips", () => {
    it("should place pinned clips before unpinned clips", () => {
      const sorted = sortClips(
        [clip("b"), clip("a", { pinned: true }), clip("c", { pinned: true })],
        true
      );

      expect(sorted.map(c => c.value)).toEqual(["a", "c", "b"]);
    });

    it("should preserve list order when pinnedToTop is false", () => {
      const input = [clip("b"), clip("a", { pinned: true }), clip("c")];
      expect(sortClips(input, false).map(c => c.value)).toEqual([
        "b",
        "a",
        "c",
      ]);
    });
  });

  describe("applyMaxClips", () => {
    it("should trim only unpinned clips", () => {
      const result = applyMaxClips(
        [
          clip("pinned", { pinned: true }),
          clip("one"),
          clip("two"),
          clip("three"),
        ],
        2,
        true
      );

      expect(result.map(c => c.value)).toEqual(["pinned", "one"]);
    });

    it("should keep pinned clips in list order when pinnedToTop is false", () => {
      const result = applyMaxClips(
        [clip("one"), clip("pinned", { pinned: true }), clip("two")],
        2,
        false
      );

      expect(result.map(c => c.value)).toEqual(["one", "pinned"]);
    });

    it("should keep all pinned clips even when they exceed maxClips", () => {
      const result = applyMaxClips(
        [
          clip("p1", { pinned: true }),
          clip("p2", { pinned: true }),
          clip("u1"),
        ],
        1,
        true
      );

      expect(result.map(c => c.value)).toEqual(["p1", "p2"]);
    });
  });

  describe("moveClipToTop", () => {
    it("should move an unpinned clip to the top of the unpinned section", () => {
      const clips = [
        clip("pinned", { pinned: true }),
        clip("old"),
        clip("target"),
      ];
      const moved = moveClipToTop(clips, 2);

      expect(moved.map(c => c.value)).toEqual(["pinned", "target", "old"]);
    });

    it("should move an unpinned clip to the top when pinnedToTop is false", () => {
      const clips = [
        clip("pinned", { pinned: true }),
        clip("old"),
        clip("target"),
      ];
      const moved = moveClipToTop(clips, 2, false);

      expect(moved.map(c => c.value)).toEqual(["target", "pinned", "old"]);
    });

    it("should move a pinned clip to the top of the pinned section", () => {
      const clips = [
        clip("p1", { pinned: true }),
        clip("p2", { pinned: true }),
        clip("u1"),
      ];
      const moved = moveClipToTop(clips, 1);

      expect(moved.map(c => c.value)).toEqual(["p2", "p1", "u1"]);
    });
  });

  describe("placeAfterPinChange", () => {
    it("should move a newly pinned clip to the top of the pinned section", () => {
      const clips = [clip("a"), clip("b", { pinned: true })];
      const next = placeAfterPinChange(clips, "a", true);

      expect(next.map(c => c.value)).toEqual(["a", "b"]);
      expect(isPinnedClip(next[0])).toBe(true);
    });

    it("should move an unpinned clip to the top of the unpinned section", () => {
      const clips = [clip("a", { pinned: true }), clip("b", { pinned: true })];
      const next = placeAfterPinChange(clips, "b", false);

      expect(next.map(c => c.value)).toEqual(["a", "b"]);
      expect(isPinnedClip(next[0])).toBe(true);
      expect(isPinnedClip(next[1])).toBe(false);
    });
  });
});
