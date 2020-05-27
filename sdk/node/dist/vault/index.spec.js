"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
describe("vault module", () => {
    it("vault.installGuide should be string", () => {
        expect(index_1.vault.installGuide).toEqual(expect.any(String));
    });
    it("vault.fetch should work with sandbox", () => {
        expect(index_1.vault.fetch(async (get, list, s) => {
            return {
                appEnv: s.appEnv,
                clusterName: s.clusterName,
                another: s.another + 1000,
                example: (await get("common/data/test")).data,
            };
        }, {
            sandbox: {
                appEnv: 1234,
                another: 1234,
            },
        })).toStrictEqual(expect.objectContaining({
            appEnv: 1234,
            clusterName: index_1.vault.context.clusterName,
            another: 2234,
            example: expect.anything(),
        }));
    });
});
//# sourceMappingURL=index.spec.js.map