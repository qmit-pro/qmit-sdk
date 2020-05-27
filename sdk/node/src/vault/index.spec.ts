import { vault } from "./index";

describe("vault module", () => {
  it("vault.installGuide should be string", () => {
    expect(vault.installGuide).toEqual(expect.any(String));
  });

  it("vault.fetch should work with sandbox", () => {
    expect(vault.fetch(async (get, list, s = { appEnv: "dev", fuck: true } as any) => {
      return {
        env: "test",
        example: (await get("common/data/test")).data,
      };
    }, {
      sandbox: {
        appEnv: "test",
      },
    })).toStrictEqual(expect.objectContaining({
      env: "test",
      example: expect.anything(),
    }));
  })
});
