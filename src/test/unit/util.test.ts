import { leftPad, sleep } from "../../util";

describe("util", () => {
  describe("leftPad", () => {
    it("should left-pad numeric values with the requested fill character", () => {
      expect(leftPad(1, 3, "0")).toBe("001");
    });

    it("should left-pad strings with spaces by default", () => {
      expect(leftPad("ab", 4)).toBe("  ab");
    });
  });

  describe("sleep", () => {
    it("should resolve after the specified delay", async () => {
      const start = Date.now();
      await sleep(50);
      expect(Date.now() - start).toBeGreaterThanOrEqual(40);
    });
  });
});
