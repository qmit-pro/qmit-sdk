"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telepresence = exports.Telepresence = void 0;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const common_1 = require("../common");
class Telepresence extends common_1.SDKModule {
    constructor() {
        super(...arguments);
        this.minInstalledVersion = "v0.105";
        this.installGuide = `- Install telepresence CLI from: https://www.telepresence.io or "brew install telepresence" for macOS
`;
    }
    getInstalledVersion() {
        return common_1.exec("telepresence --version")
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                return `v${res.stdout.trim()}`;
            }
            else {
                return null;
            }
        })
            .catch(err => {
            this.context.logger.debug(err);
            return null;
        });
    }
    async getCurrentContext() {
        // TODO: enhance this logic
        const tmpPath = "/tmp";
        const filePaths = fs_1.default.readdirSync(tmpPath);
        let sessionId;
        for (const filePath of filePaths) {
            if (!filePath.startsWith("tel-"))
                continue;
            try {
                const sid = fs_1.default.readFileSync(path_1.default.join(tmpPath, filePath, "session_id.txt")).toString().trim();
                try {
                    const mountPath = path_1.default.join(tmpPath, filePath, "fs");
                    fs_1.default.statSync(mountPath);
                    if (fs_1.default.readdirSync(mountPath).length > 0) {
                        sessionId = sid;
                    }
                    else {
                        throw new Error();
                    }
                }
                catch (err) {
                    // remove dead telepresence session garbage
                    // this.context.logger.log(kleur.dim(`Deleting dead telepresence session: ${kleur.red(sid)}`));
                    // fs.rmdirSync(path.join(tmpPath, filePath), { recursive: true });
                }
            }
            catch {
            }
        }
        if (!sessionId) {
            return null;
        }
        return common_1.exec(`kubectl get deployment --selector=telepresence=${sessionId} -o json --all-namespaces`)
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                const doc = JSON.parse(res.stdout);
                const item = doc.items[0];
                return {
                    sessionId,
                    deployment: item || null,
                };
            }
            return null;
        }, () => {
            return {
                sessionId,
                deployment: null,
            };
        })
            .catch(err => {
            this.context.logger.debug(err);
            return null;
        });
    }
    async runCommand(args = []) {
        const oldSession = await this.getCurrentContext();
        if (oldSession) {
            const err = new Error("telepresence session already exists");
            err.data = oldSession;
            throw err;
        }
        const { childProcess } = await common_1.spawn(`telepresence`, `--also-proxy ${this.context.GCP_VPN_CIRD}`.split(" ").map(arg => arg.trim()).filter(arg => !!arg).concat(args), {
            detached: false,
            shell: false,
            stdio: [process.stdin, process.stdout, process.stderr],
        });
        process.once("beforeExit", () => childProcess.kill("SIGTERM"));
    }
}
exports.Telepresence = Telepresence;
const telepresence = new Telepresence();
exports.telepresence = telepresence;
//# sourceMappingURL=index.js.map