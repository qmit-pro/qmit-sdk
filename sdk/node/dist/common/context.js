"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.context = exports.Context = void 0;
const tslib_1 = require("tslib");
const kleur_1 = tslib_1.__importDefault(require("kleur"));
const path_1 = tslib_1.__importDefault(require("path"));
const os_1 = tslib_1.__importDefault(require("os"));
const fs_1 = tslib_1.__importDefault(require("fs"));
class Context {
    constructor() {
        this.version = `v${JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, "../../../../package.json")).toString()).version}`.trim();
        this.envVarName = {
            debug: "QMIT_SDK_DEBUG",
            appEnv: "QMIT_APP_ENV",
            clusterName: "QMIT_CLUSTER_NAME",
        };
        this.VAULT_ADDRESS = "https://vault.internal.qmit.pro";
        this.GCP_PROJECT_ID = "qmit-pro";
        this.GCP_VPN_CIRD = "10.0.0.0/8";
        this.GCP_REDIS_REGION = "asia-northeast1";
        this.GKE_APP_CLUSTER_MAP = {
            dev: ["dev",],
            prod: ["prod",],
        };
        this.GKE_CLUSTER_ZONE_MAP = {
            dev: "asia-northeast1-a",
            prod: "asia-northeast1-a",
            /* dev2, dev3, prod2, prod3, ... later */
            internal: "asia-northeast1-a",
        };
        // AppEnv means application deployment stage. It is a symbol.
        this.appEnvs = Object.keys(this.GKE_APP_CLUSTER_MAP);
        this.appEnv = this.appEnvs[0];
        // ClusterName means name of real cluster among many of them. It is a real instance.
        this.clusterNames = Object.values(this.GKE_APP_CLUSTER_MAP).reduce((a, b) => a.concat(b), []);
        this.clusterName = this.getClusterNamesInAppEnv(this.appEnv)[0];
        this.debugIgnoredConsole = {
            ...console,
            debug(...args) { },
        };
        this.configFilePath = path_1.default.join(os_1.default.homedir(), ".qmit-sdk");
        this.contextChangeListeners = new Set();
        this.logger.debug(`Creating QMIT SDK Context...`);
        const config = this.readConfig();
        let appEnv;
        let clusterName;
        this.logger.debug(kleur_1.default.dim(`Try to read ${kleur_1.default.green(this.envVarName.appEnv)} from process environment variable.`));
        if (process.env[this.envVarName.appEnv]) {
            appEnv = process.env[this.envVarName.appEnv];
        }
        else {
            appEnv = config && config.context && config.context.appEnv || this.appEnvs[0];
            this.logger.debug(kleur_1.default.dim(`Failed to read environment variable, use ${kleur_1.default.blue(appEnv)} as ${this.envVarName.appEnv}`));
        }
        this.logger.debug(kleur_1.default.dim(`Try to read ${kleur_1.default.green(this.envVarName.clusterName)} from process environment variable.`));
        if (process.env[this.envVarName.clusterName]) {
            clusterName = process.env[this.envVarName.clusterName];
        }
        else {
            clusterName = config && config.context && config.context.clusterName || this.clusterNames[0];
            this.logger.debug(kleur_1.default.dim(`Failed to read environment variable, use ${kleur_1.default.blue(clusterName)} as ${this.envVarName.clusterName}`));
        }
        try {
            this.setContext({ appEnv, clusterName });
        }
        catch (err) {
            this.logger.error(err);
            this.logger.log("Fallback to default appEnv and clusterName");
            this.setContext();
            this.writeConfig();
        }
        if (!config) {
            this.writeConfig();
        }
        this.logger.debug(kleur_1.default.dim(`QMIT SDK Context created...\n`));
    }
    getClusterNamesInAppEnv(appEnv) {
        return this.GKE_APP_CLUSTER_MAP[appEnv] || [];
    }
    getAppEnvOfClusterName(clusterName) {
        return Object.keys(this.GKE_APP_CLUSTER_MAP)
            .find(appEnv => this.GKE_APP_CLUSTER_MAP[appEnv].includes(clusterName));
    }
    get clusterZone() {
        return this.getClusterZone(this.clusterName);
    }
    getClusterZone(clusterName) {
        return this.GKE_CLUSTER_ZONE_MAP[clusterName];
    }
    get clusterFullName() {
        return this.getClusterFullName(this.clusterName);
    }
    getClusterFullName(clusterName) {
        return `gke_${this.GCP_PROJECT_ID}_${this.GKE_CLUSTER_ZONE_MAP[clusterName]}_${clusterName}`;
    }
    get logger() {
        return process.env[this.envVarName.debug] ? console : this.debugIgnoredConsole;
    }
    readConfig() {
        try {
            return JSON.parse(fs_1.default.readFileSync(this.configFilePath).toString("utf-8"));
        }
        catch {
            this.logger.log(kleur_1.default.dim(`Failed to read ${kleur_1.default.green(this.configFilePath)} file.`));
        }
    }
    writeConfig() {
        const file = {
            context: {
                appEnv: this.appEnv,
                clusterName: this.clusterName,
            },
        };
        fs_1.default.writeFileSync(this.configFilePath, JSON.stringify(file, null, 2));
        this.logger.log(kleur_1.default.dim(`Succeed to write ${kleur_1.default.green(this.configFilePath)} file.`));
    }
    setContext(ctx = {}) {
        let appEnv;
        let clusterName;
        let clusterNamesInAppEnv;
        if (ctx.appEnv && ctx.clusterName) {
            appEnv = ctx.appEnv;
            clusterNamesInAppEnv = this.getClusterNamesInAppEnv(appEnv);
            clusterName = ctx.clusterName;
        }
        else if (ctx.appEnv) {
            appEnv = ctx.appEnv;
            clusterNamesInAppEnv = this.getClusterNamesInAppEnv(appEnv);
            clusterName = clusterNamesInAppEnv[0];
        }
        else if (ctx.clusterName) {
            clusterName = ctx.clusterName;
            appEnv = this.getAppEnvOfClusterName(clusterName);
            clusterNamesInAppEnv = this.getClusterNamesInAppEnv(appEnv);
        }
        else {
            appEnv = this.appEnvs[0];
            clusterNamesInAppEnv = this.getClusterNamesInAppEnv(appEnv);
            clusterName = clusterNamesInAppEnv[0];
        }
        if (!this.clusterNames.includes(clusterName)) {
            throw new Error(`Invalid ClusterEnv: ${kleur_1.default.red(clusterName)} among ${this.clusterNames.join(", ")}`);
        }
        if (!this.appEnvs.includes(appEnv)) {
            throw new Error(`Invalid AppEnv: ${kleur_1.default.red(appEnv)} among ${this.appEnvs.join(", ")}`);
        }
        if (!clusterNamesInAppEnv.includes(clusterName)) {
            throw new Error(`Invalid ClusterEnv in ${kleur_1.default.blue(appEnv)} AppEnv: ${kleur_1.default.red(clusterName)} among ${clusterNamesInAppEnv.join(", ")}`);
        }
        this.appEnv = appEnv;
        this.clusterName = clusterName;
        this.logger.debug(`Set appEnv=${kleur_1.default.blue(`${this.appEnv}`)}, clusterName=${kleur_1.default.blue(`${this.clusterName}`)}`);
        for (const listener of this.contextChangeListeners.values()) {
            listener({ appEnv, clusterName }).catch(err => this.logger.error(err));
        }
    }
    addContextChangeListener(listener) {
        this.contextChangeListeners.add(listener);
    }
    removeContextChangeListener(listener) {
        this.contextChangeListeners.delete(listener);
    }
}
exports.Context = Context;
const context = new Context();
exports.context = context;
//# sourceMappingURL=context.js.map