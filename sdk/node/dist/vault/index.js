"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vault = void 0;
const tslib_1 = require("tslib");
const common_1 = require("../common");
const vault_sync_1 = tslib_1.__importDefault(require("vault-sync"));
class Vault extends common_1.SDKModule {
    constructor() {
        super(...arguments);
        this.minInstalledVersion = "v1.4.1";
        this.installGuide = `
- Install vault CLI from https://www.vaultproject.io/downloads or brew install vault for macOS
- Add "export VAULT_ADDR=https://vault.internal.qmit.pro" into your login shell script for easy use of "vault" command.
`;
    }
    async getInstalledVersion() {
        return common_1.exec(`vault --version`)
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                return `${res.stdout.split("Vault ")[1]}`.trim();
            }
            else {
                return null;
            }
        }, () => null);
    }
    login() {
        return common_1.exec(`vault login -address=${this.context.VAULT_ADDRESS} -method=oidc`)
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                return this.loginStatus();
            }
            else {
                throw res.stderr;
            }
        });
    }
    loginStatus() {
        return common_1.exec(`vault token lookup -format json -address=${this.context.VAULT_ADDRESS}`)
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                return JSON.parse(res.stdout).data;
            }
            else {
                throw res.stderr;
            }
        });
    }
    fetch(factory) {
        return vault_sync_1.default(factory, {
            // vault connection setting
            uri: this.context.VAULT_ADDRESS,
            debug: false,
            // alternative auth method for kubernetes pod
            method: `k8s/${this.context.appKubernetesCluster}`,
            role: "default",
        });
    }
    openWebInterface() {
        return common_1.exec(`open ${this.context.VAULT_ADDRESS}/ui/vault/auth?with=oidc`).then(() => undefined);
    }
}
exports.Vault = Vault;
const singletonVault = new Vault();
// console.log(
//   singletonVault.fetch(async (get, list) => {
//     return get("common/data/services");
//   })
// );
// singletonVault.loginStatus().then(console.log);
// singletonVault.login().then(console.log);
// singletonVault.getInstalledVersion().then(console.log);
// singletonVault.openWebInterface().then(console.log);
exports.default = singletonVault;
//# sourceMappingURL=index.js.map