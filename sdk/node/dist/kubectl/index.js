"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kubectl = exports.Kubectl = void 0;
// import kleur from "kleur";
const common_1 = require("../common");
class Kubectl extends common_1.SDKModule {
    constructor() {
        super(...arguments);
        this.minInstalledVersion = "v1.14.10";
        this.installGuide = `- Install gcloud CLI from: https://cloud.google.com/sdk/install (Can install kubectl CLI together)
- Can enable auto-completion by: "kubectl completion <zsh, bash, ...>"
- Can install krew; kubectl plugin manager from: https://krew.sigs.k8s.io
`;
    }
    getInstalledVersion() {
        return common_1.exec("kubectl version -o json")
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                return `${JSON.parse(res.stdout).clientVersion.gitVersion}`;
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
        return common_1.exec(`kubectl config view -o json`)
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                const doc = JSON.parse(res.stdout);
                const item = doc.contexts.find((c) => c.name === doc["current-context"]);
                if (item) {
                    if (!item.context.namespace) {
                        item.context.namespace = null;
                    }
                    return {
                        ...item.context,
                    };
                }
            }
            return null;
        })
            .catch(err => {
            this.context.logger.debug(err);
            return null;
        });
    }
}
exports.Kubectl = Kubectl;
const kubectl = new Kubectl();
exports.kubectl = kubectl;
//# sourceMappingURL=index.js.map