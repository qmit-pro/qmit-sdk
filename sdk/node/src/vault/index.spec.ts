import { vault } from "./index";

describe("vault module", () => {
  it("vault.installGuide should be string", () => {
    expect(vault.installGuide).toEqual(expect.any(String));
  });

  it("vault.fetch should work with sandbox", () => {
    expect(vault.fetch(async (get, list, s) => {
      return {
        appEnv: s.appEnv,
        clusterName: s.clusterName,
        another: s.another + 1000,
        example: (await get("common/data/test")).data,
      };
    }, {
      sandbox: {
        appEnv: 1234, // overriding
        another: 1234,
      },
    })).toStrictEqual(expect.objectContaining({
      appEnv: 1234, // overrided
      clusterName: vault.context.clusterName, // match with default one
      another: 2234,
      example: expect.anything(),
    }));
  })
});
