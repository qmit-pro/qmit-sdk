import { vault } from "./index";

describe("vault module", () => {
  it("vault.installGuide should be string", () => {
    expect(vault.installGuide).toEqual(expect.any(String));
  });
});

// ...
