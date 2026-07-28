import { vi } from "vitest";

vi.mock("vscode", async () => {
  return await import("./mocks/vscode");
});
