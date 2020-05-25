"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vault = exports.Vault = void 0;
const tslib_1 = require("tslib");
const kleur_1 = tslib_1.__importDefault(require("kleur"));
const vault_sync_1 = tslib_1.__importDefault(require("vault-sync"));
const common_1 = require("../common");
class Vault extends common_1.SDKModule {
    constructor() {
        super(...arguments);
        this.minInstalledVersion = "v1.4.1";
        this.installGuide = `- Install vault CLI from https://www.vaultproject.io/downloads or "brew install vault" for macOS
- Add "export VAULT_ADDR=https://vault.internal.qmit.pro" into your login shell script for easy use of manual "vault" command.
- And ask an infrastructure manager to grant Vault permission to your G-suite account.
`;
        this.webInterfaceURL = `${this.context.VAULT_ADDRESS}/ui/vault/auth?with=oidc`;
    }
    async getInstalledVersion() {
        return common_1.exec(`vault --version`)
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                return `${res.stdout.split("Vault ")[1].split(" ")[0]}`.trim();
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
        })
            .catch(err => {
            this.context.logger.debug(err);
            return null;
        });
    }
    // Use this API for fetch secrets in application
    fetch(factory, opts) {
        const method = `k8s/${this.context.clusterName}`;
        const role = "default";
        this.context.logger.log(`Reading secrets from Vault with method=${kleur_1.default.green(method)} and role=${kleur_1.default.green(role)}`);
        return vault_sync_1.default(factory, {
            // vault connection setting
            uri: this.context.VAULT_ADDRESS,
            debug: !!(opts && opts.debug),
            // alternative auth method for kubernetes pod
            method,
            role,
        });
    }
}
exports.Vault = Vault;
const vault = new Vault();
exports.vault = vault;
//# sourceMappingURL=index.js.map