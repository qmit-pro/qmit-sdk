"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = tslib_1.__importDefault(require("./index"));
describe("vault module", () => {
    it("vault.installGuide should be string", () => {
        expect(index_1.default.installGuide).toEqual(expect.any(String));
    });
});
// ...
//# sourceMappingURL=index.spec.js.map