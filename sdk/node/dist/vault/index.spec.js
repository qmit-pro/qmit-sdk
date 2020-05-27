"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
describe("vault module", () => {
    it("vault.installGuide should be string", () => {
        expect(index_1.vault.installGuide).toEqual(expect.any(String));
    });
    it("vault.fetch should work with sandbox", () => {
        expect(index_1.vault.fetch(async (get, list, s = { appEnv: "dev", fuck: true }) => {
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
    });
});
//# sourceMappingURL=index.spec.js.map