"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.open = void 0;
const tslib_1 = require("tslib");
var child_process_promise_1 = require("child-process-promise");
Object.defineProperty(exports, "exec", { enumerable: true, get: function () { return child_process_promise_1.exec; } });
Object.defineProperty(exports, "spawn", { enumerable: true, get: function () { return child_process_promise_1.spawn; } });
const open_1 = tslib_1.__importDefault(require("open"));
exports.open = open_1.default;
var interface_1 = require("./interface");
Object.defineProperty(exports, "SDKModule", { enumerable: true, get: function () { return interface_1.SDKModule; } });
//# sourceMappingURL=index.js.map