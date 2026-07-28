import { leftPad, sleep } from "../../util";

describe("util", () => {
  it("leftPad pads values to the requested size", () => {
    expect(leftPad(1, 3, "0")).toBe("001");
    expect(leftPad("ab", 4)).toBe("  ab");
  });

  it("sleep resolves after the given delay", async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });
});
